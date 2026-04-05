const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard     = require('../middleware/roleGuard');
const ctrl          = require('../controllers/assignmentController');

const faculty = roleGuard('faculty', 'advisor', 'hod');
const student = roleGuard('student');

// Faculty creates, edits, publishes
router.post('/',                           authMiddleware, faculty, ctrl.create);
router.patch('/:id/publish',               authMiddleware, faculty, ctrl.publish);

// List assignments for a course_assignment — both faculty and student
router.get('/course/:course_assignment_id', authMiddleware, ctrl.list);

// Student submits
router.post('/:assignment_id/submit',      authMiddleware, student, ctrl.uploadMiddleware, ctrl.submit);
router.get('/:assignment_id/my-submission', authMiddleware, student, ctrl.getMySubmission);

// Faculty views and evaluates submissions
router.get('/:assignment_id/submissions',  authMiddleware, faculty, ctrl.listSubmissions);
router.patch('/submissions/:submission_id/evaluate', authMiddleware, faculty, ctrl.evaluate);

module.exports = router;
