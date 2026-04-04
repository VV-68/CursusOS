const db = require("../db/connection");

const AuthModel = {
  createUser: (username, hashedPassword, callback) => {
    const sql = "INSERT INTO users (username, password) VALUES (?, ?)";
    db.query(sql, [username, hashedPassword], callback);
  },

  findUserByUsername: (username, callback) => {
    const sql = "SELECT * FROM users WHERE username = ?";
    db.query(sql, [username], callback);
  }
};

module.exports = AuthModel;
