const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const ctrl = require('../controllers/semesterController');

router.get('/', authMiddleware, ctrl.getAllSemesters);

module.exports = router;
