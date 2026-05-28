const pool = require('../db/connection');

const createLeaveRequest = async (student_id, type, from_date, to_date, reason, document_url) => {
  const { rows } = await pool.query(
    `INSERT INTO leave_requests (student_id, type, from_date, to_date, reason, document_url)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [student_id, type, from_date, to_date, reason, document_url || null]
  );
  return rows[0];
};

const getMyRequests = async (student_id) => {
  const { rows } = await pool.query(
    'SELECT * FROM leave_requests WHERE student_id = $1 ORDER BY created_at DESC',
    [student_id]
  );
  return rows;
};

const getPendingForHod = async (dept_id) => {
  const { rows } = await pool.query(
    `SELECT lr.*, u.full_name, u.username
     FROM leave_requests lr
     JOIN users u ON lr.student_id = u.id
     WHERE u.dept_id = $1 AND u.role IN ('faculty', 'advisor') AND lr.status = 'pending'
     ORDER BY lr.created_at DESC`,
    [dept_id]
  );
  return rows;
};

const getPendingForAdvisor = async (advisor_id) => {
  const { rows } = await pool.query(
    `SELECT lr.*, u.full_name, u.username, p.roll_no
     FROM leave_requests lr
     JOIN users u ON lr.student_id = u.id AND u.role = 'student'
     JOIN student_profiles p ON p.user_id = u.id
     JOIN student_academic_history sah ON sah.student_id = u.id AND sah.is_active = true
     WHERE (sah.advisor1_id = $1 OR sah.advisor2_id = $1) AND lr.status = 'pending'
     ORDER BY lr.created_at DESC`,
    [advisor_id]
  );
  return rows;
};

const processRequest = async (id, status, reviewed_by, remarks) => {
  const { rows } = await pool.query(
    `UPDATE leave_requests
     SET status = $1, reviewed_by = $2, reviewed_at = NOW(), remarks = $3
     WHERE id = $4 RETURNING *`,
    [status, reviewed_by, remarks || null, id]
  );
  return rows[0];
};

module.exports = {
  createLeaveRequest,
  getMyRequests,
  getPendingForHod,
  getPendingForAdvisor,
  processRequest
};
