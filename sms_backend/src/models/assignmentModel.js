const pool = require('../db/connection');

// Create a new assignment
const createAssignment = async ({ title, description, course_assignment_id, created_by, due_date, max_marks, allow_late_submission }) => {
  const { rows } = await pool.query(
    `INSERT INTO assignments
       (title, description, course_assignment_id, created_by, due_date, max_marks, allow_late_submission, is_published)
     VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
     RETURNING *`,
    [title, description || null, course_assignment_id, created_by, due_date, max_marks, allow_late_submission || false]
  );
  return rows[0];
};

// Publish or unpublish an assignment
const setPublished = async (id, is_published) => {
  const { rows } = await pool.query(
    `UPDATE assignments SET is_published = $1, updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [is_published, id]
  );
  return rows[0];
};

// Get all assignments for a course_assignment (faculty view — all including unpublished)
const getByAssignmentId = async (course_assignment_id) => {
  const { rows } = await pool.query(
    `SELECT a.*,
            u.full_name AS created_by_name,
            COUNT(s.id) AS submission_count
     FROM assignments a
     JOIN users u ON u.id = a.created_by
     LEFT JOIN assignment_submissions s ON s.assignment_id = a.id
     WHERE a.course_assignment_id = $1
     GROUP BY a.id, u.full_name
     ORDER BY a.due_date DESC`,
    [course_assignment_id]
  );
  return rows;
};

// Get published assignments visible to students for a course_assignment
const getPublishedForStudents = async (course_assignment_id, student_id) => {
  const { rows } = await pool.query(
    `SELECT a.id, a.title, a.description, a.due_date, a.max_marks, a.allow_late_submission, a.created_at,
            u.full_name AS posted_by,
            s.id AS submission_id, s.submitted_at, s.is_late, s.marks_awarded, s.feedback
     FROM assignments a
     JOIN users u ON u.id = a.created_by
     LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.student_id = $2
     WHERE a.course_assignment_id = $1 AND a.is_published = TRUE
     ORDER BY a.due_date DESC`,
    [course_assignment_id, student_id]
  );
  return rows;
};

// Get a single assignment by ID
const getById = async (id) => {
  const { rows } = await pool.query(
    `SELECT a.*, u.full_name AS created_by_name,
            ca.faculty_id, ca.class_id, ca.course_id
     FROM assignments a
     JOIN users u ON u.id = a.created_by
     JOIN course_assignments ca ON ca.id = a.course_assignment_id
     WHERE a.id = $1`,
    [id]
  );
  return rows[0];
};

// Update assignment details
const updateAssignment = async (id, { title, description, due_date, max_marks, allow_late_submission }) => {
  const { rows } = await pool.query(
    `UPDATE assignments
     SET title = COALESCE($1, title),
         description = COALESCE($2, description),
         due_date = COALESCE($3, due_date),
         max_marks = COALESCE($4, max_marks),
         allow_late_submission = COALESCE($5, allow_late_submission),
         updated_at = NOW()
     WHERE id = $6
     RETURNING *`,
    [title, description, due_date, max_marks, allow_late_submission, id]
  );
  return rows[0];
};

module.exports = {
  createAssignment, setPublished, getByAssignmentId,
  getPublishedForStudents, getById, updateAssignment
};
