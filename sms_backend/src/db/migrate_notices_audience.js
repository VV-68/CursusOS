/**
 * Notices: role-based audience (hod, faculty, student) for admin/HOD posts.
 * Enum value must be committed before use — run in two steps.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./connection');

const migrate = async () => {
  try {
    await pool.query(`
      DO $$ BEGIN
        ALTER TYPE notice_scope ADD VALUE IF NOT EXISTS 'role';
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    console.log('1. Added notice_scope enum value: role');
  } catch (err) {
    if (!err.message.includes('already exists')) throw err;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      ALTER TABLE notices
        ADD COLUMN IF NOT EXISTS audience TEXT[] DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS dept_id UUID REFERENCES departments(id) ON DELETE SET NULL
    `);

    await client.query(`ALTER TABLE notices DROP CONSTRAINT IF EXISTS chk_notice_target`);
    await client.query(`
      ALTER TABLE notices ADD CONSTRAINT chk_notice_target CHECK (
        (scope = 'global'::notice_scope AND target_id IS NULL) OR
        (scope = 'dept'::notice_scope AND target_id IS NOT NULL) OR
        (scope = 'class'::notice_scope AND target_id IS NOT NULL) OR
        (scope = 'role'::notice_scope AND target_id IS NULL
          AND audience IS NOT NULL AND cardinality(audience) > 0)
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notices_audience ON notices USING GIN (audience)
    `);

    await client.query('COMMIT');
    console.log('✅ Notices audience migration completed');
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
