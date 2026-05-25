const jwt = require('jsonwebtoken');
const { comparePassword, hashPassword } = require('../utils/passwordUtils');
const userModel = require('../models/userModel');
const pool = require('../db/connection');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

const AuthController = {
  login: async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
      const user = await userModel.getUserByUsernameOrEmail(username.trim().toLowerCase());
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (!user.is_active) {
        return res.status(401).json({ error: 'Account is disabled' });
      }

      const isValid = await comparePassword(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      let class_id = null;
      if (user.role === 'student') {
        const { rows } = await pool.query('SELECT class_id FROM student_profiles WHERE user_id = $1', [user.id]);
        if (rows.length > 0) {
          class_id = rows[0].class_id;
        }
      }

      const token = jwt.sign(
        {
          id: user.id,
          role: user.role,
          dept_id: user.dept_id,
          class_id: class_id,
          must_change_password: user.must_change_password
        },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      res.json({
        token,
        must_change_password: user.must_change_password,
        role: user.role,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          full_name: user.full_name,
          must_change_password: user.must_change_password,
          faculty_code: user.faculty_code,
          class_id: class_id
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  changePassword: async (req, res) => {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    // Validate new password: min 8 chars, one uppercase, one number
    if (new_password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    if (!/[A-Z]/.test(new_password)) {
      return res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
    }
    if (!/[0-9]/.test(new_password)) {
      return res.status(400).json({ error: 'Password must contain at least one number' });
    }

    try {
      const hashObj = await userModel.getUserPasswordHash(req.user.id);
      if (!hashObj) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isValid = await comparePassword(current_password, hashObj.password_hash);
      if (!isValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      const newHash = await hashPassword(new_password);
      await userModel.changePassword(req.user.id, newHash);

      res.json({ message: 'Password changed successfully' });
    } catch (err) {
      console.error('Change password error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  me: async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT u.id, u.username, u.role, u.full_name, u.email, u.phone, u.dept_id, u.must_change_password, fc.unique_code as faculty_code
         FROM users u
         LEFT JOIN faculty_codes fc ON u.id = fc.user_id
         WHERE u.id = $1 AND u.is_active = TRUE`,
        [req.user.id]
      );
      if (!rows[0]) return res.status(404).json({ error: 'User not found' });
      res.json(rows[0]);
    } catch (err) {
      console.error('Me endpoint error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  logout: async (req, res) => {
    res.json({ message: 'Logged out successfully' });
  }
};

module.exports = AuthController;
