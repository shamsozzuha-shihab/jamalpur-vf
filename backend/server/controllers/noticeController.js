const Notice = require('../models/Notice');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/cloudinaryUpload');
const fs = require('fs');

class NoticeController {
  // Get all notices (public)
  async getAllNotices(req, res) {
    try {
      const { page = 1, limit = 10, priority, search } = req.query;
      const skip = (page - 1) * limit;

      // Build query
      let query = { isActive: true };
      
      if (priority) {
        query.priority = priority;
      }
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { author: { $regex: search, $options: 'i' } }
        ];
      }

      const notices = await Notice.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await Notice.countDocuments(query);

      res.json({
        success: true,
        data: {
          notices,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get all notices error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching notices' 
      });
    }
  }

  // Get single notice by ID
  async getNoticeById(req, res) {
    try {
      const { id } = req.params;
      const notice = await Notice.findById(id);

      if (!notice) {
        return res.status(404).json({ 
          success: false, 
          message: 'Notice not found' 
        });
      }

      if (!notice.isActive) {
        return res.status(404).json({ 
          success: false, 
          message: 'Notice not found' 
        });
      }

      // Increment view count
      await notice.incrementViewCount();

      res.json({
        success: true,
        data: { notice }
      });
    } catch (error) {
      console.error('Get notice by ID error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching notice' 
      });
    }
  }

  // Create new notice (admin only)
  async createNotice(req, res) {
    try {
      const { title, content, author, priority = 'normal', tags } = req.body;

      if (!title || !content || !author) {
        return res.status(400).json({ 
          success: false, 
          message: 'Title, content, and author are required' 
        });
      }

      const noticeData = {
        title,
        content,
        author,
        priority,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : []
      };

      // Handle PDF file upload if present
      if (req.file) {
        try {
          const cloudinaryResult = await uploadToCloudinary(req.file.path);
          noticeData.pdfFile = {
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

      const notice = new Notice(noticeData);
      await notice.save();

      res.status(201).json({
        success: true,
        message: 'Notice created successfully',
        data: { notice }
      });
    } catch (error) {
      console.error('Create notice error:', error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ 
        success: false, 
        message: 'Server error while creating notice' 
      });
    }
  }

  // Update notice (admin only)
  async updateNotice(req, res) {
    try {
      const { id } = req.params;
      const { title, content, author, priority, tags, isActive } = req.body;

      const notice = await Notice.findById(id);
      if (!notice) {
        return res.status(404).json({ 
          success: false, 
          message: 'Notice not found' 
        });
      }

      // Update fields
      if (title) notice.title = title;
      if (content) notice.content = content;
      if (author) notice.author = author;
      if (priority) notice.priority = priority;
      if (tags) notice.tags = tags.split(',').map(tag => tag.trim());
      if (typeof isActive === 'boolean') notice.isActive = isActive;

      // Handle new PDF file upload if present
      if (req.file) {
        try {
          // Delete old PDF from Cloudinary if exists
          if (notice.pdfFile && notice.pdfFile.publicId) {
            await deleteFromCloudinary(notice.pdfFile.publicId);
          }

          // Upload new PDF
          const cloudinaryResult = await uploadToCloudinary(req.file.path);
          notice.pdfFile = {
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
            message: 'Failed to upload new PDF file' 
          });
        }
      }

      await notice.save();

      res.json({
        success: true,
        message: 'Notice updated successfully',
        data: { notice }
      });
    } catch (error) {
      console.error('Update notice error:', error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ 
        success: false, 
        message: 'Server error while updating notice' 
      });
    }
  }

  // Delete notice (admin only)
  async deleteNotice(req, res) {
    try {
      const { id } = req.params;
      const notice = await Notice.findById(id);

      if (!notice) {
        return res.status(404).json({ 
          success: false, 
          message: 'Notice not found' 
        });
      }

      // Delete PDF from Cloudinary if exists
      if (notice.pdfFile && notice.pdfFile.publicId) {
        await deleteFromCloudinary(notice.pdfFile.publicId);
      }

      await Notice.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Notice deleted successfully'
      });
    } catch (error) {
      console.error('Delete notice error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while deleting notice' 
      });
    }
  }

  // Get notices by priority
  async getNoticesByPriority(req, res) {
    try {
      const { priority } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      if (!['high', 'normal', 'low'].includes(priority)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid priority level' 
        });
      }

      const notices = await Notice.find({ 
        isActive: true, 
        priority 
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await Notice.countDocuments({ 
        isActive: true, 
        priority 
      });

      res.json({
        success: true,
        data: {
          notices,
          priority,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get notices by priority error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching notices by priority' 
      });
    }
  }

  // Get high priority notices
  async getHighPriorityNotices(req, res) {
    try {
      const notices = await Notice.getByPriority('high');
      res.json({
        success: true,
        data: { notices }
      });
    } catch (error) {
      console.error('Get high priority notices error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching high priority notices' 
      });
    }
  }

  // Search notices
  async searchNotices(req, res) {
    try {
      const { q, page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      if (!q) {
        return res.status(400).json({ 
          success: false, 
          message: 'Search query is required' 
        });
      }

      const query = {
        isActive: true,
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { content: { $regex: q, $options: 'i' } },
          { author: { $regex: q, $options: 'i' } },
          { tags: { $in: [new RegExp(q, 'i')] } }
        ]
      };

      const notices = await Notice.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await Notice.countDocuments(query);

      res.json({
        success: true,
        data: {
          notices,
          query: q,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Search notices error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while searching notices' 
      });
    }
  }
}

module.exports = new NoticeController();
