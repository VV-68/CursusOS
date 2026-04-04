const express = require('express');
const router = express.Router();
const marksController = require('../controllers/marksController');
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');

// GET /api/marks/sheet
router.get('/sheet', authMiddleware, roleGuard('faculty', 'hod', 'admin'), marksController.getMarksSheet);

// POST /api/marks/update
router.post('/update', authMiddleware, roleGuard('faculty'), marksController.updateMarks);

// GET /api/marks/student/:student_id
router.get('/student/:student_id', authMiddleware, marksController.getMarksByStudent);

module.exports = router;
