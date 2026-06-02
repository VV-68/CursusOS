const express = require('express');
const router = express.Router();
const holidaysController = require('../controllers/holidaysController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, holidaysController.getHolidays);
router.post('/', authMiddleware, holidaysController.createHoliday);
router.delete('/:id', authMiddleware, holidaysController.deleteHoliday);

module.exports = router;
