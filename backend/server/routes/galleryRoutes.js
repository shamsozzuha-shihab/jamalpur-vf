const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/cloudinaryUpload');

// Public routes
router.get('/', galleryController.getAllImages);
router.get('/category/:category', galleryController.getImagesByCategory);
router.get('/:id', galleryController.getImageById);

// Admin routes
router.post('/upload', authenticateToken, requireAdmin, upload.single('image'), galleryController.uploadImage);
router.put('/:id', authenticateToken, requireAdmin, galleryController.updateImage);
router.put('/reorder', authenticateToken, requireAdmin, galleryController.reorderImages);
router.get('/admin/stats', authenticateToken, requireAdmin, galleryController.getGalleryStats);
router.delete('/:id', authenticateToken, requireAdmin, galleryController.deleteImage);

module.exports = router;
