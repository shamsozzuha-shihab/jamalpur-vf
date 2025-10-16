const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Admin routes only
router.get('/', authenticateToken, requireAdmin, userController.getAllUsers);
router.get('/stats', authenticateToken, requireAdmin, userController.getUserStats);
router.get('/admins', authenticateToken, requireAdmin, userController.getAllAdmins);
router.get('/role/:role', authenticateToken, requireAdmin, userController.getUsersByRole);
router.get('/:id', authenticateToken, requireAdmin, userController.getUserById);
router.post('/', authenticateToken, requireAdmin, userController.createUser);
router.put('/:id', authenticateToken, requireAdmin, userController.updateUser);
router.put('/:id/toggle-status', authenticateToken, requireAdmin, userController.toggleUserStatus);
router.delete('/:id', authenticateToken, requireAdmin, userController.deleteUser);

module.exports = router;
