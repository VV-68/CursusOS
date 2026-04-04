const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');

// GET /api/notices
router.get('/', authMiddleware, noticeController.getNotices);

// POST /api/notices -> hod/admin only
router.post('/', authMiddleware, roleGuard('admin', 'hod'), noticeController.createNotice);

module.exports = router;
