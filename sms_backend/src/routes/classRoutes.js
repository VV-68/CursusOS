const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');

// GET /api/classes → admin sees all; hod sees own dept; advisor sees own classes
router.get('/', authMiddleware, classController.getAllClasses);

// POST /api/classes → admin and hod create class
router.post('/', authMiddleware, roleGuard('admin', 'hod'), classController.createClass);

// PATCH /api/classes/:id/advisors → HOD assigns advisors
router.patch('/:id/advisors', authMiddleware, roleGuard('hod'), classController.assignAdvisors);

// GET /api/classes/:id/students → list students in a class (with profile) (advisor, hod, admin)
router.get('/:id/students', authMiddleware, roleGuard('admin', 'hod', 'advisor'), classController.getStudentsInClass);

// PUT /api/classes/:id → admin/hod update class
router.put('/:id', authMiddleware, roleGuard('admin', 'hod'), classController.updateClass);

// DELETE /api/classes/:id → admin/hod delete class
router.delete('/:id', authMiddleware, roleGuard('admin', 'hod'), classController.deleteClass);

module.exports = router;
