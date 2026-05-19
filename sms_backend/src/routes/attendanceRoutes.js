const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');

// GET /api/attendance/validate — faculty checks if slot is in timetable
router.get('/validate', authMiddleware, roleGuard('faculty', 'advisor', 'hod', 'admin'), attendanceController.validateSlot);

// GET /api/attendance/sheet
router.get('/sheet', authMiddleware, roleGuard('faculty', 'advisor', 'hod', 'admin'), attendanceController.getAttendanceSheet);

// POST /api/attendance/mark
router.post('/mark', authMiddleware, roleGuard('faculty', 'advisor', 'hod', 'admin'), attendanceController.markAttendance);

// POST /api/attendance/override-request — faculty requests permission for off-timetable marking
router.post('/override-request', authMiddleware, roleGuard('faculty'), attendanceController.requestOverride);

// GET /api/attendance/overrides — advisor/hod sees pending override requests
router.get('/overrides', authMiddleware, roleGuard('advisor', 'hod', 'admin'), attendanceController.listOverrides);

// PATCH /api/attendance/overrides/:id — advisor/hod approves or rejects
router.patch('/overrides/:id', authMiddleware, roleGuard('advisor', 'hod', 'admin'), attendanceController.reviewOverride);

// GET /api/attendance/summary/:student_id
router.get('/summary/:student_id', authMiddleware, attendanceController.getSummary);

// GET /api/attendance/low
router.get('/low', authMiddleware, roleGuard('advisor', 'hod', 'admin'), attendanceController.getLowAttendance);

module.exports = router;
