const pool = require('../db/connection');

/**
 * Check if a timetable slot exists for a given course_assignment on a specific day_of_week and period.
 * Handles both direct (course_assignment_id) and indirect (department_course_id) slot storage.
 * Returns the slot row if found, null otherwise.
 */
const checkTimetableSlot = async (course_assignment_id, day_of_week, period_no) => {
  const { rows } = await pool.query(
    `SELECT ts.id FROM timetable_slots ts
     WHERE ts.day_of_week = $2
       AND ts.period_no = $3
       AND (
         ts.course_assignment_id = $1
         OR (
           ts.department_course_id IS NOT NULL
           AND EXISTS (
             SELECT 1
             FROM department_courses dc
             JOIN courses c ON c.code = dc.course_code AND c.dept_id = dc.dept_id
             JOIN course_assignments ca ON ca.course_id = c.id AND ca.class_id = ts.class_id
             WHERE dc.id = ts.department_course_id
               AND ca.id = $1
           )
         )
       )`,
    [course_assignment_id, day_of_week, period_no]
  );
  return rows[0] || null;
};

/**
 * Create an override request from a faculty member.
 */
const createOverrideRequest = async (course_assignment_id, faculty_id, requested_date, requested_period, reason) => {
  const { rows } = await pool.query(
    `INSERT INTO attendance_overrides (course_assignment_id, faculty_id, requested_date, requested_period, reason)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (course_assignment_id, faculty_id, requested_date, requested_period)
     DO UPDATE SET reason = EXCLUDED.reason, status = 'pending', reviewed_by = NULL, reviewed_at = NULL
     RETURNING *`,
    [course_assignment_id, faculty_id, requested_date, requested_period, reason]
  );
  return rows[0];
};

/**
 * Get a specific override by matching criteria.
 */
const getOverride = async (course_assignment_id, faculty_id, requested_date, requested_period) => {
  const { rows } = await pool.query(
    `SELECT * FROM attendance_overrides
     WHERE course_assignment_id = $1 AND faculty_id = $2
       AND requested_date = $3 AND requested_period = $4`,
    [course_assignment_id, faculty_id, requested_date, requested_period]
  );
  return rows[0] || null;
};

/**
 * Get all pending override requests for classes that the advisor manages.
 */
const getPendingOverridesForAdvisor = async (advisor_id) => {
  const { rows } = await pool.query(
    `SELECT ao.*,
            u.full_name AS faculty_name,
            c.name AS course_name, c.code AS course_code,
            cl.name AS class_name
     FROM attendance_overrides ao
     JOIN users u ON u.id = ao.faculty_id
     JOIN course_assignments ca ON ca.id = ao.course_assignment_id
     JOIN courses c ON c.id = ca.course_id
     JOIN classes cl ON cl.id = ca.class_id
     WHERE ao.status = 'pending'
       AND (cl.advisor1_id = $1 OR cl.advisor2_id = $1)
     ORDER BY ao.created_at DESC`,
    [advisor_id]
  );
  return rows;
};

/**
 * Get all override requests for a department (for HOD view).
 */
const getPendingOverridesForHOD = async (dept_id) => {
  const { rows } = await pool.query(
    `SELECT ao.*,
            u.full_name AS faculty_name,
            c.name AS course_name, c.code AS course_code,
            cl.name AS class_name
     FROM attendance_overrides ao
     JOIN users u ON u.id = ao.faculty_id
     JOIN course_assignments ca ON ca.id = ao.course_assignment_id
     JOIN courses c ON c.id = ca.course_id
     JOIN classes cl ON cl.id = ca.class_id
     WHERE ao.status = 'pending'
       AND cl.dept_id = $1
     ORDER BY ao.created_at DESC`,
    [dept_id]
  );
  return rows;
};

/**
 * Approve or reject an override request.
 */
const reviewOverride = async (override_id, status, reviewed_by) => {
  const { rows } = await pool.query(
    `UPDATE attendance_overrides
     SET status = $2, reviewed_by = $3, reviewed_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [override_id, status, reviewed_by]
  );
  return rows[0];
};

module.exports = {
  checkTimetableSlot,
  createOverrideRequest,
  getOverride,
  getPendingOverridesForAdvisor,
  getPendingOverridesForHOD,
  reviewOverride
};
