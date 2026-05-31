const pool = require('../db/connection');

const getTimetable = async (class_id, semester_id = null) => {
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
        OR COALESCE(dc.period_number, dc2.period_number) = cl.current_semester_number
      )
  `;
  const params = [class_id];
  query += ' ORDER BY ts.day_of_week, ts.period_no';
  const { rows } = await pool.query(query, params);
  return rows;
};

const replaceTimetable = async (class_id, semester_id, slots) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // We fetch current_semester_number to scope timetable operations
    const { rows: clsRows } = await client.query(
      `SELECT c.current_semester_number, d.department_type
       FROM classes c
       JOIN departments d ON d.id = c.dept_id
       WHERE c.id = $1`,
      [class_id]
    );

    let current_sem = 1;
    let dept_type = 'semester_wise';
    if (clsRows.length > 0) {
      current_sem = clsRows[0].current_semester_number || 1;
      dept_type = clsRows[0].department_type;
    }

    let deleteQuery = `
      DELETE FROM timetable_slots ts
      USING classes cl, departments d
      WHERE ts.class_id = cl.id AND cl.dept_id = d.id
        AND ts.class_id = $1
    `;
    const deleteParams = [class_id];

    if (dept_type === 'semester_wise') {
      deleteQuery += `
        AND EXISTS (
          SELECT 1
          FROM department_courses dc
          WHERE dc.id = ts.department_course_id
            AND dc.period_number = ${current_sem}
          UNION
          SELECT 1
          FROM course_assignments ca
          JOIN courses c ON c.id = ca.course_id
          JOIN department_courses dc2 ON dc2.course_code = c.code AND dc2.dept_id = c.dept_id
          WHERE ca.id = ts.course_assignment_id
            AND dc2.period_number = ${current_sem}
        )
      `;
    }

    await client.query(deleteQuery, deleteParams);

    if (slots && slots.length > 0) {
      for (const slot of slots) {
        await client.query(
          `INSERT INTO timetable_slots (
             class_id, course_assignment_id, department_course_id,
             day_of_week, period_no, start_time, end_time
           ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            class_id,
            slot.course_assignment_id || null,
            slot.department_course_id || null,
            slot.day_of_week,
            slot.period_no,
            slot.start_time,
            slot.end_time
          ]
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

module.exports = {
  getTimetable,
  replaceTimetable
};
