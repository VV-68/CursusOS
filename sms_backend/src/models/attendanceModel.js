const pool = require('../db/connection');

const getAttendanceSheet = async (course_assignment_id, date, period_no) => {
  const { rows } = await pool.query(
    `SELECT u.id as student_id, u.full_name as student_name, p.roll_no, ar.status
     FROM course_assignments ca
     JOIN student_academic_history sah ON sah.class_id = ca.class_id AND sah.semester_id = ca.semester_id
     JOIN student_profiles p ON p.user_id = sah.student_id
     JOIN users u ON p.user_id = u.id AND u.role = 'student'
     LEFT JOIN course_sessions cs ON cs.course_assignment_id = ca.id AND cs.date = $2 AND cs.period_no = $3
     LEFT JOIN attendance_records ar ON ar.session_id = cs.id AND ar.student_id = u.id
     WHERE ca.id = $1
     ORDER BY p.roll_no ASC`,
    [course_assignment_id, date, period_no]
  );
  return rows;
};

const markAttendance = async (course_assignment_id, date, period_no, records, marked_by) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Ensure course_session exists
    const sessionRes = await client.query(
      `INSERT INTO course_sessions (course_assignment_id, date, period_no, created_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (course_assignment_id, date, period_no) DO UPDATE SET created_by = EXCLUDED.created_by
       RETURNING id`,
      [course_assignment_id, date, period_no, marked_by]
    );
    const session_id = sessionRes.rows[0].id;

    // 2. Upsert attendance records
    for (const r of records) {
      await client.query(
        `INSERT INTO attendance_records (session_id, student_id, status, marked_by)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (session_id, student_id)
         DO UPDATE SET status = EXCLUDED.status, marked_by = EXCLUDED.marked_by, marked_at = NOW()`,
        [session_id, r.student_id, r.status, marked_by]
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
  const query = `
    SELECT v.* 
    FROM v_attendance_summary v
    JOIN course_assignments ca ON ca.id = v.course_assignment_id
    JOIN courses c ON c.id = ca.course_id
    JOIN classes cls ON ca.class_id = cls.id
    JOIN departments d ON d.id = cls.dept_id
    LEFT JOIN department_courses dc ON dc.course_code = c.code AND dc.dept_id = cls.dept_id
    WHERE v.student_id = $1
    AND (
      d.department_type != 'semester_wise' 
      OR dc.period_number = cls.current_semester_number
    )
  `;
  const { rows } = await pool.query(query, [student_id]);
  return rows;
};

const getLowAttendance = async (dept_id, class_id) => {
  let query = `
    SELECT 
      v.student_id, u.full_name, sp.roll_no, sp.class_id,
      SUM(v.classes_done) AS total,
      SUM(v.classes_present) AS present,
      ROUND((SUM(v.classes_present)::numeric / NULLIF(SUM(v.classes_done), 0)) * 100, 2) AS percentage
    FROM v_attendance_summary v
    JOIN users u ON u.id = v.student_id
    JOIN student_academic_history sah ON sah.student_id = u.id AND sah.is_active = true
    JOIN student_profiles sp ON sp.user_id = u.id
    JOIN classes c ON c.id = sah.class_id
    WHERE 1=1
  `;
  const params = [];

  if (class_id) {
    params.push(class_id);
    query += ` AND sp.class_id = $${params.length}`;
  } else if (dept_id) {
    params.push(dept_id);
    query += ` AND c.dept_id = $${params.length}`;
  }

  query += `
    GROUP BY v.student_id, u.full_name, sp.roll_no, sp.class_id
    HAVING ROUND((SUM(v.classes_present)::numeric / NULLIF(SUM(v.classes_done), 0)) * 100, 2) < 75
  `;
  
  const { rows } = await pool.query(query, params);
  return rows;
};

module.exports = {
  getAttendanceSheet,
  markAttendance,
  getSummary,
  getLowAttendance
};
