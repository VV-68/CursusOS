const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard     = require('../middleware/roleGuard');
const ctrl          = require('../controllers/studentProfileController');

router.get('/me',                     authMiddleware, roleGuard('student'), ctrl.getMyProfile);
router.patch('/me',                   authMiddleware, roleGuard('student'), ctrl.updateMyProfile);
router.get('/student/:student_id',    authMiddleware, roleGuard('advisor','hod','admin'), ctrl.getStudentProfile);
router.get('/class/:class_id',        authMiddleware, roleGuard('advisor','hod','admin'), ctrl.getClassStudents);

module.exports = router;
