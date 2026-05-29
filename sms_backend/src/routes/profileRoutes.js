const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard     = require('../middleware/roleGuard');
const ctrl          = require('../controllers/studentProfileController');

router.get('/me',                     authMiddleware, roleGuard('student'), ctrl.getMyProfile);
router.get('/my-courses',             authMiddleware, roleGuard('student'), ctrl.getMyCourses);
router.patch('/me',                   authMiddleware, roleGuard('student'), ctrl.updateMyProfile);
router.get('/student/:student_id',    authMiddleware, roleGuard('advisor','hod','admin', 'faculty'), ctrl.getStudentProfile);
router.get('/class/:class_id',        authMiddleware, roleGuard('advisor','hod','admin'), ctrl.getClassStudents);
router.put('/student/:student_id/verify', authMiddleware, roleGuard('advisor', 'admin'), ctrl.verifyProfile);
router.get('/class/:class_id/pending',    authMiddleware, roleGuard('advisor'), ctrl.getPendingClassStudents);
module.exports = router;
