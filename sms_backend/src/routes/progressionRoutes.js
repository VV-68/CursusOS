const express = require('express');
const router = express.Router();
const progressionController = require('../controllers/progressionController');
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');

router.post('/student/:studentId/promote', authMiddleware, roleGuard('admin', 'hod'), progressionController.promoteStudent);
router.post('/class/:classId/promote', authMiddleware, roleGuard('admin', 'hod'), progressionController.promoteClass);
router.get('/student/:studentId/state', authMiddleware, progressionController.getStudentAcademicState);

// New batch progression approval workflow.
router.get('/batch-promotion-requests', authMiddleware, roleGuard('admin', 'hod'), progressionController.listBatchPromotionRequests);
router.post('/batch-promotion-requests', authMiddleware, roleGuard('hod'), progressionController.requestBatchPromotion);
router.post('/batch-promotion-direct', authMiddleware, roleGuard('hod'), progressionController.directPromoteBatch);
router.patch('/batch-promotion-requests/:requestId/review', authMiddleware, roleGuard('admin'), progressionController.reviewBatchPromotion);

router.get('/batch-deactivation-requests', authMiddleware, roleGuard('admin', 'hod'), progressionController.listBatchDeactivationRequests);
router.post('/batch-deactivation-requests', authMiddleware, roleGuard('hod'), progressionController.requestBatchDeactivation);
router.patch('/batch-deactivation-requests/:requestId/review', authMiddleware, roleGuard('admin'), progressionController.reviewBatchDeactivation);

module.exports = router;
