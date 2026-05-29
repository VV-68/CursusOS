-- Safe, backward-compatible migration for batch lifecycle architecture.
-- This migration is additive only and does not delete/overwrite existing history.

BEGIN;

-- 1) Extend classes as permanent admission batches (keep old columns intact).
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS batch_year smallint,
  ADD COLUMN IF NOT EXISTS current_semester_number smallint,
  ADD COLUMN IF NOT EXISTS current_year_number smallint,
  ADD COLUMN IF NOT EXISTS is_graduated boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS deactivation_requested boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deactivation_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS deactivation_requested_by uuid REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS deactivation_approved_by uuid REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS deactivated_at timestamptz,
  ADD COLUMN IF NOT EXISTS max_semesters smallint DEFAULT 8,
  ADD COLUMN IF NOT EXISTS course_completed boolean DEFAULT false;

-- 2) Ensure academic history has semester number and temporal columns.
ALTER TABLE student_academic_history
  ADD COLUMN IF NOT EXISTS current_semester smallint,
  ADD COLUMN IF NOT EXISTS promoted_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS ended_at timestamptz;

-- 3) Promotion requests table.
CREATE TABLE IF NOT EXISTS batch_promotion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES classes(id),
  requested_by uuid NOT NULL REFERENCES users(id),
  current_semester smallint NOT NULL,
  target_semester smallint NOT NULL,
  current_year smallint NOT NULL,
  target_year smallint NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  remarks text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz
);

-- 4) Deactivation requests table.
CREATE TABLE IF NOT EXISTS batch_deactivation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES classes(id),
  requested_by uuid NOT NULL REFERENCES users(id),
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz
);

-- 5) Helpful indexes.
CREATE INDEX IF NOT EXISTS idx_sah_student_active
  ON student_academic_history(student_id, is_active, promoted_at DESC);
CREATE INDEX IF NOT EXISTS idx_sah_batch_active
  ON student_academic_history(class_id, is_active);
CREATE INDEX IF NOT EXISTS idx_bpr_batch_status
  ON batch_promotion_requests(batch_id, status, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_bdr_batch_status
  ON batch_deactivation_requests(batch_id, status, requested_at DESC);

-- 6) Backfill class progression fields from existing data, preserving values if already present.
UPDATE classes c
SET
  batch_year = COALESCE(c.batch_year, EXTRACT(YEAR FROM c.created_at)::smallint),
  current_year_number = COALESCE(c.current_year_number, c.year, 1),
  current_semester_number = COALESCE(
    c.current_semester_number,
    (
      SELECT sah.current_semester
      FROM student_academic_history sah
      WHERE sah.class_id = c.id AND sah.is_active = true
      ORDER BY sah.promoted_at DESC NULLS LAST
      LIMIT 1
    ),
    CASE
      WHEN c.year IS NULL THEN 1
      ELSE ((c.year - 1) * 2 + 1)
    END
  ),
  is_active = COALESCE(c.is_active, true),
  max_semesters = COALESCE(c.max_semesters, 8);

-- 7) Seed missing academic-history rows from existing student_profiles.
INSERT INTO student_academic_history (
  student_id,
  class_id,
  semester_id,
  current_year,
  current_semester,
  advisor1_id,
  advisor2_id,
  promoted_at,
  is_active,
  remarks
)
SELECT
  sp.user_id,
  c.id,
  c.semester_id,
  COALESCE(c.current_year_number, c.year, 1),
  COALESCE(
    c.current_semester_number,
    CASE WHEN c.year IS NULL THEN 1 ELSE ((c.year - 1) * 2 + 1) END
  ),
  c.advisor1_id,
  c.advisor2_id,
  now(),
  true,
  'Backfilled during batch lifecycle migration'
FROM student_profiles sp
JOIN classes c ON c.id = sp.class_id
LEFT JOIN student_academic_history sah
  ON sah.student_id = sp.user_id
  AND sah.class_id = sp.class_id
  AND sah.is_active = true
WHERE sah.id IS NULL;

COMMIT;
