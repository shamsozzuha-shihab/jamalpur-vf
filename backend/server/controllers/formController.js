const FormSubmission = require('../models/FormSubmission');
const { uploadToCloudinary } = require('../middleware/cloudinaryUpload');
const fs = require('fs');

class FormController {
  // Submit form with file
  async submitFormWithFile(req, res) {
    try {
      const { name, email, phone, message, category = 'general', address = '' } = req.body;

      // Validate required fields
      if (!name || !email || !phone || !message) {
        return res.status(400).json({ 
          success: false, 
          message: 'Name, email, phone, and message are required' 
        });
      }

      const submissionData = {
        name,
        email,
        phone,
        message,
        category,
        address
      };

      // Handle PDF file upload if present
      if (req.file) {
        try {
          const cloudinaryResult = await uploadToCloudinary(req.file.path);
          submissionData.pdfFile = {
            publicId: cloudinaryResult.public_id,
            originalName: req.file.originalname,
            url: cloudinaryResult.secure_url,
            size: cloudinaryResult.bytes,
            mimetype: req.file.mimetype,
          };
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError);
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to upload PDF file' 
          });
        }
      }

      const submission = new FormSubmission(submissionData);
      await submission.save();

      res.status(201).json({
        success: true,
        message: 'Form submitted successfully',
        data: { submission: submission.summary }
      });
    } catch (error) {
      console.error('Form submission with file error:', error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ 
        success: false, 
        message: 'Server error during form submission' 
      });
    }
  }

  // Submit form without file
  async submitForm(req, res) {
    try {
      const { name, email, phone, message, category = 'general', address = '' } = req.body;

      // Validate required fields
      if (!name || !email || !phone || !message) {
        return res.status(400).json({ 
          success: false, 
          message: 'Name, email, phone, and message are required' 
        });
      }

      const submission = new FormSubmission({
        name,
        email,
        phone,
        message,
        category,
        address
      });

      await submission.save();

      res.status(201).json({
        success: true,
        message: 'Form submitted successfully',
        data: { submission: submission.summary }
      });
    } catch (error) {
      console.error('Form submission error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error during form submission' 
      });
    }
  }

  // Get all form submissions (admin only)
  async getAllSubmissions(req, res) {
    try {
      const { page = 1, limit = 10, status, category, search } = req.query;
      const skip = (page - 1) * limit;

      // Build query
      let query = {};
      
      if (status) {
        query.status = status;
      }
      
      if (category) {
        query.category = category;
      }
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { message: { $regex: search, $options: 'i' } }
        ];
      }

      const submissions = await FormSubmission.find(query)
        .populate('reviewedBy', 'name email')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await FormSubmission.countDocuments(query);

      res.json({
        success: true,
        data: {
          submissions,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get all submissions error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching submissions' 
      });
    }
  }

  // Get single submission by ID (admin only)
  async getSubmissionById(req, res) {
    try {
      const { id } = req.params;
      const submission = await FormSubmission.findById(id)
        .populate('reviewedBy', 'name email');

      if (!submission) {
        return res.status(404).json({ 
          success: false, 
          message: 'Form submission not found' 
        });
      }

      res.json({
        success: true,
        data: { submission }
      });
    } catch (error) {
      console.error('Get submission by ID error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching submission' 
      });
    }
  }

  // Update submission status (admin only)
  async updateSubmissionStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;
      const reviewerId = req.user.userId;

      if (!status || !['pending', 'reviewed', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Valid status is required (pending, reviewed, approved, rejected)' 
        });
      }

      const submission = await FormSubmission.findById(id);
      if (!submission) {
        return res.status(404).json({ 
          success: false, 
          message: 'Form submission not found' 
        });
      }

      submission.status = status;
      submission.reviewedBy = reviewerId;
      submission.reviewedAt = new Date();
      if (adminNotes) submission.adminNotes = adminNotes;

      await submission.save();

      res.json({
        success: true,
        message: 'Submission status updated successfully',
        data: { submission }
      });
    } catch (error) {
      console.error('Update submission status error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while updating submission status' 
      });
    }
  }

  // Delete submission (admin only)
  async deleteSubmission(req, res) {
    try {
      const { id } = req.params;
      const submission = await FormSubmission.findById(id);

      if (!submission) {
        return res.status(404).json({ 
          success: false, 
          message: 'Form submission not found' 
        });
      }

      // Delete PDF from Cloudinary if exists
      if (submission.pdfFile && submission.pdfFile.publicId) {
        const { deleteFromCloudinary } = require('../middleware/cloudinaryUpload');
        await deleteFromCloudinary(submission.pdfFile.publicId);
      }

      await FormSubmission.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Form submission deleted successfully'
      });
    } catch (error) {
      console.error('Delete submission error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while deleting submission' 
      });
    }
  }

  // Get submissions by status
  async getSubmissionsByStatus(req, res) {
    try {
      const { status } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      if (!['pending', 'reviewed', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid status' 
        });
      }

      const submissions = await FormSubmission.find({ status })
        .populate('reviewedBy', 'name email')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await FormSubmission.countDocuments({ status });

      res.json({
        success: true,
        data: {
          submissions,
          status,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get submissions by status error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching submissions by status' 
      });
    }
  }

  // Get submissions by category
  async getSubmissionsByCategory(req, res) {
    try {
      const { category } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      const submissions = await FormSubmission.find({ category })
        .populate('reviewedBy', 'name email')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await FormSubmission.countDocuments({ category });

      res.json({
        success: true,
        data: {
          submissions,
          category,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get submissions by category error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching submissions by category' 
      });
    }
  }

  // Get submission statistics (admin only)
  async getSubmissionStats(req, res) {
    try {
      const stats = await FormSubmission.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const categoryStats = await FormSubmission.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        }
      ]);

      const totalSubmissions = await FormSubmission.countDocuments();
      const submissionsWithFiles = await FormSubmission.countDocuments({
        'pdfFile.url': { $exists: true }
      });

      res.json({
        success: true,
        data: {
          totalSubmissions,
          submissionsWithFiles,
          statusBreakdown: stats,
          categoryBreakdown: categoryStats
        }
      });
    } catch (error) {
      console.error('Get submission stats error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching submission statistics' 
      });
    }
  }
}

module.exports = new FormController();
