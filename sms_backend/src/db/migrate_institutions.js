require('dotenv').config({ path: '.env' });
const pool = require('./connection');

async function migrate() {
  try {
    await pool.query('BEGIN');
    
    // Create institutions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS institutions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR NOT NULL,
        location VARCHAR,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add institution_id to users
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id)
    `);

    // Add institution_id to departments
    await pool.query(`
      ALTER TABLE departments 
      ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id)
    `);

    await pool.query('COMMIT');
    console.log('Migration completed successfully');
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

migrate();
