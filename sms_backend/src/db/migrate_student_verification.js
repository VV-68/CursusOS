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
    
    // Add isverified column to student_profiles
    await client.query(`
      ALTER TABLE student_profiles 
      ADD COLUMN IF NOT EXISTS isverified INTEGER DEFAULT 0;
    `);
    
    console.log('Successfully added isverified column to student_profiles.');
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
