const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');

// POST /api/leave -> apply for leave
router.post('/', authMiddleware, leaveController.applyLeave);

// GET /api/leave/mine -> get own leave history
router.get('/mine', authMiddleware, leaveController.getMyRequests);

// GET /api/leave/pending -> get pending approvals (hod/advisor)
router.get('/pending', authMiddleware, roleGuard('hod', 'advisor'), leaveController.getPendingApprovals);

// PATCH /api/leave/:id/process -> approve/reject
router.patch('/:id/process', authMiddleware, roleGuard('hod', 'advisor'), leaveController.processLeave);

module.exports = router;
