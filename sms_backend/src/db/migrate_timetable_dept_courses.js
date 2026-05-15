/**
 * Timetable: support scheduling by department_course without faculty assignment.
 * Scope timetables per class + academic semester.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./connection');

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      ALTER TABLE timetable_slots
        ADD COLUMN IF NOT EXISTS department_course_id UUID REFERENCES department_courses(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS semester_id UUID REFERENCES semesters(id) ON DELETE CASCADE
    `);

    await client.query(`
      ALTER TABLE timetable_slots
        ALTER COLUMN course_assignment_id DROP NOT NULL
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_timetable_class_semester
        ON timetable_slots(class_id, semester_id)
    `);

    await client.query('COMMIT');
    console.log('✅ Timetable migration completed');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Timetable migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    process.exit(0);
  }
};

migrate();
