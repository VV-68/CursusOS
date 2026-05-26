require('dotenv').config({ path: '.env' });
const pool = require('./connection');

async function migrate() {
  try {
    await pool.query('BEGIN');
    
    // Add designation to faculty_codes
    await pool.query(`
      ALTER TABLE faculty_codes 
      ADD COLUMN IF NOT EXISTS designation VARCHAR
    `);

    // Set default designation to Faculty
    await pool.query(`
      UPDATE faculty_codes SET designation = 'Faculty' WHERE designation IS NULL
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
