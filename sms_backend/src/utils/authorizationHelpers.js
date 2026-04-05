const pool = require('../db/connection');

/**
 * Check if a faculty member owns a course assignment.
 * Returns the course_assignment row if authorized, null if not.
 */
const getFacultyAssignment = async (facultyId, courseAssignmentId) => {
  const { rows } = await pool.query(
    `SELECT ca.*, c.name AS course_name, cl.name AS class_name, cl.dept_id
     FROM course_assignments ca
     JOIN courses c  ON c.id  = ca.course_id
     JOIN classes cl ON cl.id = ca.class_id
     WHERE ca.id = $1 AND ca.faculty_id = $2`,
    [courseAssignmentId, facultyId]
  );
  return rows[0] || null;
};

/**
 * Check if a student is enrolled in the class linked to a course_assignment.
 */
const isStudentInAssignment = async (studentId, courseAssignmentId) => {
  const { rows } = await pool.query(
    `SELECT 1
     FROM student_profiles sp
     JOIN course_assignments ca ON ca.class_id = sp.class_id
     WHERE sp.user_id = $1 AND ca.id = $2`,
    [studentId, courseAssignmentId]
  );
  return rows.length > 0;
};

/**
 * Check if an advisor owns the class a student belongs to.
 */
const isAdvisorOfStudent = async (advisorId, studentId) => {
  const { rows } = await pool.query(
    `SELECT 1
     FROM student_profiles sp
     JOIN classes cl ON cl.id = sp.class_id
     WHERE sp.user_id = $1
       AND (cl.advisor1_id = $2 OR cl.advisor2_id = $2)`,
    [studentId, advisorId]
  );
  return rows.length > 0;
};

/**
 * Get all course_assignments for a faculty member (active semester).
 */
const getFacultyAssignments = async (facultyId) => {
  const { rows } = await pool.query(
    `SELECT ca.id, ca.course_id, ca.class_id,
            c.name AS course_name, c.code AS course_code,
            cl.name AS class_name, cl.year, cl.section,
            d.name AS dept_name, d.code AS dept_code,
            s.name AS semester_name
     FROM course_assignments ca
     JOIN courses   c  ON c.id  = ca.course_id
     JOIN classes   cl ON cl.id = ca.class_id
     JOIN departments d ON d.id = cl.dept_id
     JOIN semesters s  ON s.id  = ca.semester_id
     WHERE ca.faculty_id = $1 AND s.is_active = TRUE
     ORDER BY d.code, cl.name, c.name`,
    [facultyId]
  );
  return rows;
};

module.exports = {
  getFacultyAssignment,
  isStudentInAssignment,
  isAdvisorOfStudent,
  getFacultyAssignments,
};
