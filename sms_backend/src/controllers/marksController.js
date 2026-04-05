const marksModel = require('../models/marksModel');
const courseModel = require('../models/courseModel');
const { logAudit } = require('./userController');
const pool = require('../db/connection');
const { getFacultyAssignment } = require('../utils/authorizationHelpers');

const getMarksSheet = async (req, res) => {
  try {
    const { course_assignment_id, exam_type } = req.query;
    if (!course_assignment_id) return res.status(400).json({ error: 'Missing course_assignment_id' });

    const sheet = await marksModel.getMarksSheet(course_assignment_id, exam_type);
    res.json(sheet);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateMarks = async (req, res) => {
  try {
    const { course_assignment_id, exam_type, marks } = req.body;

    if (!exam_type) {
      return res.status(400).json({ error: 'exam_type is required' });
    }

    if (req.user.role === 'faculty') {
      const assignment = await courseModel.getCourseAssignments(null, req.user.id);
      const isAssigned = assignment.find(a => a.id === course_assignment_id);
      if (!isAssigned) return res.status(403).json({ error: 'You are not assigned to this course' });
    }

    await marksModel.updateMarks(course_assignment_id, exam_type, marks, req.user.id);

    await logAudit(req.user.id, 'MARKS_EDITED', 'marks', course_assignment_id, null, { exam_type, entries_count: marks.length });

    res.json({ message: 'Marks updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getMarksByStudent = async (req, res) => {
  try {
    const student_id = req.params.student_id;
    if (req.user.role === 'student' && req.user.id !== student_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const marks = await marksModel.getMarksByStudent(student_id);
    res.json(marks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getConsolidated = async (req, res) => {
  try {
    const { course_assignment_id } = req.params;

    // Verify faculty owns this course_assignment
    const ca = await getFacultyAssignment(req.user.id, course_assignment_id);
    if (!ca) return res.status(403).json({ error: 'Not authorized' });

    const { rows } = await pool.query(
      `SELECT
         u.full_name, sp.roll_no,
         MAX(CASE WHEN m.exam_type = 'CIA1'  THEN m.marks_obtained END) AS cia1,
         MAX(CASE WHEN m.exam_type = 'CIA2'  THEN m.marks_obtained END) AS cia2,
         MAX(CASE WHEN m.exam_type = 'model' THEN m.marks_obtained END) AS model_exam,
         ROUND(
           100.0 * COUNT(CASE WHEN a.status = 'present' THEN 1 END) /
           NULLIF(COUNT(a.id), 0), 1
         ) AS attendance_pct,
         COUNT(DISTINCT sub.id) AS assignments_submitted,
         ROUND(AVG(sub.marks_awarded), 1) AS avg_assignment_marks
       FROM student_profiles sp
       JOIN users u ON u.id = sp.user_id
       LEFT JOIN marks m ON m.student_id = sp.user_id AND m.course_assignment_id = $1
       LEFT JOIN attendance a ON a.student_id = sp.user_id AND a.course_assignment_id = $1
       LEFT JOIN assignments asgn ON asgn.course_assignment_id = $1
       LEFT JOIN assignment_submissions sub
         ON sub.student_id = sp.user_id AND sub.assignment_id = asgn.id
       WHERE sp.class_id = (
         SELECT class_id FROM course_assignments WHERE id = $1
       )
       GROUP BY u.full_name, sp.roll_no
       ORDER BY sp.roll_no`,
      [course_assignment_id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getMarksSheet,
  updateMarks,
  getMarksByStudent,
  getConsolidated
};
