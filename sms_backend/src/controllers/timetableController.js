const timetableModel = require('../models/timetableModel');
const classModel = require('../models/classModel');
const deptCreationModel = require('../models/departmentCreationModel');
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

    const { rows: clsRows } = await pool.query(
      `SELECT c.id, c.dept_id, c.year, c.semester_id, c.name AS class_name, c.section,
              d.department_type, d.structure_count
       FROM classes c
       JOIN departments d ON d.id = c.dept_id
       WHERE c.id = $1 AND (c.advisor1_id = $2 OR c.advisor2_id = $2)`,
      [class_id, req.user.id]
    );
    if (!clsRows.length) return res.status(403).json({ error: 'Not your class' });

    const cls = clsRows[0];
    const periodNumber = deptCreationModel.resolveClassPeriod(cls.department_type, cls.year);
    const semesterId = cls.semester_id;

    if (!semesterId) {
      return res.status(400).json({ error: 'Class has no semester assigned' });
    }

    const { rows } = await pool.query(
      `SELECT
         dc.course_code AS code,
         dc.course_name,
         dc.credits,
         dc.period_number,
         dc.is_elective,
         c.id AS course_id,
         ca.id AS course_assignment_id,
         u.full_name AS faculty_name
       FROM department_courses dc
       LEFT JOIN courses c ON c.code = dc.course_code AND c.dept_id = dc.dept_id
       LEFT JOIN course_assignments ca
         ON ca.course_id = c.id AND ca.class_id = $1 AND ca.semester_id = $2
       LEFT JOIN users u ON u.id = ca.faculty_id
       WHERE dc.dept_id = $3 AND dc.period_number = $4
       ORDER BY dc.course_code`,
      [class_id, semesterId, cls.dept_id, periodNumber]
    );

    res.json({
      class: {
        id: cls.id,
        name: cls.class_name,
        section: cls.section,
        year: cls.year,
        period_number: periodNumber,
        period_label: cls.department_type === 'year_wise' ? 'Year' : 'Semester'
      },
      courses: rows
    });
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
