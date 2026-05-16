const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');
const ctrl = require('../controllers/studyMaterialController');

const faculty = roleGuard('faculty', 'advisor', 'hod');

router.post('/', authMiddleware, faculty, ctrl.uploadMiddleware, ctrl.create);
router.patch('/:id', authMiddleware, faculty, ctrl.uploadMiddleware, ctrl.update);
router.get('/course/:course_assignment_id', authMiddleware, ctrl.list);
router.get('/:id/download', authMiddleware, ctrl.getDownloadUrl);
router.delete('/:id', authMiddleware, faculty, ctrl.remove);

module.exports = router;
