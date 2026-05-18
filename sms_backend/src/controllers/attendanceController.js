const attendanceModel = require('../models/attendanceModel');
const courseModel = require('../models/courseModel');
const logAudit = require('../utils/auditLogger');

const getAttendanceSheet = async (req, res) => {
  try {
    const { course_assignment_id, date } = req.query;
    if (!course_assignment_id || !date) return res.status(400).json({ error: 'Missing params' });

    const sheet = await attendanceModel.getAttendanceSheet(course_assignment_id, date);
    res.json(sheet);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const markAttendance = async (req, res) => {
  try {
    const { course_assignment_id, date, records } = req.body;

    if (req.user.role === 'faculty') {
      const assignment = await courseModel.getCourseAssignments(null, req.user.id);
      const isAssigned = assignment.find(a => a.id === course_assignment_id);
      if (!isAssigned) return res.status(403).json({ error: 'You are not assigned to this course' });
    }

    await attendanceModel.markAttendance(course_assignment_id, date, records, req.user.id);

    await logAudit(req.user.id, 'ATTENDANCE_EDITED', 'attendance', course_assignment_id, null, { date, records_count: records.length });

    res.json({ message: 'Attendance marked successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getSummary = async (req, res) => {
  try {
    const summary = await attendanceModel.getSummary(req.params.student_id);
    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getLowAttendance = async (req, res) => {
  try {
    const { class_id, dept_id } = req.query;
    const data = await attendanceModel.getLowAttendance(dept_id, class_id);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAttendanceSheet,
  markAttendance,
  getSummary,
  getLowAttendance
};
