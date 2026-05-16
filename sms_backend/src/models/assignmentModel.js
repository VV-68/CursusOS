const pool = require('../db/connection');

const createAssignment = async ({
  title, description, course_assignment_id, created_by, due_date, max_marks, allow_late_submission,
}) => {
  const { rows } = await pool.query(
    `INSERT INTO assignments
       (title, description, course_assignment_id, created_by, due_date, max_marks, allow_late_submission, is_published)
     VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
     RETURNING *`,
    [title, description || null, course_assignment_id, created_by, due_date, max_marks, allow_late_submission || false]
  );
  return rows[0];
};

const setPublished = async (id, is_published) => {
  const { rows } = await pool.query(
    `UPDATE assignments SET is_published = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [is_published, id]
  );
  return rows[0];
};

const setQuestionFile = async (id, { question_file_path, question_file_name, question_mime_type }) => {
  const { rows } = await pool.query(
    `UPDATE assignments
     SET question_file_path = $1, question_file_name = $2, question_mime_type = $3, updated_at = NOW()
     WHERE id = $4 RETURNING *`,
    [question_file_path, question_file_name, question_mime_type, id]
  );
  return rows[0];
};

const clearQuestionFile = async (id) => {
  const { rows } = await pool.query(
    `UPDATE assignments
     SET question_file_path = NULL, question_file_name = NULL, question_mime_type = NULL, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id]
  );
  return rows[0];
};

const getByAssignmentId = async (course_assignment_id) => {
  const { rows } = await pool.query(
    `SELECT a.*,
            u.full_name AS created_by_name,
            COUNT(s.id)::int AS submission_count,
            COUNT(s.id) FILTER (WHERE s.is_evaluated = TRUE)::int AS evaluated_count
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

const getById = async (id) => {
  const { rows } = await pool.query(
    `SELECT a.*, u.full_name AS created_by_name,
            ca.faculty1_id, ca.faculty2_id, ca.class_id, ca.course_id
     FROM assignments a
     JOIN users u ON u.id = a.created_by
     JOIN course_assignments ca ON ca.id = a.course_assignment_id
     WHERE a.id = $1`,
    [id]
  );
  return rows[0];
};

const deleteById = async (id) => {
  const { rows } = await pool.query(`DELETE FROM assignments WHERE id = $1 RETURNING *`, [id]);
  return rows[0];
};

const getSubmissionFilePaths = async (assignmentId) => {
  const { rows } = await pool.query(
    `SELECT file_url FROM assignment_submissions WHERE assignment_id = $1 AND file_url IS NOT NULL`,
    [assignmentId]
  );
  return rows.map((r) => r.file_url);
};

module.exports = {
  createAssignment,
  setPublished,
  setQuestionFile,
  clearQuestionFile,
  getByAssignmentId,
  getById,
  deleteById,
  getSubmissionFilePaths,
};
