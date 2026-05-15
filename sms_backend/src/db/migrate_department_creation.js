/**
 * Migration: Enhanced Department Creation Schema
 *
 * Adds department_type, structure_type, structure_count, description to departments table.
 * Creates department_courses table for courses linked to specific semesters/years within a department.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./connection');

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Add new columns to departments table
    console.log('1. Altering departments table...');
    await client.query(`
      ALTER TABLE departments
        ADD COLUMN IF NOT EXISTS department_type VARCHAR(20) DEFAULT 'semester_wise'
          CHECK (department_type IN ('semester_wise', 'year_wise')),
        ADD COLUMN IF NOT EXISTS structure_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS description TEXT DEFAULT ''
    `);

    // 2. Create department_courses table
    console.log('2. Creating department_courses table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS department_courses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        dept_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
        period_number INTEGER NOT NULL,
        course_name VARCHAR(200) NOT NULL,
        course_code VARCHAR(20) NOT NULL,
        credits NUMERIC(3,1) NOT NULL DEFAULT 0,
        is_elective BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(dept_id, course_code)
      )
    `);

    // 3. Create index for fast lookup
    console.log('3. Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_dept_courses_dept_id ON department_courses(dept_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_dept_courses_period ON department_courses(dept_id, period_number);
    `);

    // 4. Create department_drafts table for save draft feature
    console.log('4. Creating department_drafts table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS department_drafts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        draft_data JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
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
