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
      "SELECT * FROM users WHERE username = $1 AND is_active = true",
      [username]
    );
    return rows[0];
  }
};

module.exports = AuthModel;
