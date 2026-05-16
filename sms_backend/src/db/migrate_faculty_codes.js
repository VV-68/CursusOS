/**
 * Migration: Create faculty_codes table
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./connection');

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('1. Creating faculty_codes table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS faculty_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        unique_code VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id)
      )
    `);

    console.log('2. Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_faculty_codes_unique_code ON faculty_codes(unique_code);
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
