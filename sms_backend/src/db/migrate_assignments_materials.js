/**
 * Migration: Assignments & Study Materials (course_assignment-scoped)
 *
 * Run: node src/db/migrate_assignments_materials.js
 *
 * Creates/updates:
 *   - assignments (+ optional question PDF metadata)
 *   - assignment_submissions (+ evaluation lock fields)
 *   - study_materials (+ Supabase file metadata, external links)
 *   - RLS policies (defense-in-depth for Supabase REST; backend uses service role)
 *
 * Supabase Storage buckets (create in dashboard if missing):
 *   - assignments-questions
 *   - assignment-submissions
 *   - study-materials
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./connection');

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('1. assignments table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(300) NOT NULL,
        description TEXT,
        course_assignment_id UUID NOT NULL REFERENCES course_assignments(id) ON DELETE CASCADE,
        created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        due_date TIMESTAMPTZ NOT NULL,
        max_marks NUMERIC(6,2) NOT NULL DEFAULT 100,
        allow_late_submission BOOLEAN NOT NULL DEFAULT FALSE,
        is_published BOOLEAN NOT NULL DEFAULT FALSE,
        question_file_path TEXT,
        question_file_name VARCHAR(500),
        question_mime_type VARCHAR(100),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`
      ALTER TABLE assignments
        ADD COLUMN IF NOT EXISTS question_file_path TEXT,
        ADD COLUMN IF NOT EXISTS question_file_name VARCHAR(500),
        ADD COLUMN IF NOT EXISTS question_mime_type VARCHAR(100),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `);

    console.log('2. assignment_submissions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS assignment_submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        file_url TEXT NOT NULL,
        file_name VARCHAR(500),
        file_size BIGINT,
        mime_type VARCHAR(100),
        is_late BOOLEAN NOT NULL DEFAULT FALSE,
        is_evaluated BOOLEAN NOT NULL DEFAULT FALSE,
        marks_awarded NUMERIC(6,2),
        feedback TEXT,
        evaluated_by UUID REFERENCES users(id) ON DELETE SET NULL,
        evaluated_at TIMESTAMPTZ,
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (assignment_id, student_id)
      )
    `);
    await client.query(`
      ALTER TABLE assignment_submissions
        ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100),
        ADD COLUMN IF NOT EXISTS is_evaluated BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `);
    await client.query(`
      UPDATE assignment_submissions
      SET is_evaluated = TRUE
      WHERE evaluated_at IS NOT NULL AND is_evaluated = FALSE
    `);

    console.log('3. study_materials table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS study_materials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(300) NOT NULL,
        description TEXT,
        course_assignment_id UUID NOT NULL REFERENCES course_assignments(id) ON DELETE CASCADE,
        posted_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        material_type VARCHAR(50) NOT NULL DEFAULT 'notes',
        drive_link TEXT,
        external_link TEXT,
        file_path TEXT,
        file_name VARCHAR(500),
        file_mime_type VARCHAR(100),
        file_size BIGINT,
        is_published BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`
      ALTER TABLE study_materials
        ADD COLUMN IF NOT EXISTS external_link TEXT,
        ADD COLUMN IF NOT EXISTS file_path TEXT,
        ADD COLUMN IF NOT EXISTS file_name VARCHAR(500),
        ADD COLUMN IF NOT EXISTS file_mime_type VARCHAR(100),
        ADD COLUMN IF NOT EXISTS file_size BIGINT,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `);
    await client.query(`
      UPDATE study_materials
      SET external_link = COALESCE(external_link, drive_link)
      WHERE external_link IS NULL AND drive_link IS NOT NULL
    `);

    console.log('4. indexes...');
    await client.query(`CREATE INDEX IF NOT EXISTS idx_assignments_ca ON assignments(course_assignment_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_assignments_published ON assignments(course_assignment_id, is_published)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON assignment_submissions(assignment_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_submissions_student ON assignment_submissions(student_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_study_materials_ca ON study_materials(course_assignment_id)`);

    console.log('5. RLS policies (Supabase REST defense-in-depth)...');
    const rlsTables = ['assignments', 'assignment_submissions', 'study_materials'];
    for (const table of rlsTables) {
      await client.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
      await client.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = '${table}' AND policyname = '${table}_deny_anon'
          ) THEN
            CREATE POLICY ${table}_deny_anon ON ${table} FOR ALL TO anon USING (false);
          END IF;
        END $$
      `);
      await client.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = '${table}' AND policyname = '${table}_deny_authenticated'
          ) THEN
            CREATE POLICY ${table}_deny_authenticated ON ${table} FOR ALL TO authenticated USING (false);
          END IF;
        END $$
      `);
    }

    await client.query('COMMIT');
    console.log('\n✅ Assignments & study materials migration completed.');
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
