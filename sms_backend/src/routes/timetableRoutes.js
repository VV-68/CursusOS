const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');

// GET /api/timetable/:class_id → returns full week from v_timetable view
// Allowed for all logged-in roles
router.get('/:class_id', authMiddleware, timetableController.getTimetable);

// POST /api/timetable → advisor uploads/replaces timetable
router.post('/', authMiddleware, roleGuard('advisor'), timetableController.replaceTimetable);

module.exports = router;
