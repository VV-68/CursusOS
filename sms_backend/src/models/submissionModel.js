const pool = require('../db/connection');

// Create a new submission record after file is uploaded to Supabase Storage
const createSubmission = async ({ assignment_id, student_id, file_url, file_name, file_size, is_late }) => {
  const { rows } = await pool.query(
    `INSERT INTO assignment_submissions
       (assignment_id, student_id, file_url, file_name, file_size, is_late)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (assignment_id, student_id)
     DO UPDATE SET
       file_url = EXCLUDED.file_url,
       file_name = EXCLUDED.file_name,
       file_size = EXCLUDED.file_size,
       submitted_at = NOW(),
       is_late = EXCLUDED.is_late,
       marks_awarded = NULL,
       feedback = NULL,
       evaluated_by = NULL,
       evaluated_at = NULL
     RETURNING *`,
    [assignment_id, student_id, file_url, file_name, file_size || null, is_late]
  );
  return rows[0];
};

// Get all submissions for an assignment (faculty view)
const getByAssignment = async (assignment_id) => {
  const { rows } = await pool.query(
    `SELECT s.*, u.full_name AS student_name, sp.roll_no,
            ev.full_name AS evaluated_by_name
     FROM assignment_submissions s
     JOIN users u ON u.id = s.student_id
     JOIN student_profiles sp ON sp.user_id = s.student_id
     LEFT JOIN users ev ON ev.id = s.evaluated_by
     WHERE s.assignment_id = $1
     ORDER BY sp.roll_no ASC`,
    [assignment_id]
  );
  return rows;
};

// Get a student's own submission for an assignment
const getStudentSubmission = async (assignment_id, student_id) => {
  const { rows } = await pool.query(
    `SELECT * FROM assignment_submissions
     WHERE assignment_id = $1 AND student_id = $2`,
    [assignment_id, student_id]
  );
  return rows[0];
};

// Save evaluation (marks + feedback) for a submission
const evaluateSubmission = async (submission_id, { marks_awarded, feedback, evaluated_by }) => {
  const { rows } = await pool.query(
    `UPDATE assignment_submissions
     SET marks_awarded = $1,
         feedback = $2,
         evaluated_by = $3,
         evaluated_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [marks_awarded, feedback || null, evaluated_by, submission_id]
  );
  return rows[0];
};

module.exports = { createSubmission, getByAssignment, getStudentSubmission, evaluateSubmission };
