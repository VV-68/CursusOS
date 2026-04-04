const marksModel = require('../models/marksModel');
const courseModel = require('../models/courseModel');
const { logAudit } = require('./userController');

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

module.exports = {
  getMarksSheet,
  updateMarks,
  getMarksByStudent
};
