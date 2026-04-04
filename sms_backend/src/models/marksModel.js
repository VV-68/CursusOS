const pool = require('../db/connection');

const getMarksSheet = async (course_assignment_id, exam_type) => {
  let query = `SELECT u.id as student_id, u.full_name as student_name, p.roll_no, m.marks_obtained, m.max_marks, m.exam_type
     FROM course_assignments ca
     JOIN student_profiles p ON p.class_id = ca.class_id
     JOIN users u ON p.user_id = u.id AND u.role = 'student'
     LEFT JOIN marks m ON m.student_id = u.id AND m.course_assignment_id = ca.id`;
  const params = [course_assignment_id];

  if (exam_type) {
    params.push(exam_type);
    query += ` AND m.exam_type = $${params.length}`;
  }

  query += ` WHERE ca.id = $1 ORDER BY p.roll_no ASC`;

  const { rows } = await pool.query(query, params);
  return rows;
};

const updateMarks = async (course_assignment_id, exam_type, marks, entered_by) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // marks expected: [{ student_id, marks_obtained, max_marks }]
    for (const m of marks) {
      // Delete existing entry for this student+assignment+exam_type, then insert
      await client.query(
        `DELETE FROM marks WHERE student_id = $1 AND course_assignment_id = $2 AND exam_type = $3`,
        [m.student_id, course_assignment_id, exam_type]
      );
      await client.query(
        `INSERT INTO marks (student_id, course_assignment_id, exam_type, marks_obtained, max_marks, entered_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [m.student_id, course_assignment_id, exam_type, m.marks_obtained, m.max_marks, entered_by]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getMarksByStudent = async (student_id) => {
  const { rows } = await pool.query(
    `SELECT m.id, m.marks_obtained, m.max_marks, m.exam_type, c.name as course_name, c.code as course_code
     FROM marks m
     JOIN course_assignments ca ON m.course_assignment_id = ca.id
     JOIN courses c ON ca.course_id = c.id
     WHERE m.student_id = $1`,
    [student_id]
  );
  return rows;
};

module.exports = {
  getMarksSheet,
  updateMarks,
  getMarksByStudent
};
