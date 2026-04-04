const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

const AuthController = {
  login: async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    try {
      const user = await userModel.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role, dept_id: user.dept_id, must_change_password: user.must_change_password },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        message: "Login successful",
        token,
        must_change_password: user.must_change_password
      });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },

  changePassword: async (req, res) => {
    const { current_password, new_password } = req.body;
    
    if (!current_password || !new_password) {
      return res.status(400).json({ error: "Passwords required" });
    }

    try {
      const hashObj = await userModel.getUserPasswordHash(req.user.id);
      const isValid = await bcrypt.compare(current_password, hashObj.password_hash);
      
      if (!isValid) {
        return res.status(400).json({ error: "Invalid current password" });
      }

      await userModel.changePassword(req.user.id, new_password);
      res.json({ message: "Password changed successfully" });
    } catch (err) {
      res.status(500).json({ error: "Server error", error: err.message });
    }
  },

  logout: async (req, res) => {
    res.json({ message: "Logged out successfully" });
  }
};

module.exports = AuthController;
