require('dotenv').config();
const pool = require('./src/db/connection');
(async () => {
  try {
    const class_id = 'd9006cdb-5d9f-4318-80f0-3ebcd4cd897c';
    let query = `
    SELECT ts.*,
           COALESCE(c.name, dc.course_name) AS course_name,
           COALESCE(c.code, dc.course_code) AS course_code,
           u1.full_name AS faculty1_name,
           u2.full_name AS faculty2_name
    FROM timetable_slots ts
    JOIN classes cl ON cl.id = ts.class_id
    JOIN departments d ON d.id = cl.dept_id
    LEFT JOIN course_assignments ca ON ca.id = ts.course_assignment_id
    LEFT JOIN courses c ON c.id = ca.course_id
    LEFT JOIN department_courses dc ON dc.id = ts.department_course_id
    LEFT JOIN department_courses dc2 ON dc2.course_code = c.code AND dc2.dept_id = c.dept_id
    LEFT JOIN users u1 ON u1.id = ca.faculty1_id
    LEFT JOIN users u2 ON u2.id = ca.faculty2_id
    WHERE ts.class_id = $1
      AND (
        d.department_type != 'semester_wise' 
        OR d.active_term = 'all' 
        OR (d.active_term = 'even' AND COALESCE(dc.period_number, dc2.period_number) % 2 = 0)
        OR (d.active_term = 'odd' AND COALESCE(dc.period_number, dc2.period_number) % 2 != 0)
      )
  `;
    await pool.query('EXPLAIN ' + query, [class_id]);
    console.log('Query 2 OK');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
})();
