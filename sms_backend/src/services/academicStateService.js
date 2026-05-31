const pool = require('../db/connection');

const deriveYearFromSemester = (semesterNumber = 1) => Math.max(1, Math.ceil(Number(semesterNumber || 1) / 2));

const getBatchCurrentState = async (batchId) => {
  const { rows } = await pool.query(
    `SELECT
      c.id,
      c.name,
      c.dept_id,
      d.institution_id,
      c.semester_id AS legacy_semester_id,
      COALESCE(c.current_semester_number, sah.current_semester, 1) AS current_semester_number,
      COALESCE(c.current_year_number, sah.current_year, 1) AS current_year_number,
      COALESCE(c.is_active, true) AS is_active,
      COALESCE(c.is_graduated, false) AS is_graduated,
      c.max_semesters,
      c.course_completed,
      c.advisor1_id,
      c.advisor2_id
    FROM classes c
    JOIN departments d ON c.dept_id = d.id
    LEFT JOIN LATERAL (
      SELECT current_semester, current_year
      FROM student_academic_history
      WHERE class_id = c.id AND is_active = true
      ORDER BY promoted_at DESC NULLS LAST
      LIMIT 1
    ) sah ON true
    WHERE c.id = $1`,
    [batchId]
  );

  return rows[0] || null;
};

const getStudentActiveAcademicState = async (studentId) => {
  const { rows } = await pool.query(
    `SELECT
      sah.*,
      c.name AS batch_name,
      COALESCE(c.is_active, true) AS batch_is_active,
      COALESCE(c.is_graduated, false) AS batch_is_graduated,
      c.deactivated_at
    FROM student_academic_history sah
    JOIN classes c ON c.id = sah.class_id
    WHERE sah.student_id = $1 AND sah.is_active = true
    ORDER BY sah.promoted_at DESC NULLS LAST
    LIMIT 1`,
    [studentId]
  );

  if (rows[0]) return rows[0];

  // Legacy fallback for not-yet-migrated students.
  const fallback = await pool.query(
    `SELECT
      sp.class_id,
      c.semester_id,
      COALESCE(c.current_semester_number, CASE WHEN c.year IS NULL THEN 1 ELSE ((c.year - 1) * 2 + 1) END) AS current_semester,
      COALESCE(c.current_year_number, c.year, 1) AS current_year,
      c.advisor1_id,
      c.advisor2_id,
      c.name AS batch_name,
      COALESCE(c.is_active, true) AS batch_is_active,
      COALESCE(c.is_graduated, false) AS batch_is_graduated
    FROM student_profiles sp
    JOIN classes c ON c.id = sp.class_id
    WHERE sp.user_id = $1
    LIMIT 1`,
    [studentId]
  );

  return fallback.rows[0] || null;
};

/**
 * Best-effort compatibility helper: resolves a semester number to a legacy semester_id.
 * This is NOT used for any critical business logic. Academic state comes from
 * classes.current_semester_number and student_academic_history.current_semester.
 * Returns null if the semesters table is empty or unavailable.
 */
const resolveSemesterIdForNumber = async (semesterNumber) => {
  // Legacy function: returns null since we no longer query the semesters table for state resolution.
  return null;
};

module.exports = {
  deriveYearFromSemester,
  getBatchCurrentState,
  getStudentActiveAcademicState,
  resolveSemesterIdForNumber,
};
