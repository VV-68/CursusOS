require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.SUPABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS internal_marks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_assignment_id UUID NOT NULL REFERENCES course_assignments(id) ON DELETE CASCADE,
        internal_type VARCHAR(50) NOT NULL,
        marks_obtained NUMERIC(5,2),
        max_marks NUMERIC(5,2),
        entered_by UUID REFERENCES users(id) ON DELETE SET NULL,
        entered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        remarks TEXT,
        UNIQUE (student_id, course_assignment_id, internal_type)
      );
    `);
    
    console.log('Successfully created internal_marks table.');
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', e);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
