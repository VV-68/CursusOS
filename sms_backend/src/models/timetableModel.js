const pool = require('../db/connection');

const getTimetable = async (class_id) => {
  const { rows } = await pool.query('SELECT * FROM v_timetable WHERE class_id = $1', [class_id]);
  return rows;
};

const replaceTimetable = async (class_id, slots) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Delete existing slots
    await client.query('DELETE FROM timetable_slots WHERE class_id = $1', [class_id]);
    
    // Insert new slots if any passed
    if (slots && slots.length > 0) {
      for (const slot of slots) {
        // slot: { course_assignment_id, day_of_week, period_no, start_time, end_time }
        await client.query(
          `INSERT INTO timetable_slots (class_id, course_assignment_id, day_of_week, period_no, start_time, end_time) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [class_id, slot.course_assignment_id, slot.day_of_week, slot.period_no, slot.start_time, slot.end_time]
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
