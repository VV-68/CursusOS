const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');

// GET /api/users → admin: all; hod: own dept
router.get('/', authMiddleware, roleGuard('admin', 'hod'), userController.getAllUsers);

// POST /api/users → admin or hod creates user
router.post('/', authMiddleware, roleGuard('admin', 'hod'), userController.createUser);

// PATCH /api/users/:id/reset-password → admin resets
router.patch('/:id/reset-password', authMiddleware, roleGuard('admin'), userController.resetPassword);

// DELETE /api/users/:id → soft delete (admin only)
router.delete('/:id', authMiddleware, roleGuard('admin'), userController.deleteUser);

module.exports = router;
