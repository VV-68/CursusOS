const timetableModel = require('../models/timetableModel');
const classModel = require('../models/classModel');
const pool = require('../db/connection');

const getTimetable = async (req, res) => {
  try {
    const { class_id } = req.params;
    const timetable = await timetableModel.getTimetable(class_id);
    res.json(timetable);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const replaceTimetable = async (req, res) => {
  try {
    const { class_id, slots } = req.body;
    
    // Validation: Advisor must own the class
    const classObj = (await classModel.getAllClasses()).find(c => c.id === class_id);
    if (!classObj) return res.status(404).json({ error: 'Class not found' });

    if (req.user.role === 'advisor' && req.user.id !== classObj.advisor1_id && req.user.id !== classObj.advisor2_id) {
      return res.status(403).json({ error: 'Forbidden. Not your class.' });
    }

    try {
      await timetableModel.replaceTimetable(class_id, slots);
    } catch (dbErr) {
      if (dbErr.code === '23505') {
        return res.status(400).json({ error: 'Timetable conflict on day and period' });
      }
      throw dbErr;
    }
    
    res.json({ message: 'Timetable updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAvailableCourses = async (req, res) => {
  try {
    const { class_id } = req.params;

    // Verify advisor owns this class
    const { rows: clsRows } = await pool.query(
      `SELECT dept_id FROM classes
       WHERE id = $1 AND (advisor1_id = $2 OR advisor2_id = $2)`,
      [class_id, req.user.id]
    );
    if (!clsRows.length) return res.status(403).json({ error: 'Not your class' });

    const { rows } = await pool.query(
      `SELECT
         c.id AS course_id, c.name AS course_name, c.code, c.credits,
         ca.id AS course_assignment_id,
         u.full_name AS faculty_name
       FROM department_semester_courses dsc
       JOIN courses c ON c.id = dsc.course_id
       JOIN semesters s ON s.id = dsc.semester_id AND s.is_active = TRUE
       LEFT JOIN course_assignments ca
         ON ca.course_id = c.id AND ca.class_id = $1 AND ca.semester_id = s.id
       LEFT JOIN users u ON u.id = ca.faculty_id
       WHERE dsc.dept_id = $2 AND dsc.is_active = TRUE
       ORDER BY c.code`,
      [class_id, clsRows[0].dept_id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getTimetable,
  replaceTimetable,
  getAvailableCourses
};
