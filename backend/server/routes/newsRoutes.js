const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Public routes
router.get('/', newsController.getAllNews);
router.get('/search', newsController.searchNews);
router.get('/featured', newsController.getFeaturedNews);
router.get('/category/:category', newsController.getNewsByCategory);
router.get('/:id', newsController.getNewsById);

// Admin routes
router.post('/', authenticateToken, requireAdmin, newsController.createNews);
router.put('/:id', authenticateToken, requireAdmin, newsController.updateNews);
router.delete('/:id', authenticateToken, requireAdmin, newsController.deleteNews);
router.get('/admin/stats', authenticateToken, requireAdmin, newsController.getNewsStats);

module.exports = router;
