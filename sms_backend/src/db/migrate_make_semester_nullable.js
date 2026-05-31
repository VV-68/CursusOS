const pool = require('./connection');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('Making semester_id nullable in department_semester_courses...');
    await client.query('ALTER TABLE department_semester_courses ALTER COLUMN semester_id DROP NOT NULL');
    
    console.log('Making semester_id nullable in course_assignments...');
    await client.query('ALTER TABLE course_assignments ALTER COLUMN semester_id DROP NOT NULL');
    
    console.log('Making semester_id nullable in fee_records...');
    await client.query('ALTER TABLE fee_records ALTER COLUMN semester_id DROP NOT NULL');

    await client.query('COMMIT');
    console.log('Migration successful.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
  }
}

migrate();
