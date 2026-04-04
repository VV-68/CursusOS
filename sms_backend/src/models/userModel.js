const pool = require('../db/connection');
const bcrypt = require('bcryptjs');

const getAllUsers = async (deptId = null) => {
  let query = 'SELECT id, username, full_name, role, dept_id, email, phone, is_active FROM users WHERE is_active = true';
  const params = [];
  if (deptId) {
    query += ' AND dept_id = $1';
    params.push(deptId);
  }
  const { rows } = await pool.query(query, params);
  return rows;
};

const createUser = async (userData) => {
  const { username, full_name, role, dept_id, email, phone } = userData;
  const password_hash = await bcrypt.hash('Welcome@123', 10);
  
  const { rows } = await pool.query(
    `INSERT INTO users (username, full_name, role, dept_id, email, phone, password_hash, must_change_password) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, true) RETURNING id`,
    [username, full_name, role, dept_id, email, phone, password_hash]
  );
  return rows[0];
};

const resetPassword = async (id) => {
  const password_hash = await bcrypt.hash('Welcome@123', 10);
  await pool.query(
    'UPDATE users SET password_hash = $1, must_change_password = true WHERE id = $2',
    [password_hash, id]
  );
};

const changePassword = async (id, newPassword) => {
  const password_hash = await bcrypt.hash(newPassword, 10);
  await pool.query(
    'UPDATE users SET password_hash = $1, must_change_password = false WHERE id = $2',
    [password_hash, id]
  );
};

const deleteUser = async (id) => {
  await pool.query('UPDATE users SET is_active = false WHERE id = $1', [id]);
};

const getUserPasswordHash = async (id) => {
  const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [id]);
  return rows[0];
};

const getUserByUsername = async (username) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE username = $1 AND is_active = true', [username]);
  return rows[0];
};

module.exports = {
  getAllUsers,
  createUser,
  resetPassword,
  changePassword,
  deleteUser,
  getUserPasswordHash,
  getUserByUsername
};
