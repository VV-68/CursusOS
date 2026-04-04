const pool = require('../db/connection');

const getAttendanceSheet = async (course_assignment_id, date) => {
  const { rows } = await pool.query(
    `SELECT u.id as student_id, u.full_name as student_name, p.roll_no, a.status
     FROM course_assignments ca
     JOIN student_profiles p ON p.class_id = ca.class_id
     JOIN users u ON p.user_id = u.id AND u.role = 'student'
     LEFT JOIN attendance a ON a.student_id = u.id
                            AND a.course_assignment_id = ca.id
                            AND a.date = $2
     WHERE ca.id = $1
     ORDER BY p.roll_no ASC`,
    [course_assignment_id, date]
  );
  return rows;
};

const markAttendance = async (course_assignment_id, date, records, marked_by) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const r of records) {
      // Use upsert: if a record for this student+assignment+date already exists, update it
      await client.query(
        `INSERT INTO attendance (student_id, course_assignment_id, date, status, marked_by)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (student_id, course_assignment_id, date)
         DO UPDATE SET status = EXCLUDED.status, marked_by = EXCLUDED.marked_by, marked_at = NOW()`,
        [r.student_id, course_assignment_id, date, r.status, marked_by]
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

const getSummary = async (student_id) => {
  // If v_attendance_summary view doesn't exist, fall back to a direct query
  try {
    const { rows } = await pool.query('SELECT * FROM v_attendance_summary WHERE student_id = $1', [student_id]);
    return rows;
  } catch (err) {
    // Fallback: aggregate from attendance table directly
    const { rows } = await pool.query(
      `SELECT ca.id as course_assignment_id, c.name as course_name, c.code as course_code,
              COUNT(*) as total_classes,
              COUNT(*) FILTER (WHERE a.status = 'present') as present_count
       FROM attendance a
       JOIN course_assignments ca ON a.course_assignment_id = ca.id
       JOIN courses c ON ca.course_id = c.id
       WHERE a.student_id = $1
       GROUP BY ca.id, c.name, c.code`,
      [student_id]
    );
    return rows;
  }
};

const getLowAttendance = async (dept_id, class_id) => {
  try {
    let query = 'SELECT * FROM v_low_attendance WHERE 1=1';
    const params = [];

    if (class_id) {
      params.push(class_id);
      query += ` AND class_id = $${params.length}`;
    } else if (dept_id) {
      params.push(dept_id);
      query += ` AND dept_id = $${params.length}`;
    }

    const { rows } = await pool.query(query, params);
    return rows;
  } catch (err) {
    // Fallback if view doesn't exist
    const { rows } = await pool.query(
      `SELECT a.student_id, u.full_name, p.roll_no, p.class_id,
              COUNT(*) as total, COUNT(*) FILTER (WHERE a.status = 'present') as present,
              ROUND(COUNT(*) FILTER (WHERE a.status = 'present')::numeric / NULLIF(COUNT(*),0) * 100, 2) as percentage
       FROM attendance a
       JOIN users u ON a.student_id = u.id
       JOIN student_profiles p ON p.user_id = u.id
       GROUP BY a.student_id, u.full_name, p.roll_no, p.class_id
       HAVING ROUND(COUNT(*) FILTER (WHERE a.status = 'present')::numeric / NULLIF(COUNT(*),0) * 100, 2) < 75`
    );
    return rows;
  }
};

module.exports = {
  getAttendanceSheet,
  markAttendance,
  getSummary,
  getLowAttendance
};
