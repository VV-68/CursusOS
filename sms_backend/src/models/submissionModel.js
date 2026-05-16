const pool = require('../db/connection');

const createSubmission = async ({
  assignment_id, student_id, file_url, file_name, file_size, mime_type, is_late,
}) => {
  const { rows } = await pool.query(
    `INSERT INTO assignment_submissions
       (assignment_id, student_id, file_url, file_name, file_size, mime_type, is_late)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (assignment_id, student_id)
     DO UPDATE SET
       file_url = EXCLUDED.file_url,
       file_name = EXCLUDED.file_name,
       file_size = EXCLUDED.file_size,
       mime_type = EXCLUDED.mime_type,
       submitted_at = NOW(),
       is_late = EXCLUDED.is_late,
       is_evaluated = FALSE,
       marks_awarded = NULL,
       feedback = NULL,
       evaluated_by = NULL,
       evaluated_at = NULL,
       updated_at = NOW()
     WHERE assignment_submissions.is_evaluated = FALSE
     RETURNING *`,
    [assignment_id, student_id, file_url, file_name, file_size || null, mime_type || null, is_late]
  );
  return rows[0];
};

const getByAssignment = async (assignment_id, { limit = 50, offset = 0 } = {}) => {
  const { rows } = await pool.query(
    `SELECT s.*, u.full_name AS student_name, sp.roll_no, ev.full_name AS evaluated_by_name
     FROM assignment_submissions s
     JOIN users u ON u.id = s.student_id
     JOIN student_profiles sp ON sp.user_id = s.student_id
     LEFT JOIN users ev ON ev.id = s.evaluated_by
     WHERE s.assignment_id = $1
     ORDER BY sp.roll_no ASC
     LIMIT $2 OFFSET $3`,
    [assignment_id, limit, offset]
  );
  return rows;
};

const countByAssignment = async (assignment_id) => {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS total FROM assignment_submissions WHERE assignment_id = $1`,
    [assignment_id]
  );
  return rows[0]?.total || 0;
};

const getStudentSubmission = async (assignment_id, student_id) => {
  const { rows } = await pool.query(
    `SELECT * FROM assignment_submissions WHERE assignment_id = $1 AND student_id = $2`,
    [assignment_id, student_id]
  );
  return rows[0];
};

const getById = async (id) => {
  const { rows } = await pool.query(
    `SELECT s.*, a.course_assignment_id, a.max_marks, a.created_by, a.due_date
     FROM assignment_submissions s
     JOIN assignments a ON a.id = s.assignment_id
     WHERE s.id = $1`,
    [id]
  );
  return rows[0];
};

const evaluateSubmission = async (submission_id, { marks_awarded, feedback, evaluated_by }) => {
  const { rows } = await pool.query(
    `UPDATE assignment_submissions
     SET marks_awarded = $1, feedback = $2, evaluated_by = $3,
         evaluated_at = NOW(), is_evaluated = TRUE, updated_at = NOW()
     WHERE id = $4 AND is_evaluated = FALSE
     RETURNING *`,
    [marks_awarded, feedback || null, evaluated_by, submission_id]
  );
  if (!rows[0]) {
    const existing = await getById(submission_id);
    if (existing?.is_evaluated) {
      const { rows: updated } = await pool.query(
        `UPDATE assignment_submissions
         SET marks_awarded = $1, feedback = $2, evaluated_by = $3, evaluated_at = NOW(), updated_at = NOW()
         WHERE id = $4 RETURNING *`,
        [marks_awarded, feedback || null, evaluated_by, submission_id]
      );
      return updated[0];
    }
  }
  return rows[0];
};

const deleteSubmission = async (id) => {
  const { rows } = await pool.query(
    `DELETE FROM assignment_submissions
     WHERE id = $1 AND is_evaluated = FALSE
     RETURNING *`,
    [id]
  );
  return rows[0];
};

module.exports = {
  createSubmission,
  getByAssignment,
  countByAssignment,
  getStudentSubmission,
  getById,
  evaluateSubmission,
  deleteSubmission,
};
