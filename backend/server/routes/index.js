const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const noticeRoutes = require('./noticeRoutes');
const formRoutes = require('./formRoutes');
const userRoutes = require('./userRoutes');
const galleryRoutes = require('./galleryRoutes');

// API version prefix
const API_VERSION = '/api';

// Mount routes
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/notices`, noticeRoutes);
router.use(`${API_VERSION}/forms`, formRoutes);
router.use(`${API_VERSION}/admin/users`, userRoutes);
router.use(`${API_VERSION}/gallery`, galleryRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Jamalpur Chamber API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API info endpoint
router.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Jamalpur Chamber of Commerce & Industry API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      notices: '/api/notices',
      forms: '/api/forms',
      users: '/api/admin/users',
      gallery: '/api/gallery'
    },
    documentation: 'https://github.com/shamsozzuha-shihab/jamapur_backend_2'
  });
});

// 404 handler for API routes
router.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

module.exports = router;
