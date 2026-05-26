const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const verifyToken = require('../middleware/authMiddleware');

router.get('/', verifyToken, notificationController.getMyNotifications);
router.delete('/', verifyToken, notificationController.clearMyNotifications);
router.delete('/:id', verifyToken, notificationController.deleteOne);

module.exports = router;
