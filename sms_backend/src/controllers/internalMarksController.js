const internalMarksModel = require('../models/internalMarksModel');
const { getFacultyAssignment } = require('../utils/authorizationHelpers');
const logAudit = require('../utils/auditLogger');
const pool = require('../db/connection');

const getMarksSheet = async (req, res) => {
  try {
    const { course_assignment_id } = req.params;
    
    // Auth: only the assigned faculty (or admin/hod, but strict requirement says faculty only assigned courses)
    if (req.user.role === 'faculty' || req.user.role === 'advisor') {
      const assignment = await getFacultyAssignment(req.user.id, course_assignment_id);
      if (!assignment) {
        return res.status(403).json({ error: 'You are not assigned to this course' });
      }
    } else if (req.user.role !== 'admin' && req.user.role !== 'hod') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const sheet = await internalMarksModel.getInternalMarksSheet(course_assignment_id);
    res.json(sheet);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateMarks = async (req, res) => {
  try {
    const { course_assignment_id } = req.params;
    const { marksData } = req.body; // Array of { student_id, internal_type, marks_obtained, max_marks }

    if (!Array.isArray(marksData)) {
      return res.status(400).json({ error: 'marksData must be an array' });
    }

    // Auth: only owning faculty allowed
    if (req.user.role !== 'admin') {
      const assignment = await getFacultyAssignment(req.user.id, course_assignment_id);
      if (!assignment) {
        return res.status(403).json({ error: 'You are not assigned to this course' });
      }
    }

    await internalMarksModel.updateInternalMarks(course_assignment_id, marksData, req.user.id);

    // Optional: Log audit
    await logAudit(req.user.id, 'INTERNAL_MARKS_UPDATED', 'internal_marks', course_assignment_id, null, { count: marksData.length });

    // Notify students in the class about internal marks update
    try {
      const { notifyClassStudents } = require('../services/notificationService');
      const { rows: caRows } = await pool.query(
        `SELECT ca.class_id, c.name AS course_name
         FROM course_assignments ca
         JOIN courses c ON c.id = ca.course_id
         WHERE ca.id = $1`,
        [course_assignment_id]
      );
      if (caRows.length > 0) {
        await notifyClassStudents(
          req.user.id,
          caRows[0].class_id,
          `📝 Internal marks updated for ${caRows[0].course_name}`
        );
      }
    } catch (notifErr) {
      console.error('[internalMarks] notification failed (non-fatal)', notifErr.message);
    }

    res.json({ message: 'Internal marks updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getStudentInternals = async (req, res) => {
  try {
    const student_id = req.user.id;
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can view their own marks' });
    }
    const marks = await internalMarksModel.getInternalMarksByStudent(student_id);
    res.json(marks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getClassInternals = async (req, res) => {
  try {
    const { class_id } = req.params;

    // Verify advisor owns the class
    if (req.user.role === 'advisor') {
      const { rows } = await pool.query(
        'SELECT 1 FROM classes WHERE id = $1 AND (advisor1_id = $2 OR advisor2_id = $2)',
        [class_id, req.user.id]
      );
      if (rows.length === 0) {
        return res.status(403).json({ error: 'You are not the advisor of this class' });
      }
    } else if (req.user.role !== 'admin' && req.user.role !== 'hod') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const marks = await internalMarksModel.getInternalMarksByClass(class_id);
    res.json(marks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getDepartmentInternals = async (req, res) => {
  try {
    const { dept_id } = req.params;

    // Verify HOD owns the department
    if (req.user.role === 'hod') {
      if (req.user.dept_id !== dept_id) {
        return res.status(403).json({ error: 'You can only view your own department' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const marks = await internalMarksModel.getInternalMarksByDepartment(dept_id);
    res.json(marks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getMarksSheet,
  updateMarks,
  getStudentInternals,
  getClassInternals,
  getDepartmentInternals
};
