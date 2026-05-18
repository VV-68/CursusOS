const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');
const ctrl = require('../controllers/assignmentController');

const faculty = roleGuard('faculty', 'advisor', 'hod');
const student = roleGuard('student');

router.post('/', authMiddleware, faculty, ctrl.questionUploadMiddleware, ctrl.create);
router.patch('/:id/publish', authMiddleware, faculty, ctrl.publish);
router.delete('/:id', authMiddleware, faculty, ctrl.remove);

router.post('/:id/question', authMiddleware, faculty, ctrl.questionUploadMiddleware, ctrl.uploadQuestion);
router.get('/:id/question-url', authMiddleware, ctrl.getQuestionUrl);

router.get('/mine', authMiddleware, ctrl.listMine);
router.get('/course/:course_assignment_id', authMiddleware, ctrl.list);

router.post('/:assignment_id/submit', authMiddleware, student, ctrl.uploadMiddleware, ctrl.submit);
router.get('/:assignment_id/my-submission', authMiddleware, student, ctrl.getMySubmission);
router.delete('/:assignment_id/my-submission', authMiddleware, student, ctrl.deleteMySubmission);

router.get('/:assignment_id/submissions', authMiddleware, faculty, ctrl.listSubmissions);
router.patch('/submissions/:submission_id/evaluate', authMiddleware, faculty, ctrl.evaluate);

module.exports = router;
