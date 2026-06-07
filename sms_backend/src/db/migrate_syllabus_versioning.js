/**
 * Migration: Syllabus Versioning & Assignment
 * 
 * Strategy:
 * 1. Create `syllabuses` table
 * 2. Add nullable `syllabus_id` to `classes` and `department_courses`
 * 3. Seed a "Default Syllabus" per department for existing data
 * 4. Backfill existing classes and department_courses to point at the default
 * 5. Create `batch_syllabus_requests` approval workflow table
 * 
 * Rollback (down):
 * - Drop batch_syllabus_requests
 * - Remove syllabus_id from classes and department_courses
 * - Drop syllabuses
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./connection');

const up = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── 1. Create syllabuses table ──────────────────────────────────────
    console.log('1. Creating syllabuses table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.syllabuses (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        dept_id uuid NOT NULL,
        name character varying NOT NULL,
        description text,
        is_active boolean NOT NULL DEFAULT true,
        created_by uuid NOT NULL,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT syllabuses_pkey PRIMARY KEY (id),
        CONSTRAINT syllabuses_dept_id_fkey FOREIGN KEY (dept_id) REFERENCES public.departments(id),
        CONSTRAINT syllabuses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
      );
    `);

    // ── 2. Add nullable syllabus_id to classes ──────────────────────────
    console.log('2. Adding syllabus_id to classes...');
    await client.query(`
      ALTER TABLE public.classes
      ADD COLUMN IF NOT EXISTS syllabus_id uuid;
    `);
    // Add FK only if it doesn't exist
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'classes_syllabus_id_fkey'
        ) THEN
          ALTER TABLE public.classes
          ADD CONSTRAINT classes_syllabus_id_fkey 
          FOREIGN KEY (syllabus_id) REFERENCES public.syllabuses(id);
        END IF;
      END $$;
    `);

    // ── 3. Add nullable syllabus_id to department_courses ───────────────
    console.log('3. Adding syllabus_id to department_courses...');
    await client.query(`
      ALTER TABLE public.department_courses
      ADD COLUMN IF NOT EXISTS syllabus_id uuid;
    `);
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'department_courses_syllabus_id_fkey'
        ) THEN
          ALTER TABLE public.department_courses
          ADD CONSTRAINT department_courses_syllabus_id_fkey 
          FOREIGN KEY (syllabus_id) REFERENCES public.syllabuses(id);
        END IF;
      END $$;
    `);

    // ── 4. Seed "Default Syllabus" for every existing department ────────
    console.log('4. Seeding Default Syllabus per department...');
    // We need a system user to set as created_by; use the first admin
    const { rows: admins } = await client.query(
      `SELECT id FROM users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1`
    );
    const systemUserId = admins[0]?.id;

    if (systemUserId) {
      // Insert a default syllabus for each department that doesn't already have one
      await client.query(`
        INSERT INTO syllabuses (dept_id, name, description, is_active, created_by)
        SELECT d.id, 'Default Syllabus', 'Auto-created during migration for existing data', true, $1
        FROM departments d
        WHERE NOT EXISTS (
          SELECT 1 FROM syllabuses s WHERE s.dept_id = d.id
        );
      `, [systemUserId]);

      // ── 5. Backfill classes.syllabus_id ─────────────────────────────────
      console.log('5. Backfilling classes.syllabus_id...');
      await client.query(`
        UPDATE classes c
        SET syllabus_id = (
          SELECT s.id FROM syllabuses s 
          WHERE s.dept_id = c.dept_id AND s.name = 'Default Syllabus'
          LIMIT 1
        )
        WHERE c.syllabus_id IS NULL AND c.dept_id IS NOT NULL;
      `);

      // ── 6. Backfill department_courses.syllabus_id ──────────────────────
      console.log('6. Backfilling department_courses.syllabus_id...');
      await client.query(`
        UPDATE department_courses dc
        SET syllabus_id = (
          SELECT s.id FROM syllabuses s 
          WHERE s.dept_id = dc.dept_id AND s.name = 'Default Syllabus'
          LIMIT 1
        )
        WHERE dc.syllabus_id IS NULL AND dc.dept_id IS NOT NULL;
      `);
    } else {
      console.log('   ⚠ No admin user found. Skipping default syllabus seed.');
      console.log('   Run this migration after creating at least one admin user.');
    }

    // ── 7. Create batch_syllabus_requests table ─────────────────────────
    console.log('7. Creating batch_syllabus_requests table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.batch_syllabus_requests (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        batch_id uuid NOT NULL,
        requested_syllabus_id uuid NOT NULL,
        requested_by uuid NOT NULL,
        status text NOT NULL DEFAULT 'pending'::text 
          CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
        remarks text,
        requested_at timestamp with time zone NOT NULL DEFAULT now(),
        reviewed_by uuid,
        reviewed_at timestamp with time zone,
        CONSTRAINT batch_syllabus_requests_pkey PRIMARY KEY (id),
        CONSTRAINT batch_syllabus_requests_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.classes(id),
        CONSTRAINT batch_syllabus_requests_requested_syllabus_id_fkey FOREIGN KEY (requested_syllabus_id) REFERENCES public.syllabuses(id),
        CONSTRAINT batch_syllabus_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id),
        CONSTRAINT batch_syllabus_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id)
      );
    `);

    await client.query('COMMIT');
    console.log('\n✅ Syllabus Versioning migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    process.exit(0);
  }
};

const down = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Rolling back syllabus versioning migration...');
    
    await client.query('DROP TABLE IF EXISTS batch_syllabus_requests CASCADE;');
    await client.query('ALTER TABLE classes DROP COLUMN IF EXISTS syllabus_id;');
    await client.query('ALTER TABLE department_courses DROP COLUMN IF EXISTS syllabus_id;');
    await client.query('DROP TABLE IF EXISTS syllabuses CASCADE;');

    await client.query('COMMIT');
    console.log('✅ Rollback completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Rollback failed:', err.message);
    throw err;
  } finally {
    client.release();
    process.exit(0);
  }
};

const direction = process.argv[2] || 'up';
if (direction === 'down') {
  down();
} else {
  up();
}
