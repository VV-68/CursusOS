const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');

// GET /api/attendance/sheet
router.get('/sheet', authMiddleware, roleGuard('faculty', 'hod', 'admin'), attendanceController.getAttendanceSheet);

// POST /api/attendance/mark
router.post('/mark', authMiddleware, roleGuard('faculty'), attendanceController.markAttendance);

// GET /api/attendance/summary/:student_id
router.get('/summary/:student_id', authMiddleware, attendanceController.getSummary);

// GET /api/attendance/low
router.get('/low', authMiddleware, roleGuard('advisor', 'hod', 'admin'), attendanceController.getLowAttendance);

module.exports = router;
