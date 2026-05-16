/**
 * Migration: Support 2 faculties per course and allow HOD as faculty
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./connection');

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('1. Altering course_assignments table...');
    await client.query(`
      ALTER TABLE course_assignments 
        RENAME COLUMN faculty_id TO faculty1_id;
    `);

    await client.query(`
      ALTER TABLE course_assignments 
        ALTER COLUMN faculty1_id DROP NOT NULL,
        ADD COLUMN IF NOT EXISTS faculty2_id UUID REFERENCES users(id) ON DELETE SET NULL;
    `);

    await client.query('COMMIT');
    console.log('\n✅ Migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    process.exit(0);
  }
};

migrate();
