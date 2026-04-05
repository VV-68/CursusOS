const pool = require("../db/connection");

const AuthModel = {
  createUser: async (username, hashedPassword) => {
    const { rows } = await pool.query(
      "INSERT INTO users (username, password_hash, role, full_name) VALUES ($1, $2, 'student', $1) RETURNING *",
      [username, hashedPassword]
    );
    return rows[0];
  },

  findUserByUsername: async (username) => {
    const { rows } = await pool.query(
      "SELECT id, username, password_hash, role, dept_id, is_active, must_change_password FROM users WHERE username = $1",
      [username]
    );
    return rows[0];
  }
};

module.exports = AuthModel;
