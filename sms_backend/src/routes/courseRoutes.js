const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');

// GET /api/courses → hod/admin sees dept courses; faculty sees assigned courses
router.get('/', authMiddleware, roleGuard('admin', 'hod', 'faculty'), courseController.getCourses);

// POST /api/courses → hod creates course in their dept
router.post('/', authMiddleware, roleGuard('hod'), courseController.createCourse);

// GET /api/courses/assignments/mine → faculty gets their own course assignments
router.get('/assignments/mine', authMiddleware, roleGuard('faculty', 'advisor', 'hod'), courseController.getMyCourseAssignments);

// POST /api/courses/assignments → hod assigns
router.post('/assignments', authMiddleware, roleGuard('hod'), courseController.createCourseAssignment);

// GET /api/courses/assignments → filter by class_id or faculty_id
router.get('/assignments', authMiddleware, roleGuard('admin', 'hod', 'faculty', 'advisor'), courseController.getCourseAssignments);

// DELETE /api/courses/assignments/:id → hod removes assignment
router.delete('/assignments/:id', authMiddleware, roleGuard('hod'), courseController.deleteCourseAssignment);

module.exports = router;
