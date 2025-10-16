const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/cloudinaryUpload');

// Public routes
router.get('/', noticeController.getAllNotices);
router.get('/search', noticeController.searchNotices);
router.get('/priority/:priority', noticeController.getNoticesByPriority);
router.get('/high-priority', noticeController.getHighPriorityNotices);
router.get('/:id', noticeController.getNoticeById);

// Admin routes
router.post('/', authenticateToken, requireAdmin, upload.single('pdfFile'), noticeController.createNotice);
router.put('/:id', authenticateToken, requireAdmin, upload.single('pdfFile'), noticeController.updateNotice);
router.delete('/:id', authenticateToken, requireAdmin, noticeController.deleteNotice);

module.exports = router;
