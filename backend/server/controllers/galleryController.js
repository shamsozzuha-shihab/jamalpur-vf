const GalleryImage = require('../models/GalleryImage');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/cloudinaryUpload');
const fs = require('fs');

class GalleryController {
  // Get all gallery images (public)
  async getAllImages(req, res) {
    try {
      const { page = 1, limit = 12, category, search } = req.query;
      const skip = (page - 1) * limit;

      // Build query
      let query = { isActive: true };
      
      if (category) {
        query.category = category;
      }
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }

      const images = await GalleryImage.find(query)
        .sort({ order: 1, uploadedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await GalleryImage.countDocuments(query);

      res.json({
        success: true,
        data: {
          images,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get all gallery images error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching gallery images' 
      });
    }
  }

  // Get single image by ID
  async getImageById(req, res) {
    try {
      const { id } = req.params;
      const image = await GalleryImage.findById(id);

      if (!image) {
        return res.status(404).json({ 
          success: false, 
          message: 'Gallery image not found' 
        });
      }

      if (!image.isActive) {
        return res.status(404).json({ 
          success: false, 
          message: 'Gallery image not found' 
        });
      }

      // Increment view count
      await image.incrementViewCount();

      res.json({
        success: true,
        data: { image }
      });
    } catch (error) {
      console.error('Get gallery image by ID error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching gallery image' 
      });
    }
  }

  // Upload new gallery image (admin only)
  async uploadImage(req, res) {
    try {
      const { title, description, altText, category = 'meeting', tags } = req.body;
      const uploadedBy = req.user.userId;

      if (!title || !description || !altText) {
        return res.status(400).json({ 
          success: false, 
          message: 'Title, description, and alt text are required' 
        });
      }

      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: 'Image file is required' 
        });
      }

      // Upload image to Cloudinary
      let imageUrl;
      try {
        const cloudinaryResult = await uploadToCloudinary(req.file.path, {
          folder: 'jamalpur-chamber/gallery',
          resource_type: 'image',
          quality: 'auto',
          fetch_format: 'auto'
        });
        imageUrl = cloudinaryResult.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to upload image' 
        });
      }

      // Get the next order number
      const lastImage = await GalleryImage.findOne({}, {}, { sort: { order: -1 } });
      const nextOrder = lastImage ? lastImage.order + 1 : 1;

      const imageData = {
        title,
        description,
        altText,
        category,
        imageUrl,
        uploadedBy,
        order: nextOrder,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : []
      };

      const image = new GalleryImage(imageData);
      await image.save();

      res.status(201).json({
        success: true,
        message: 'Gallery image uploaded successfully',
        data: { image }
      });
    } catch (error) {
      console.error('Upload gallery image error:', error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ 
        success: false, 
        message: 'Server error while uploading gallery image' 
      });
    }
  }

  // Update gallery image (admin only)
  async updateImage(req, res) {
    try {
      const { id } = req.params;
      const { title, description, altText, category, tags, isActive, order } = req.body;

      const image = await GalleryImage.findById(id);
      if (!image) {
        return res.status(404).json({ 
          success: false, 
          message: 'Gallery image not found' 
        });
      }

      // Update fields
      if (title) image.title = title;
      if (description) image.description = description;
      if (altText) image.altText = altText;
      if (category) image.category = category;
      if (tags) image.tags = tags.split(',').map(tag => tag.trim());
      if (typeof isActive === 'boolean') image.isActive = isActive;
      if (order !== undefined) image.order = parseInt(order);

      await image.save();

      res.json({
        success: true,
        message: 'Gallery image updated successfully',
        data: { image }
      });
    } catch (error) {
      console.error('Update gallery image error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while updating gallery image' 
      });
    }
  }

  // Delete gallery image (admin only)
  async deleteImage(req, res) {
    try {
      const { id } = req.params;
      const image = await GalleryImage.findById(id);

      if (!image) {
        return res.status(404).json({ 
          success: false, 
          message: 'Gallery image not found' 
        });
      }

      // Delete image from Cloudinary
      if (image.imageUrl) {
        try {
          // Extract public ID from Cloudinary URL
          const urlParts = image.imageUrl.split('/');
          const publicId = urlParts[urlParts.length - 1].split('.')[0];
          await deleteFromCloudinary(`jamalpur-chamber/gallery/${publicId}`);
        } catch (deleteError) {
          console.error('Cloudinary delete error:', deleteError);
          // Continue with deletion even if Cloudinary delete fails
        }
      }

      await GalleryImage.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Gallery image deleted successfully'
      });
    } catch (error) {
      console.error('Delete gallery image error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while deleting gallery image' 
      });
    }
  }

  // Get images by category
  async getImagesByCategory(req, res) {
    try {
      const { category } = req.params;
      const { page = 1, limit = 12 } = req.query;
      const skip = (page - 1) * limit;

      if (!['meeting', 'event', 'conference'].includes(category)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid category' 
        });
      }

      const images = await GalleryImage.find({ 
        isActive: true, 
        category 
      })
        .sort({ order: 1, uploadedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await GalleryImage.countDocuments({ 
        isActive: true, 
        category 
      });

      res.json({
        success: true,
        data: {
          images,
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
      console.error('Get images by category error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching images by category' 
      });
    }
  }

  // Reorder gallery images (admin only)
  async reorderImages(req, res) {
    try {
      const { imageOrders } = req.body; // Array of { id, order }

      if (!Array.isArray(imageOrders)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Image orders must be an array' 
        });
      }

      // Update each image's order
      const updatePromises = imageOrders.map(({ id, order }) => 
        GalleryImage.findByIdAndUpdate(id, { order }, { new: true })
      );

      await Promise.all(updatePromises);

      res.json({
        success: true,
        message: 'Gallery images reordered successfully'
      });
    } catch (error) {
      console.error('Reorder gallery images error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while reordering gallery images' 
      });
    }
  }

  // Get gallery statistics (admin only)
  async getGalleryStats(req, res) {
    try {
      const totalImages = await GalleryImage.countDocuments();
      const activeImages = await GalleryImage.countDocuments({ isActive: true });

      const categoryStats = await GalleryImage.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        }
      ]);

      const totalViews = await GalleryImage.aggregate([
        {
          $group: {
            _id: null,
            totalViews: { $sum: '$viewCount' }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          totalImages,
          activeImages,
          categoryBreakdown: categoryStats,
          totalViews: totalViews[0]?.totalViews || 0
        }
      });
    } catch (error) {
      console.error('Get gallery stats error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching gallery statistics' 
      });
    }
  }
}

module.exports = new GalleryController();
