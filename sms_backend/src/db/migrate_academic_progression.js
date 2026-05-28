/**
 * Migration: Implement safe academic progression system
 * 
 * Old architecture: 
 * - students permanently tied to classes (which act as both batch & semester)
 * - semesters.is_active globally toggles the current term
 * 
 * New architecture:
 * - classes act as permanent admission batches
 * - student_academic_history tracks semester-by-semester progression
 * - progression APIs to manage this state instead of global flags
 * 
 * Compatibility layer:
 * - Keep old columns in `classes` (e.g. semester_id, advisor1_id)
 * - Populate `student_academic_history` with current state to ensure zero downtime
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./connection');

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('1. Adding progression columns to classes table...');
    await client.query(`
      ALTER TABLE classes 
        ADD COLUMN IF NOT EXISTS batch_year smallint,
        ADD COLUMN IF NOT EXISTS current_semester_number smallint,
        ADD COLUMN IF NOT EXISTS current_year_number smallint,
        ADD COLUMN IF NOT EXISTS is_graduated boolean DEFAULT false;
    `);

    console.log('2. Creating student_academic_history table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS student_academic_history (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        student_id uuid NOT NULL REFERENCES users(id),
        class_id uuid NOT NULL REFERENCES classes(id),
        semester_id uuid REFERENCES semesters(id),
        current_year smallint,
        current_semester smallint,
        advisor1_id uuid REFERENCES users(id),
        advisor2_id uuid REFERENCES users(id),
        promoted_at timestamp with time zone DEFAULT now(),
        is_active boolean DEFAULT true,
        remarks text,
        PRIMARY KEY (id)
      );
    `);

    console.log('3. Populating student_academic_history with existing data...');
    // We insert a row for every existing student_profile based on their current class
    // We resolve the current_year and current_semester based on the class's 'year' and potentially the semester (though semester might just be name based, or we can leave it null/calc later).
    await client.query(`
      INSERT INTO student_academic_history (
        student_id,
        class_id,
        semester_id,
        current_year,
        advisor1_id,
        advisor2_id,
        is_active,
        remarks
      )
      SELECT 
        sp.user_id as student_id,
        c.id as class_id,
        c.semester_id,
        c.year as current_year,
        c.advisor1_id,
        c.advisor2_id,
        true as is_active,
        'Initial migration from class state' as remarks
      FROM student_profiles sp
      JOIN classes c ON sp.class_id = c.id
      ON CONFLICT DO NOTHING;
    `);

    // We can also initialize the classes new columns based on existing year data
    console.log('4. Initializing new classes columns...');
    await client.query(`
      UPDATE classes
      SET 
        current_year_number = year,
        batch_year = EXTRACT(YEAR FROM created_at)::smallint
      WHERE current_year_number IS NULL;
    `);

    await client.query('COMMIT');
    console.log('\\n✅ Migration completed successfully!');
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
