const timetableModel = require('../models/timetableModel');
const classModel = require('../models/classModel');
const deptCreationModel = require('../models/departmentCreationModel');
const pool = require('../db/connection');

const getTimetable = async (req, res) => {
  try {
    const { class_id } = req.params;
    let { semester_id } = req.query;
    
    if (!semester_id) {
      const { rows } = await pool.query(`SELECT id FROM semesters WHERE is_active = TRUE LIMIT 1`);
      if (rows.length > 0) {
        semester_id = rows[0].id;
      }
    }
    
    const timetable = await timetableModel.getTimetable(class_id, semester_id || null);
    res.json(timetable);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const replaceTimetable = async (req, res) => {
  try {
    const { class_id, semester_id, slots } = req.body;
    if (!semester_id) {
      return res.status(400).json({ error: 'semester_id is required' });
    }

    const classObj = (await classModel.getAllClasses()).find(c => c.id === class_id);
    if (!classObj) return res.status(404).json({ error: 'Class not found' });

    if (req.user.role === 'advisor' && req.user.id !== classObj.advisor1_id && req.user.id !== classObj.advisor2_id) {
      return res.status(403).json({ error: 'Forbidden. Not your class.' });
    }

    try {
      await timetableModel.replaceTimetable(class_id, semester_id, slots);
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
    const { semester_id, period_number } = req.query;

    const { rows: clsRows } = await pool.query(
      `SELECT c.id, c.dept_id, c.year, c.semester_id, c.name AS class_name, c.section,
              d.department_type, d.structure_count, c.current_semester_number
       FROM classes c
       JOIN departments d ON d.id = c.dept_id
       WHERE c.id = $1
         AND (
           c.advisor1_id = $2 OR c.advisor2_id = $2
           OR ($3 = 'hod' AND c.dept_id = $4)
           OR $3 = 'admin'
         )`,
      [class_id, req.user.id, req.user.role, req.user.dept_id]
    );
    if (!clsRows.length) return res.status(403).json({ error: 'Not your class' });

    const cls = clsRows[0];
    const periodLabel = cls.department_type === 'year_wise' ? 'Year' : 'Semester';
    let applicablePeriods = deptCreationModel.resolveClassPeriods(
      cls.department_type,
      cls.year,
      cls.structure_count
    );

    if (cls.department_type === 'semester_wise' && cls.current_semester_number) {
      applicablePeriods = [cls.current_semester_number];
    }

    let targetPeriod = period_number ? parseInt(period_number, 10) : null;
    if (!targetPeriod) {
      targetPeriod = applicablePeriods[0] || null;
    }
    if (!applicablePeriods.includes(targetPeriod)) {
      return res.status(400).json({
        error: `Invalid period for this class. Choose one of: ${applicablePeriods.join(', ')}`
      });
    }

    const semId = semester_id || cls.semester_id;
    if (!semId) {
      return res.status(400).json({ error: 'semester_id is required' });
    }

    const { rows } = await pool.query(
      `SELECT
         dc.id AS department_course_id,
         dc.course_code AS code,
         dc.course_name,
         dc.credits,
         dc.period_number,
         dc.is_elective,
         c.id AS course_id,
         ca.id AS course_assignment_id,
         u1.full_name AS faculty1_name,
         u2.full_name AS faculty2_name
       FROM department_courses dc
       LEFT JOIN courses c ON c.code = dc.course_code AND c.dept_id = dc.dept_id
       LEFT JOIN course_assignments ca
         ON ca.course_id = c.id AND ca.class_id = $1 AND ca.semester_id = $2
       LEFT JOIN users u1 ON u1.id = ca.faculty1_id
       LEFT JOIN users u2 ON u2.id = ca.faculty2_id
       WHERE dc.dept_id = $3 AND dc.period_number = $4
       ORDER BY dc.course_code`,
      [class_id, semId, cls.dept_id, targetPeriod]
    );

    res.json({
      class: {
        id: cls.id,
        name: cls.class_name,
        section: cls.section,
        year: cls.year,
        period_number: targetPeriod,
        period_label: periodLabel,
        applicable_periods: applicablePeriods
      },
      semester_id: semId,
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
