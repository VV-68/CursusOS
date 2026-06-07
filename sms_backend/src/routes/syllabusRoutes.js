const express = require('express');
const router = express.Router();
const syllabusController = require('../controllers/syllabusController');
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');

// ── Static paths FIRST (before /:id) ───────────────────────────────────

// GET /api/syllabuses?dept_id=...
router.get('/', authMiddleware, roleGuard('admin', 'hod'), syllabusController.listSyllabuses);

// GET /api/syllabuses/batches?dept_id=...
router.get('/batches', authMiddleware, roleGuard('admin', 'hod'), syllabusController.getBatchesWithSyllabus);

// GET /api/syllabuses/syllabuses-by-status?status=...
router.get('/syllabuses-by-status', authMiddleware, roleGuard('admin'), syllabusController.getSyllabusesListByStatus);

// GET /api/syllabuses/courses-by-status?status=...
router.get('/courses-by-status', authMiddleware, roleGuard('admin'), syllabusController.getCourseGroupsListByStatus);

// POST /api/syllabuses → HOD creates new syllabus
router.post('/', authMiddleware, roleGuard('hod'), syllabusController.createSyllabus);

// ── Assignment Requests (static paths before :id) ──────────────────────

// POST /api/syllabuses/requests → HOD requests batch-syllabus assignment
router.post('/requests', authMiddleware, roleGuard('hod'), syllabusController.requestAssignment);

// GET /api/syllabuses/requests/list?status=pending → Admin/HOD views
router.get('/requests/list', authMiddleware, roleGuard('admin', 'hod'), syllabusController.listRequests);

// PATCH /api/syllabuses/requests/:id/review → Admin approves/rejects
router.patch('/requests/:id/review', authMiddleware, roleGuard('admin'), syllabusController.reviewRequest);

// ── Parameterized paths LAST ───────────────────────────────────────────

// GET /api/syllabuses/:id
router.get('/:id', authMiddleware, roleGuard('admin', 'hod'), syllabusController.getSyllabus);

// PATCH /api/syllabuses/:id → HOD or Admin updates
router.patch('/:id', authMiddleware, roleGuard('admin', 'hod'), syllabusController.updateSyllabus);

// DELETE /api/syllabuses/:id → HOD or Admin deletes
router.delete('/:id', authMiddleware, roleGuard('admin', 'hod'), syllabusController.deleteSyllabus);

module.exports = router;
