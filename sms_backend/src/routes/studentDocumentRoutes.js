const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');
const ctrl = require('../controllers/studentDocumentController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', authMiddleware, roleGuard('student'), upload.single('file'), ctrl.uploadDocument);
router.get('/me', authMiddleware, roleGuard('student'), ctrl.getMyDocuments);
router.get('/student/:student_id', authMiddleware, roleGuard('advisor', 'hod', 'admin', 'faculty'), ctrl.getStudentDocuments);
router.get('/download/:id', authMiddleware, ctrl.getDocumentUrl);
router.delete('/:id', authMiddleware, roleGuard('student'), ctrl.deleteMyDocument);
router.put('/:id/verify', authMiddleware, roleGuard('advisor', 'admin'), ctrl.verifyDocument);

module.exports = router;
