const pool = require('../db/connection');

const getTimetable = async (class_id, semester_id = null) => {
  let query = `
    SELECT ts.*,
           COALESCE(c.name, dc.course_name) AS course_name,
           COALESCE(c.code, dc.course_code) AS course_code,
           u1.full_name AS faculty1_name,
           u2.full_name AS faculty2_name
    FROM timetable_slots ts
    LEFT JOIN course_assignments ca ON ca.id = ts.course_assignment_id
    LEFT JOIN courses c ON c.id = ca.course_id
    LEFT JOIN department_courses dc ON dc.id = ts.department_course_id
    LEFT JOIN users u1 ON u1.id = ca.faculty1_id
    LEFT JOIN users u2 ON u2.id = ca.faculty2_id
    WHERE ts.class_id = $1
  `;
  const params = [class_id];
  if (semester_id) {
    params.push(semester_id);
    query += ` AND ts.semester_id = $${params.length}`;
  }
  query += ' ORDER BY ts.day_of_week, ts.period_no';
  const { rows } = await pool.query(query, params);
  return rows;
};

const replaceTimetable = async (class_id, semester_id, slots) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (semester_id) {
      await client.query(
        'DELETE FROM timetable_slots WHERE class_id = $1 AND semester_id = $2',
        [class_id, semester_id]
      );
    } else {
      await client.query('DELETE FROM timetable_slots WHERE class_id = $1', [class_id]);
    }

    if (slots && slots.length > 0) {
      for (const slot of slots) {
        await client.query(
          `INSERT INTO timetable_slots (
             class_id, semester_id, course_assignment_id, department_course_id,
             day_of_week, period_no, start_time, end_time
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            class_id,
            semester_id || slot.semester_id || null,
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
