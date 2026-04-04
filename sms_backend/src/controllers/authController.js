const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AuthModel = require("../models/authModel");
const db = require("../db/connection");

const SECRET = "mysecretkey";

const AuthController = {
  register: (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password required"
      });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    AuthModel.createUser(username, hashedPassword, (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({
            message: "Username already exists"
          });
        }

        return res.status(500).json({
          message: "Error creating user",
          error: err.message
        });
      }

      res.json({
        message: "User registered successfully"
      });
    });
  },

  login: (req, res) => {
    const { username, password } = req.body;

    AuthModel.findUserByUsername(username, (err, results) => {
      if (err) {
        return res.status(500).json({
          message: "Error during login"
        });
      }

      if (results.length === 0) {
        return res.status(401).json({
          message: "Invalid username"
        });
      }

      const user = results[0];

      // Block if already logged in
      if (user.active_token) {
        return res.status(403).json({
          message: "User already logged in. Please logout first."
        });
      }

      const isMatch = bcrypt.compareSync(password, user.password);

      if (!isMatch) {
        return res.status(401).json({
          message: "Invalid password"
        });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username },
        SECRET,
        { expiresIn: "1h" }
      );

      // Save token as active session
      const sql = "UPDATE users SET active_token = ? WHERE id = ?";
      db.query(sql, [token, user.id], (err) => {
        if (err) {
          return res.status(500).json({
            message: "Error saving session"
          });
        }

        res.json({
          message: "Login successful",
          token
        });
      });
    });
  },

  logout: (req, res) => {
    // req.user is set by verifyToken middleware
    const userId = req.user.id;

    const sql = "UPDATE users SET active_token = NULL WHERE id = ?";
    db.query(sql, [userId], (err) => {
      if (err) {
        return res.status(500).json({
          message: "Logout failed"
        });
      }

      res.json({
        message: "Logged out successfully"
      });
    });
  }
};

module.exports = AuthController;
