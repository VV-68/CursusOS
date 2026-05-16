const assignmentModel = require('../models/assignmentModel');
const submissionModel = require('../models/submissionModel');
const { getFacultyAssignment, isStudentInAssignment } = require('../utils/authorizationHelpers');
const storage = require('../utils/storageClient');
const { uploadSingle } = require('../utils/fileUpload');
const logAudit = require('../utils/auditLogger');

exports.uploadMiddleware = uploadSingle('file');
exports.questionUploadMiddleware = uploadSingle('question', 15);

const log = (msg, meta = {}) => console.log(`[assignments] ${msg}`, meta);

const assertFacultyOwnsCourse = async (userId, courseAssignmentId) => {
  const ca = await getFacultyAssignment(userId, courseAssignmentId);
  if (!ca) return null;
  return ca;
};

const assertStudentEnrolled = async (userId, courseAssignmentId) => {
  const ok = await isStudentInAssignment(userId, courseAssignmentId);
  return ok;
};

// ── CREATE ───────────────────────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { title, description, course_assignment_id, due_date, max_marks, allow_late_submission, is_published } = req.body;
    if (!title?.trim() || !course_assignment_id || !due_date) {
      return res.status(400).json({ error: 'title, course_assignment_id, and due_date are required' });
    }

    const ca = await assertFacultyOwnsCourse(req.user.id, course_assignment_id);
    if (!ca) return res.status(403).json({ error: 'You are not assigned to this course' });

    const allowLate = allow_late_submission === true || allow_late_submission === 'true';
    let assignment = await assignmentModel.createAssignment({
      title: title.trim(),
      description: description?.trim() || null,
      course_assignment_id,
      created_by: req.user.id,
      due_date,
      max_marks: Number(max_marks) || 100,
      allow_late_submission: allowLate,
    });

    if (req.file) {
      const { path } = await storage.uploadQuestionPdf(
        assignment.id, req.file.buffer, req.file.originalname, req.file.mimetype
      );
      assignment = await assignmentModel.setQuestionFile(assignment.id, {
        question_file_path: path,
        question_file_name: req.file.originalname,
        question_mime_type: req.file.mimetype,
      });
    }

    if (is_published === true || is_published === 'true') {
      assignment = await assignmentModel.setPublished(assignment.id, true);
    }

    await logAudit(req.user.id, 'ASSIGNMENT_CREATED', 'assignment', assignment.id, null, { title, course_assignment_id });
    log('created', { id: assignment.id, course_assignment_id });
    res.status(201).json(assignment);
  } catch (err) {
    console.error('[assignments] create error:', err);
    if (err.message === 'File type not allowed') return res.status(400).json({ error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── PUBLISH ──────────────────────────────────────────────────────────────────
exports.publish = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_published } = req.body;

    const assignment = await assignmentModel.getById(id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    const ca = await assertFacultyOwnsCourse(req.user.id, assignment.course_assignment_id);
    if (!ca) return res.status(403).json({ error: 'Not authorized for this course' });

    const updated = await assignmentModel.setPublished(id, !!is_published);
    res.json(updated);
  } catch (err) {
    console.error('[assignments] publish error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── DELETE ASSIGNMENT (+ storage cleanup) ────────────────────────────────────
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await assignmentModel.getById(id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    const ca = await assertFacultyOwnsCourse(req.user.id, assignment.course_assignment_id);
    if (!ca) return res.status(403).json({ error: 'Not authorized to delete this assignment' });

    const submissionPaths = await assignmentModel.getSubmissionFilePaths(id);
    for (const p of submissionPaths) {
      try { await storage.deleteSubmissionFile(p); } catch (e) { log('submission delete warn', { p, err: e.message }); }
    }
    try { await storage.deleteAssignmentSubmissionsPrefix(id); } catch (e) { log('prefix delete warn', { err: e.message }); }
    if (assignment.question_file_path) {
      try { await storage.deleteQuestionFile(assignment.question_file_path); } catch (e) { log('question delete warn', e.message); }
    }

    await assignmentModel.deleteById(id);
    await logAudit(req.user.id, 'ASSIGNMENT_DELETED', 'assignment', id, assignment, null);
    log('deleted', { id });
    res.json({ message: 'Assignment and associated files deleted' });
  } catch (err) {
    console.error('[assignments] delete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── UPLOAD / REPLACE QUESTION PDF ────────────────────────────────────────────
exports.uploadQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Question file must be a PDF' });
    }

    const assignment = await assignmentModel.getById(id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    const ca = await assertFacultyOwnsCourse(req.user.id, assignment.course_assignment_id);
    if (!ca) return res.status(403).json({ error: 'Not authorized' });

    if (assignment.question_file_path) {
      try { await storage.deleteQuestionFile(assignment.question_file_path); } catch (e) { log('old question delete warn', e.message); }
    }

    const { path } = await storage.uploadQuestionPdf(id, req.file.buffer, req.file.originalname, req.file.mimetype);
    const updated = await assignmentModel.setQuestionFile(id, {
      question_file_path: path,
      question_file_name: req.file.originalname,
      question_mime_type: req.file.mimetype,
    });
    res.json(updated);
  } catch (err) {
    console.error('[assignments] uploadQuestion error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── SIGNED URL FOR QUESTION PDF ──────────────────────────────────────────────
exports.getQuestionUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await assignmentModel.getById(id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    if (!assignment.question_file_path) return res.status(404).json({ error: 'No question file for this assignment' });

    if (req.user.role === 'student') {
      if (!assignment.is_published) return res.status(403).json({ error: 'Assignment not available' });
      const enrolled = await assertStudentEnrolled(req.user.id, assignment.course_assignment_id);
      if (!enrolled) return res.status(403).json({ error: 'Not enrolled in this course' });
    } else {
      const ca = await assertFacultyOwnsCourse(req.user.id, assignment.course_assignment_id);
      if (!ca && !['admin', 'hod'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Not authorized' });
      }
    }

    const signed_url = await storage.getQuestionSignedUrl(assignment.question_file_path);
    res.json({ signed_url, file_name: assignment.question_file_name });
  } catch (err) {
    console.error('[assignments] getQuestionUrl error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── LIST BY COURSE ASSIGNMENT ────────────────────────────────────────────────
exports.list = async (req, res) => {
  console.log(`\n[assignments] list: Processing GET /api/assignments/course/${req.params.course_assignment_id}`);
  console.log(`[assignments] list: User context - ID: ${req.user?.id}, Role: ${req.user?.role}`);
  try {
    const { course_assignment_id } = req.params;

    if (req.user.role === 'student') {
      console.log('[assignments] list: Checking student enrollment...');
      const enrolled = await assertStudentEnrolled(req.user.id, course_assignment_id);
      if (!enrolled) {
        console.warn(`[assignments] list: Student ${req.user.id} not enrolled in course ${course_assignment_id}`);
        return res.status(403).json({ error: 'Not enrolled in this course' });
      }

      console.log('[assignments] list: Fetching published assignments and student submissions...');
      const { rows } = await require('../db/connection').query(
        `SELECT a.id, a.title, a.description, a.due_date, a.max_marks, a.allow_late_submission, a.created_at,
                a.question_file_name, a.question_file_path,
                u.full_name AS posted_by,
                s.id AS submission_id, s.submitted_at, s.is_late, s.is_evaluated,
                s.marks_awarded, s.feedback, s.file_name AS submission_file_name
         FROM assignments a
         JOIN users u ON u.id = a.created_by
         LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.student_id = $2
         WHERE a.course_assignment_id = $1 AND a.is_published = TRUE
         ORDER BY a.due_date DESC`,
        [course_assignment_id, req.user.id]
      );
      
      console.log(`[assignments] list: Found ${rows?.length || 0} assignments for student.`);
      const mappedRows = (rows || []).map(r => ({
        ...r,
        submission_id: undefined,
        submitted_at: undefined,
        is_late: undefined,
        is_evaluated: undefined,
        marks_awarded: undefined,
        feedback: undefined,
        submission_file_name: undefined,
        submission: r.submission_id ? {
          id: r.submission_id,
          submitted_at: r.submitted_at,
          is_late: r.is_late,
          is_evaluated: r.is_evaluated,
          marks_awarded: r.marks_awarded,
          feedback: r.feedback,
          file_name: r.submission_file_name
        } : null
      }));

      return res.json(mappedRows);
    }

    console.log('[assignments] list: Checking faculty/admin authorization...');
    const ca = await assertFacultyOwnsCourse(req.user.id, course_assignment_id);
    if (!ca && !['admin', 'hod'].includes(req.user.role)) {
      console.warn(`[assignments] list: User ${req.user.id} unauthorized for course ${course_assignment_id}`);
      return res.status(403).json({ error: 'Not authorized for this course' });
    }

    console.log('[assignments] list: Fetching all assignments for course...');
    const assignments = await assignmentModel.getByAssignmentId(course_assignment_id);
    console.log(`[assignments] list: Found ${assignments?.length || 0} assignments.`);
    
    res.json(assignments || []);
  } catch (err) {
    console.error('[assignments] list error (CRASH):', err);
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// ── SUBMIT ───────────────────────────────────────────────────────────────────
exports.submit = async (req, res) => {
  try {
    const { assignment_id } = req.params;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const assignment = await assignmentModel.getById(assignment_id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    if (!assignment.is_published) return res.status(400).json({ error: 'Assignment is not published yet' });

    const enrolled = await assertStudentEnrolled(req.user.id, assignment.course_assignment_id);
    if (!enrolled) return res.status(403).json({ error: 'You are not enrolled in this course' });

    const existing = await submissionModel.getStudentSubmission(assignment_id, req.user.id);
    if (existing?.is_evaluated) {
      return res.status(403).json({ error: 'Submission is locked after evaluation' });
    }

    const now = new Date();
    const dueDate = new Date(assignment.due_date);
    const is_late = now > dueDate;
    if (is_late && !assignment.allow_late_submission) {
      return res.status(400).json({ error: 'Submission deadline has passed and late submissions are not allowed' });
    }

    if (existing?.file_url) {
      try { await storage.deleteSubmissionFile(existing.file_url); } catch (e) { log('old submission delete warn', e.message); }
    }

    const { path: storagePath } = await storage.uploadSubmission(
      assignment_id, req.user.id, req.file.buffer, req.file.originalname, req.file.mimetype
    );

    const submission = await submissionModel.createSubmission({
      assignment_id,
      student_id: req.user.id,
      file_url: storagePath,
      file_name: req.file.originalname,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      is_late,
    });

    if (!submission) {
      return res.status(403).json({ error: 'Cannot modify submission after evaluation' });
    }

    log('submitted', { assignment_id, student_id: req.user.id });
    res.status(201).json({ message: 'Submitted successfully', submission });
  } catch (err) {
    console.error('[assignments] submit error:', err);
    if (err.message === 'File type not allowed') return res.status(400).json({ error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── DELETE OWN SUBMISSION (before evaluation) ────────────────────────────────
exports.deleteMySubmission = async (req, res) => {
  try {
    const { assignment_id } = req.params;
    const assignment = await assignmentModel.getById(assignment_id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    const enrolled = await assertStudentEnrolled(req.user.id, assignment.course_assignment_id);
    if (!enrolled) return res.status(403).json({ error: 'Not enrolled in this course' });

    const existing = await submissionModel.getStudentSubmission(assignment_id, req.user.id);
    if (!existing) return res.status(404).json({ error: 'No submission found' });
    if (existing.is_evaluated) {
      return res.status(403).json({ error: 'Evaluated submissions cannot be deleted' });
    }

    try { await storage.deleteSubmissionFile(existing.file_url); } catch (e) { log('delete file warn', e.message); }
    const deleted = await submissionModel.deleteSubmission(existing.id);
    if (!deleted) return res.status(403).json({ error: 'Submission could not be deleted' });

    res.json({ message: 'Submission deleted' });
  } catch (err) {
    console.error('[assignments] deleteMySubmission error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── MY SUBMISSION ────────────────────────────────────────────────────────────
exports.getMySubmission = async (req, res) => {
  try {
    const { assignment_id } = req.params;
    const assignment = await assignmentModel.getById(assignment_id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    const enrolled = await assertStudentEnrolled(req.user.id, assignment.course_assignment_id);
    if (!enrolled) return res.status(403).json({ error: 'Not enrolled in this course' });

    const sub = await submissionModel.getStudentSubmission(assignment_id, req.user.id);
    if (!sub) return res.json(null);

    let signed_url = null;
    try { signed_url = await storage.getSubmissionSignedUrl(sub.file_url); } catch (e) { log('signed url warn', e.message); }
    res.json({ ...sub, signed_url });
  } catch (err) {
    console.error('[assignments] getMySubmission error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── LIST SUBMISSIONS (faculty, paginated) ───────────────────────────────────
exports.listSubmissions = async (req, res) => {
  try {
    const { assignment_id } = req.params;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const offset = (page - 1) * limit;

    const assignment = await assignmentModel.getById(assignment_id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    const ca = await assertFacultyOwnsCourse(req.user.id, assignment.course_assignment_id);
    if (!ca) return res.status(403).json({ error: 'Not authorized to view these submissions' });

    const [submissions, total] = await Promise.all([
      submissionModel.getByAssignment(assignment_id, { limit, offset }),
      submissionModel.countByAssignment(assignment_id),
    ]);

    const withUrls = await Promise.all(
      submissions.map(async (sub) => {
        try {
          const signed_url = await storage.getSubmissionSignedUrl(sub.file_url);
          return { ...sub, signed_url };
        } catch {
          return { ...sub, signed_url: null };
        }
      })
    );

    res.json({
      data: withUrls,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[assignments] listSubmissions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── EVALUATE ─────────────────────────────────────────────────────────────────
exports.evaluate = async (req, res) => {
  try {
    const { submission_id } = req.params;
    const { marks_awarded, feedback } = req.body;

    const sub = await submissionModel.getById(submission_id);
    if (!sub) return res.status(404).json({ error: 'Submission not found' });

    const ca = await assertFacultyOwnsCourse(req.user.id, sub.course_assignment_id);
    if (!ca) return res.status(403).json({ error: 'Not authorized to evaluate this submission' });

    if (marks_awarded === undefined || marks_awarded === null) {
      return res.status(400).json({ error: 'marks_awarded is required' });
    }
    if (parseFloat(marks_awarded) > parseFloat(sub.max_marks)) {
      return res.status(400).json({ error: `Marks cannot exceed max marks (${sub.max_marks})` });
    }
    if (parseFloat(marks_awarded) < 0) {
      return res.status(400).json({ error: 'Marks cannot be negative' });
    }

    const updated = await submissionModel.evaluateSubmission(submission_id, {
      marks_awarded: parseFloat(marks_awarded),
      feedback: feedback?.trim() || null,
      evaluated_by: req.user.id,
    });
    if (!updated) return res.status(404).json({ error: 'Submission not found' });

    await logAudit(req.user.id, 'SUBMISSION_EVALUATED', 'assignment_submission', submission_id,
      { marks_awarded: sub.marks_awarded }, { marks_awarded: parseFloat(marks_awarded) });

    log('evaluated', { submission_id, marks: marks_awarded });
    res.json(updated);
  } catch (err) {
    console.error('[assignments] evaluate error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
