const assignmentModel  = require('../models/assignmentModel');
const submissionModel  = require('../models/submissionModel');
const { getFacultyAssignment, isStudentInAssignment } = require('../utils/authorizationHelpers');
const { uploadSubmission, getSignedUrl } = require('../utils/storageClient');
const logAudit = require('../utils/auditLogger');
const pool = require('../db/connection');
const multer = require('multer');

// multer: store in memory (we forward buffer to Supabase)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf', 'image/jpeg', 'image/png',
      'application/zip', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('File type not allowed'), false);
  }
});
exports.uploadMiddleware = upload.single('file'); // attach to route

// ── CREATE ASSIGNMENT (faculty/advisor/hod) ──────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { title, description, course_assignment_id, due_date, max_marks, allow_late_submission } = req.body;
    if (!title || !course_assignment_id || !due_date) {
      return res.status(400).json({ error: 'title, course_assignment_id, and due_date are required' });
    }

    // Verify this faculty owns this course_assignment
    const ca = await getFacultyAssignment(req.user.id, course_assignment_id);
    if (!ca) return res.status(403).json({ error: 'You are not assigned to this course' });

    const assignment = await assignmentModel.createAssignment({
      title: title.trim(),
      description: description?.trim() || null,
      course_assignment_id,
      created_by: req.user.id,
      due_date,
      max_marks: max_marks || 100,
      allow_late_submission: allow_late_submission || false,
    });

    await logAudit(req.user.id, 'ASSIGNMENT_CREATED', 'assignment', assignment.id, null, { title, course_assignment_id });
    res.status(201).json(assignment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── PUBLISH / UNPUBLISH ──────────────────────────────────────────────────────
exports.publish = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_published } = req.body;

    const assignment = await assignmentModel.getById(id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    // Only the creator can publish/unpublish
    if (assignment.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Only the assignment creator can publish it' });
    }

    const updated = await assignmentModel.setPublished(id, is_published);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── LIST ASSIGNMENTS FOR A COURSE ASSIGNMENT ─────────────────────────────────
// Faculty: sees all (published + draft)
// Student: sees only published, with their own submission status
exports.list = async (req, res) => {
  try {
    const { course_assignment_id } = req.params;

    if (req.user.role === 'student') {
      // Verify student is in this class
      const enrolled = await isStudentInAssignment(req.user.id, course_assignment_id);
      if (!enrolled) return res.status(403).json({ error: 'Not enrolled in this course' });

      const { rows } = await pool.query(
        `SELECT a.id, a.title, a.description, a.due_date, a.max_marks,
                a.allow_late_submission, a.created_at,
                u.full_name AS posted_by,
                s.id AS submission_id, s.submitted_at, s.is_late,
                s.marks_awarded, s.feedback, s.file_name
         FROM assignments a
         JOIN users u ON u.id = a.created_by
         LEFT JOIN assignment_submissions s
           ON s.assignment_id = a.id AND s.student_id = $2
         WHERE a.course_assignment_id = $1 AND a.is_published = TRUE
         ORDER BY a.due_date DESC`,
        [course_assignment_id, req.user.id]
      );
      return res.json(rows);
    }

    // Faculty/advisor/hod: verify ownership
    const ca = await getFacultyAssignment(req.user.id, course_assignment_id);
    if (!ca) return res.status(403).json({ error: 'Not authorized for this course' });

    const assignments = await assignmentModel.getByAssignmentId(course_assignment_id);
    res.json(assignments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── SUBMIT ASSIGNMENT (student) ───────────────────────────────────────────────
exports.submit = async (req, res) => {
  try {
    const { assignment_id } = req.params;

    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const assignment = await assignmentModel.getById(assignment_id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    if (!assignment.is_published) return res.status(400).json({ error: 'Assignment is not published yet' });

    // Verify student is enrolled in the course
    const enrolled = await isStudentInAssignment(req.user.id, assignment.course_assignment_id);
    if (!enrolled) return res.status(403).json({ error: 'You are not enrolled in this course' });

    const now = new Date();
    const dueDate = new Date(assignment.due_date);
    const is_late = now > dueDate;

    if (is_late && !assignment.allow_late_submission) {
      return res.status(400).json({ error: 'Submission deadline has passed and late submissions are not allowed' });
    }

    // Upload to Supabase Storage
    const { path: storagePath } = await uploadSubmission(
      assignment_id,
      req.user.id,
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    const submission = await submissionModel.createSubmission({
      assignment_id,
      student_id: req.user.id,
      file_url: storagePath,     // store the storage path — generate signed URL on demand
      file_name: req.file.originalname,
      file_size: req.file.size,
      is_late,
    });

    res.status(201).json({ message: 'Submitted successfully', submission });
  } catch (err) {
    console.error(err);
    if (err.message === 'File type not allowed') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── GET SUBMISSIONS (faculty) ─────────────────────────────────────────────────
exports.listSubmissions = async (req, res) => {
  try {
    const { assignment_id } = req.params;

    const assignment = await assignmentModel.getById(assignment_id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    // Only the faculty who created it (or HOD of that dept) can view submissions
    const isCreator = assignment.created_by === req.user.id;
    const isOwner = await getFacultyAssignment(req.user.id, assignment.course_assignment_id);

    if (!isCreator && !isOwner) {
      return res.status(403).json({ error: 'Not authorized to view these submissions' });
    }

    const submissions = await submissionModel.getByAssignment(assignment_id);

    // Generate fresh signed URLs for each submission file
    const withUrls = await Promise.all(
      submissions.map(async (sub) => {
        try {
          const signed_url = await getSignedUrl(sub.file_url, 3600);
          return { ...sub, signed_url };
        } catch {
          return { ...sub, signed_url: null };
        }
      })
    );

    res.json(withUrls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── EVALUATE SUBMISSION (faculty) ────────────────────────────────────────────
exports.evaluate = async (req, res) => {
  try {
    const { submission_id } = req.params;
    const { marks_awarded, feedback } = req.body;

    // Get submission → assignment → course_assignment to verify ownership
    const { rows: subRows } = await pool.query(
      `SELECT s.*, a.max_marks, a.course_assignment_id, a.created_by
       FROM assignment_submissions s
       JOIN assignments a ON a.id = s.assignment_id
       WHERE s.id = $1`,
      [submission_id]
    );
    const sub = subRows[0];
    if (!sub) return res.status(404).json({ error: 'Submission not found' });

    // Only the assignment creator or the assigned faculty can evaluate
    const isCreator  = sub.created_by === req.user.id;
    const isFaculty  = await getFacultyAssignment(req.user.id, sub.course_assignment_id);
    if (!isCreator && !isFaculty) {
      return res.status(403).json({ error: 'Not authorized to evaluate this submission' });
    }

    if (marks_awarded === undefined || marks_awarded === null) {
      return res.status(400).json({ error: 'marks_awarded is required' });
    }
    if (parseFloat(marks_awarded) > parseFloat(sub.max_marks)) {
      return res.status(400).json({ error: `Marks cannot exceed max marks (${sub.max_marks})` });
    }

    const updated = await submissionModel.evaluateSubmission(submission_id, {
      marks_awarded: parseFloat(marks_awarded),
      feedback: feedback?.trim() || null,
      evaluated_by: req.user.id,
    });

    await logAudit(req.user.id, 'SUBMISSION_EVALUATED', 'assignment_submission', submission_id,
      { marks_awarded: sub.marks_awarded },
      { marks_awarded: parseFloat(marks_awarded) }
    );

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── GET STUDENT'S OWN SUBMISSION ─────────────────────────────────────────────
exports.getMySubmission = async (req, res) => {
  try {
    const { assignment_id } = req.params;
    const sub = await submissionModel.getStudentSubmission(assignment_id, req.user.id);
    if (!sub) return res.json(null);

    // Generate signed URL for the student to re-download their file
    try {
      const signed_url = await getSignedUrl(sub.file_url, 3600);
      res.json({ ...sub, signed_url });
    } catch {
      res.json({ ...sub, signed_url: null });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
