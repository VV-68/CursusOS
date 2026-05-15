const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');

// GET /api/notices
router.get('/', authMiddleware, noticeController.getNotices);

// POST /api/notices -> hod/admin only
router.post('/', authMiddleware, roleGuard('admin', 'hod'), noticeController.createNotice);

// DELETE /api/notices/:id -> author only (admin/hod)
router.delete('/:id', authMiddleware, roleGuard('admin', 'hod'), noticeController.deleteNotice);

module.exports = router;
