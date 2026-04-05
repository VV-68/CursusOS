const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');

// GET /api/departments → all roles
router.get('/', authMiddleware, departmentController.getAllDepartments);

// POST /api/departments → admin
router.post('/', authMiddleware, roleGuard('admin'), departmentController.createDepartment);

// PATCH /api/departments/:id/hod → admin
router.patch('/:id/hod', authMiddleware, roleGuard('admin'), departmentController.assignHOD);

// GET /api/departments/:id/classes → admin, hod
router.get('/:id/classes', authMiddleware, roleGuard('admin', 'hod'), departmentController.getClassesInDepartment);

// POST /api/departments/:id/courses/upload → hod
router.post('/:id/courses/upload',
  authMiddleware, roleGuard('hod'),
  departmentController.uploadMiddleware,
  departmentController.uploadCourses
);

// GET /api/departments/:id/courses
router.get('/:id/courses',
  authMiddleware,
  departmentController.getDeptCourses
);

module.exports = router;
