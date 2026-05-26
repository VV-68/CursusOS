const express = require('express');
const router = express.Router();
const institutionController = require('../controllers/institutionController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);
router.get('/mine', institutionController.getMyInstitution);
router.put('/mine', institutionController.updateMyInstitution);

module.exports = router;
