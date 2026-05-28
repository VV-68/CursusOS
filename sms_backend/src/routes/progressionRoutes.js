const express = require('express');
const router = express.Router();
const progressionController = require('../controllers/progressionController');
// const { verifyToken, isAdmin, isHOD } = require('../middleware/auth'); // Can add auth later if required

router.post('/student/:studentId/promote', progressionController.promoteStudent);
router.post('/class/:classId/promote', progressionController.promoteClass);
router.get('/student/:studentId/state', progressionController.getStudentAcademicState);

module.exports = router;
