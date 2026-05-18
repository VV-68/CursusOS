const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');
const internalMarksController = require('../controllers/internalMarksController');

router.use(verifyToken);

// Faculty routes
router.get('/course/:course_assignment_id', roleGuard(['faculty', 'advisor', 'hod', 'admin']), internalMarksController.getMarksSheet);
router.post('/course/:course_assignment_id', roleGuard(['faculty', 'admin']), internalMarksController.updateMarks);

// Student route
router.get('/my', roleGuard(['student']), internalMarksController.getStudentInternals);

// Advisor route
router.get('/class/:class_id', roleGuard(['advisor', 'hod', 'admin']), internalMarksController.getClassInternals);

// HOD route
router.get('/department/:dept_id', roleGuard(['hod', 'admin']), internalMarksController.getDepartmentInternals);

module.exports = router;
