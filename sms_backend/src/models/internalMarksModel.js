const pool = require('../db/connection');

const getInternalMarksSheet = async (course_assignment_id) => {
  const query = `
    SELECT u.id as student_id, u.full_name as student_name, p.roll_no,
           im.internal_type, im.marks_obtained, im.max_marks
    FROM course_assignments ca
    JOIN student_academic_history sah ON sah.class_id = ca.class_id AND sah.is_active = TRUE
    JOIN student_profiles p ON p.user_id = sah.student_id
    JOIN users u ON p.user_id = u.id AND u.role = 'student'
    LEFT JOIN internal_marks im ON im.student_id = u.id AND im.course_assignment_id = ca.id
    WHERE ca.id = $1
    ORDER BY p.roll_no ASC, im.internal_type ASC
  `;
  const { rows } = await pool.query(query, [course_assignment_id]);
  return rows;
};

const updateInternalMarks = async (course_assignment_id, marksData, entered_by) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // marksData: [{ student_id, internal_type, marks_obtained, max_marks }]
    for (const m of marksData) {
      // Upsert logic: Delete existing, then insert
      await client.query(
        `DELETE FROM internal_marks WHERE student_id = $1 AND course_assignment_id = $2 AND internal_type = $3`,
        [m.student_id, course_assignment_id, m.internal_type]
      );
      
      // If marks_obtained is provided (not null/undefined/empty string), we insert
      if (m.marks_obtained !== null && m.marks_obtained !== undefined && m.marks_obtained !== '') {
          await client.query(
            `INSERT INTO internal_marks (student_id, course_assignment_id, internal_type, marks_obtained, max_marks, entered_by)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [m.student_id, course_assignment_id, m.internal_type, m.marks_obtained, m.max_marks || null, entered_by]
          );
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getInternalMarksByStudent = async (student_id) => {
  const { rows } = await pool.query(
    `SELECT im.id, im.course_assignment_id, im.internal_type, im.marks_obtained, im.max_marks,
            c.name as course_name, c.code as course_code, 
            COALESCE('Semester ' || dc.period_number, 'Active') as semester_name, ca.semester_id
     FROM internal_marks im
     JOIN course_assignments ca ON im.course_assignment_id = ca.id
     JOIN courses c ON ca.course_id = c.id
     JOIN classes cls ON ca.class_id = cls.id
     JOIN departments d ON d.id = cls.dept_id
     LEFT JOIN department_courses dc ON dc.course_code = c.code AND dc.dept_id = cls.dept_id
     WHERE im.student_id = $1
     AND (
       d.department_type != 'semester_wise' 
       OR dc.period_number = cls.current_semester_number
     )
     ORDER BY dc.period_number DESC NULLS LAST, c.name ASC, im.internal_type ASC`,
    [student_id]
  );
  return rows;
};

const getInternalMarksByClass = async (class_id) => {
  const { rows } = await pool.query(
    `SELECT u.id as student_id, u.full_name as student_name, p.roll_no,
            im.course_assignment_id, c.name as course_name, c.code as course_code,
            im.internal_type, im.marks_obtained, im.max_marks
     FROM student_profiles p
     JOIN users u ON p.user_id = u.id AND u.role = 'student'
     JOIN classes cls ON p.class_id = cls.id
     JOIN course_assignments ca ON ca.class_id = cls.id
     JOIN student_academic_history sah ON sah.student_id = u.id AND sah.class_id = cls.id AND sah.is_active = TRUE
     JOIN courses c ON ca.course_id = c.id
     LEFT JOIN internal_marks im ON im.student_id = u.id AND im.course_assignment_id = ca.id
     WHERE cls.id = $1
     ORDER BY p.roll_no ASC, c.name ASC, im.internal_type ASC`,
    [class_id]
  );
  return rows;
};

const getInternalMarksByDepartment = async (dept_id) => {
  const { rows } = await pool.query(
    `SELECT u.id as student_id, u.full_name as student_name, p.roll_no, cls.name as class_name, 
            COALESCE('Semester ' || sah.current_semester, 'Active') as semester_name,
            im.course_assignment_id, c.name as course_name, c.code as course_code,
            im.internal_type, im.marks_obtained, im.max_marks
     FROM student_profiles p
     JOIN users u ON p.user_id = u.id AND u.role = 'student'
     JOIN classes cls ON p.class_id = cls.id
     JOIN course_assignments ca ON ca.class_id = cls.id
     JOIN student_academic_history sah ON sah.student_id = u.id AND sah.class_id = cls.id AND sah.is_active = TRUE
     JOIN courses c ON ca.course_id = c.id
     LEFT JOIN internal_marks im ON im.student_id = u.id AND im.course_assignment_id = ca.id
     WHERE cls.dept_id = $1
     ORDER BY sah.current_year DESC NULLS LAST, sah.current_semester DESC NULLS LAST, cls.name ASC, p.roll_no ASC, c.name ASC, im.internal_type ASC`,
    [dept_id]
  );
  return rows;
};

module.exports = {
  getInternalMarksSheet,
  updateInternalMarks,
  getInternalMarksByStudent,
  getInternalMarksByClass,
  getInternalMarksByDepartment
};
