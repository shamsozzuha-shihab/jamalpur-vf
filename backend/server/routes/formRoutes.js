const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/cloudinaryUpload');

// Public routes
router.post('/submit', formController.submitForm);
router.post('/submit-with-file', upload.single('pdfFile'), formController.submitFormWithFile);

// Admin routes
router.get('/submissions', authenticateToken, requireAdmin, formController.getAllSubmissions);
router.get('/submissions/stats', authenticateToken, requireAdmin, formController.getSubmissionStats);
router.get('/submissions/status/:status', authenticateToken, requireAdmin, formController.getSubmissionsByStatus);
router.get('/submissions/category/:category', authenticateToken, requireAdmin, formController.getSubmissionsByCategory);
router.get('/submissions/:id', authenticateToken, requireAdmin, formController.getSubmissionById);
router.put('/submissions/:id/status', authenticateToken, requireAdmin, formController.updateSubmissionStatus);
router.delete('/submissions/:id', authenticateToken, requireAdmin, formController.deleteSubmission);

module.exports = router;
