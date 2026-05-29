const pool = require('../db/connection');

const addDocument = async (student_id, document_type, file_url, file_name, uploaded_by) => {
  const { rows } = await pool.query(
    `INSERT INTO student_documents 
      (student_id, document_type, file_url, file_name, uploaded_by, verification_status)
     VALUES ($1, $2, $3, $4, $5, 'Pending')
     RETURNING *`,
    [student_id, document_type, file_url, file_name, uploaded_by]
  );
  return rows[0];
};

const getDocumentsByStudent = async (student_id) => {
  const { rows } = await pool.query(
    `SELECT sd.*, u.full_name AS uploaded_by_name, v.full_name AS verified_by_name
     FROM student_documents sd
     LEFT JOIN users u ON u.id = sd.uploaded_by
     LEFT JOIN users v ON v.id = sd.verified_by
     WHERE sd.student_id = $1
     ORDER BY sd.uploaded_at DESC`,
    [student_id]
  );
  return rows;
};

const getDocumentById = async (id) => {
  const { rows } = await pool.query(
    `SELECT * FROM student_documents WHERE id = $1`,
    [id]
  );
  return rows[0];
};

const updateVerificationStatus = async (id, status, verified_by) => {
  const { rows } = await pool.query(
    `UPDATE student_documents 
     SET verification_status = $1, verified_by = $2, verified_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [status, verified_by, id]
  );
  return rows[0];
};

const deleteDocument = async (id, student_id) => {
  const { rows } = await pool.query(
    `DELETE FROM student_documents WHERE id = $1 AND student_id = $2 RETURNING *`,
    [id, student_id]
  );
  return rows[0];
};

module.exports = {
  addDocument,
  getDocumentsByStudent,
  getDocumentById,
  updateVerificationStatus,
  deleteDocument
};
