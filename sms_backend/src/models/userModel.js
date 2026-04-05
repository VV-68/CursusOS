const pool = require('../db/connection');

const createUser = async ({ username, full_name, role, dept_id, email, phone, password_hash }) => {
  const { rows } = await pool.query(
    `INSERT INTO users
       (username, password_hash, role, full_name, email, phone, dept_id, must_change_password, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, TRUE)
     RETURNING id, username, role, full_name, email, phone, dept_id, must_change_password, is_active, created_at`,
    [username, password_hash, role, full_name, email || null, phone || null, dept_id]
  );
  return rows[0];
};

const getAllUsers = async (deptId = null, roleFilter = null) => {
  let query = 'SELECT id, username, full_name, role, dept_id, email, phone, is_active, created_at FROM users WHERE is_active = true';
  const params = [];
  if (deptId) {
    params.push(deptId);
    query += ` AND dept_id = $${params.length}`;
  }
  if (roleFilter && roleFilter.length > 0) {
    params.push(roleFilter);
    query += ` AND role = ANY($${params.length})`;
  }
  query += ' ORDER BY full_name ASC';
  const { rows } = await pool.query(query, params);
  return rows;
};

const getUserById = async (id) => {
  const { rows } = await pool.query(
    `SELECT id, username, role, full_name, email, phone, dept_id, must_change_password, is_active
     FROM users WHERE id = $1`,
    [id]
  );
  return rows[0];
};

const getUserByUsername = async (username) => {
  const { rows } = await pool.query(
    'SELECT id, username, password_hash, role, dept_id, is_active, must_change_password, full_name FROM users WHERE username = $1',
    [username]
  );
  return rows[0];
};

const getUserPasswordHash = async (id) => {
  const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [id]);
  return rows[0];
};

const resetUserPassword = async (id, password_hash) => {
  const { rows } = await pool.query(
    `UPDATE users SET password_hash = $1, must_change_password = TRUE, updated_at = NOW()
     WHERE id = $2
     RETURNING id, username, role`,
    [password_hash, id]
  );
  return rows[0];
};

const changePassword = async (id, password_hash) => {
  await pool.query(
    'UPDATE users SET password_hash = $1, must_change_password = FALSE, updated_at = NOW() WHERE id = $2',
    [password_hash, id]
  );
};

const deactivateUser = async (id) => {
  const { rows } = await pool.query(
    `UPDATE users SET is_active = FALSE, updated_at = NOW()
     WHERE id = $1 RETURNING id`,
    [id]
  );
  return rows[0];
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  getUserByUsername,
  getUserPasswordHash,
  resetUserPassword,
  changePassword,
  deactivateUser
};
