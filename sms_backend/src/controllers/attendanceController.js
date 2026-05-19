const attendanceModel = require('../models/attendanceModel');
const courseModel = require('../models/courseModel');
const overrideModel = require('../models/attendanceOverrideModel');
const logAudit = require('../utils/auditLogger');
const pool = require('../db/connection');
const { getFacultyAssignment, isAdvisorOfStudent } = require('../utils/authorizationHelpers');

// Helper: derive day name from a date string
const getDayName = (dateStr) => {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return dayNames[new Date(dateStr + 'T00:00:00').getDay()];
};

// ───────────────── Validate Slot ──────────────────────────────────────────────
// Frontend calls this before loading the sheet to check if faculty is allowed.
const validateSlot = async (req, res) => {
  try {
    const { course_assignment_id, date, period_no = 1 } = req.query;
    if (!course_assignment_id || !date) return res.status(400).json({ error: 'Missing params' });

    // Advisors, HODs, admins bypass timetable check
    if (['advisor', 'hod', 'admin'].includes(req.user.role)) {
      return res.json({ allowed: true, reason: 'role_bypass' });
    }

    // Faculty: verify they own the course
    const assignment = await getFacultyAssignment(req.user.id, course_assignment_id);
    if (!assignment) return res.status(403).json({ error: 'You are not assigned to this course' });

    const dayOfWeek = getDayName(date);
    const slot = await overrideModel.checkTimetableSlot(course_assignment_id, dayOfWeek, period_no);

    if (slot) {
      return res.json({ allowed: true, reason: 'timetable_match' });
    }

    // No timetable match — check if there's an approved override
    const override = await overrideModel.getOverride(course_assignment_id, req.user.id, date, period_no);
    if (override && override.status === 'approved') {
      return res.json({ allowed: true, reason: 'override_approved' });
    }
    if (override && override.status === 'pending') {
      return res.json({ allowed: false, reason: 'override_pending', override_id: override.id });
    }

    // Not allowed
    return res.json({ allowed: false, reason: 'not_in_timetable' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ───────────────── Get Attendance Sheet ───────────────────────────────────────
const getAttendanceSheet = async (req, res) => {
  try {
    const { course_assignment_id, date, period_no = 1 } = req.query;
    if (!course_assignment_id || !date) return res.status(400).json({ error: 'Missing params' });

    if (req.user.role === 'faculty') {
      const assignment = await getFacultyAssignment(req.user.id, course_assignment_id);
      if (!assignment) return res.status(403).json({ error: 'You are not assigned to this course' });
    } else if (req.user.role === 'advisor') {
      const { rows } = await pool.query(
        'SELECT 1 FROM course_assignments ca JOIN classes cl ON cl.id = ca.class_id WHERE ca.id = $1 AND (cl.advisor1_id = $2 OR cl.advisor2_id = $2)',
        [course_assignment_id, req.user.id]
      );
      if (rows.length === 0) {
        const assignment = await getFacultyAssignment(req.user.id, course_assignment_id);
        if (!assignment) return res.status(403).json({ error: 'You are not authorized for this course' });
      }
    } else if (req.user.role === 'hod') {
      const { rows } = await pool.query(
        'SELECT 1 FROM course_assignments ca JOIN classes cl ON cl.id = ca.class_id WHERE ca.id = $1 AND cl.dept_id = $2',
        [course_assignment_id, req.user.dept_id]
      );
      if (rows.length === 0) return res.status(403).json({ error: 'You are not authorized for this course' });
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const sheet = await attendanceModel.getAttendanceSheet(course_assignment_id, date, period_no);
    res.json(sheet);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ───────────────── Mark Attendance ────────────────────────────────────────────
const markAttendance = async (req, res) => {
  try {
    const { course_assignment_id, date, period_no = 1, records } = req.body;

    // 1. Course ownership check
    if (req.user.role === 'faculty') {
      const assignment = await getFacultyAssignment(req.user.id, course_assignment_id);
      if (!assignment) return res.status(403).json({ error: 'You are not assigned to this course' });

      // 2. Timetable enforcement for faculty
      const dayOfWeek = getDayName(date);
      const slot = await overrideModel.checkTimetableSlot(course_assignment_id, dayOfWeek, period_no);

      if (!slot) {
        // Check for approved override
        const override = await overrideModel.getOverride(course_assignment_id, req.user.id, date, period_no);
        if (!override || override.status !== 'approved') {
          return res.status(403).json({
            error: 'This period is not in your timetable for this day. Request advisor permission first.',
            code: 'TIMETABLE_MISMATCH'
          });
        }
      }
    } else if (req.user.role === 'advisor') {
      // Advisors: check they own the course OR advise the class
      const assignment = await getFacultyAssignment(req.user.id, course_assignment_id);
      if (!assignment) {
        const { rows } = await pool.query(
          'SELECT 1 FROM course_assignments ca JOIN classes cl ON cl.id = ca.class_id WHERE ca.id = $1 AND (cl.advisor1_id = $2 OR cl.advisor2_id = $2)',
          [course_assignment_id, req.user.id]
        );
        if (rows.length === 0) return res.status(403).json({ error: 'You are not authorized for this course' });
      }
      // Advisors skip timetable check — they are the authority
    } else if (req.user.role === 'hod') {
      const { rows } = await pool.query(
        'SELECT 1 FROM course_assignments ca JOIN classes cl ON cl.id = ca.class_id WHERE ca.id = $1 AND cl.dept_id = $2',
        [course_assignment_id, req.user.dept_id]
      );
      if (rows.length === 0) return res.status(403).json({ error: 'You are not authorized for this course' });
      // HODs skip timetable check
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await attendanceModel.markAttendance(course_assignment_id, date, period_no, records, req.user.id);
    await logAudit(req.user.id, 'ATTENDANCE_EDITED', 'attendance', course_assignment_id, null, { date, period_no, records_count: records.length });

    res.json({ message: 'Attendance marked successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ───────────────── Override Request (Faculty → Advisor) ──────────────────────
const requestOverride = async (req, res) => {
  try {
    const { course_assignment_id, date, period_no, reason } = req.body;
    if (!course_assignment_id || !date || !period_no) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Must be faculty of that course
    const assignment = await getFacultyAssignment(req.user.id, course_assignment_id);
    if (!assignment) return res.status(403).json({ error: 'You are not assigned to this course' });

    const override = await overrideModel.createOverrideRequest(
      course_assignment_id, req.user.id, date, period_no, reason || ''
    );
    res.status(201).json(override);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ───────────────── List Pending Overrides (Advisor / HOD) ────────────────────
const listOverrides = async (req, res) => {
  try {
    let overrides;
    if (req.user.role === 'advisor') {
      overrides = await overrideModel.getPendingOverridesForAdvisor(req.user.id);
    } else if (req.user.role === 'hod') {
      overrides = await overrideModel.getPendingOverridesForHOD(req.user.dept_id);
    } else if (req.user.role === 'admin') {
      // Admin can see all pending
      const { rows } = await pool.query(
        `SELECT ao.*, u.full_name AS faculty_name,
                c.name AS course_name, c.code AS course_code,
                cl.name AS class_name
         FROM attendance_overrides ao
         JOIN users u ON u.id = ao.faculty_id
         JOIN course_assignments ca ON ca.id = ao.course_assignment_id
         JOIN courses c ON c.id = ca.course_id
         JOIN classes cl ON cl.id = ca.class_id
         WHERE ao.status = 'pending'
         ORDER BY ao.created_at DESC`
      );
      overrides = rows;
    } else {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    res.json(overrides);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ───────────────── Review Override (Approve / Reject) ────────────────────────
const reviewOverride = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "approved" or "rejected"' });
    }

    // Verify the override exists and the reviewer has authority
    const { rows } = await pool.query('SELECT * FROM attendance_overrides WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Override request not found' });

    const override = rows[0];

    if (req.user.role === 'advisor') {
      // Advisor must own the class
      const { rows: classRows } = await pool.query(
        `SELECT 1 FROM course_assignments ca JOIN classes cl ON cl.id = ca.class_id
         WHERE ca.id = $1 AND (cl.advisor1_id = $2 OR cl.advisor2_id = $2)`,
        [override.course_assignment_id, req.user.id]
      );
      if (classRows.length === 0) return res.status(403).json({ error: 'Not your class' });
    } else if (req.user.role === 'hod') {
      const { rows: classRows } = await pool.query(
        `SELECT 1 FROM course_assignments ca JOIN classes cl ON cl.id = ca.class_id
         WHERE ca.id = $1 AND cl.dept_id = $2`,
        [override.course_assignment_id, req.user.dept_id]
      );
      if (classRows.length === 0) return res.status(403).json({ error: 'Not your department' });
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updated = await overrideModel.reviewOverride(id, status, req.user.id);
    await logAudit(req.user.id, `OVERRIDE_${status.toUpperCase()}`, 'attendance_overrides', id, null, { override_id: id });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ───────────────── Get Summary ───────────────────────────────────────────────
const getSummary = async (req, res) => {
  try {
    const { student_id } = req.params;

    if (req.user.role === 'student') {
      if (req.user.id !== student_id) return res.status(403).json({ error: 'You can only view your own attendance' });
    } else if (req.user.role === 'advisor') {
      const isAdv = await isAdvisorOfStudent(req.user.id, student_id);
      if (!isAdv) return res.status(403).json({ error: 'This student is not in your class' });
    } else if (req.user.role === 'hod') {
      const { rows } = await pool.query(
        'SELECT 1 FROM student_profiles sp JOIN classes cl ON cl.id = sp.class_id WHERE sp.user_id = $1 AND cl.dept_id = $2',
        [student_id, req.user.dept_id]
      );
      if (rows.length === 0) return res.status(403).json({ error: 'Student is not in your department' });
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const summary = await attendanceModel.getSummary(student_id);
    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ───────────────── Get Low Attendance ────────────────────────────────────────
const getLowAttendance = async (req, res) => {
  try {
    const { class_id, dept_id } = req.query;
    
    if (req.user.role === 'advisor' && class_id) {
      const { rows } = await pool.query('SELECT 1 FROM classes WHERE id = $1 AND (advisor1_id = $2 OR advisor2_id = $2)', [class_id, req.user.id]);
      if (rows.length === 0) return res.status(403).json({ error: 'Not your class' });
    } else if (req.user.role === 'hod') {
      if (req.query.dept_id && req.query.dept_id !== req.user.dept_id) return res.status(403).json({ error: 'Not your department' });
    }

    const data = await attendanceModel.getLowAttendance(dept_id, class_id);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  validateSlot,
  getAttendanceSheet,
  markAttendance,
  requestOverride,
  listOverrides,
  reviewOverride,
  getSummary,
  getLowAttendance
};
