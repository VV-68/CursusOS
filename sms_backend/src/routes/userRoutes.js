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

// PATCH /api/users/:id/reactivate → reactivate user
router.patch('/:id/reactivate', authMiddleware, roleGuard('admin', 'hod'), userController.reactivateUser);

// PATCH /api/users/:id/role → hod or admin changes role
router.patch('/:id/role', authMiddleware, roleGuard('admin', 'hod'), userController.updateRole);

// PATCH /api/users/me → users can update own profile (email, phone)
router.patch('/me', authMiddleware, userController.updateMyProfile);

// PATCH /api/users/:id/approve → admin or hod approves user creation
router.patch('/:id/approve', authMiddleware, roleGuard('admin', 'hod'), userController.approveUser);

// PATCH /api/users/:id/designation → hod or admin updates designation
router.patch('/:id/designation', authMiddleware, roleGuard('admin', 'hod'), userController.updateDesignation);

// PATCH /api/users/:id/department → admin assigns department
router.patch('/:id/department', authMiddleware, roleGuard('admin'), userController.updateDepartment);

module.exports = router;
