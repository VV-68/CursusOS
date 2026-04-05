const userModel = require('../models/userModel');
const { hashDefault } = require('../utils/passwordUtils');
const logAudit = require('../utils/auditLogger');

// Admin or HOD: list users
const getAllUsers = async (req, res) => {
  try {
    const { role: callerRole, dept_id: callerDept } = req.user;
    const { role, dept_id } = req.query;

    // HOD is always scoped to their own department
    const effectiveDept = callerRole === 'hod' ? callerDept : (dept_id || null);
    const roleFilter = role ? role.split(',') : null;

    const users = await userModel.getAllUsers(effectiveDept, roleFilter);
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Admin or HOD creates a user
const createUser = async (req, res) => {
  try {
    const { username, full_name, role, email, phone } = req.body;

    if (!username || !full_name || !role) {
      return res.status(400).json({ error: 'username, full_name, and role are required' });
    }

    // HOD can only create faculty or advisor
    if (req.user.role === 'hod' && !['faculty', 'advisor'].includes(role)) {
      return res.status(403).json({ error: 'HOD can only create faculty or advisor users' });
    }

    // Admin cannot create student via this endpoint
    if (req.user.role === 'admin' && role === 'student') {
      return res.status(403).json({ error: 'Students are created via the student management module' });
    }

    // dept_id: HOD always uses their own; admin must supply it
    let dept_id;
    if (req.user.role === 'hod') {
      dept_id = req.user.dept_id;
    } else {
      dept_id = req.body.dept_id || null;
    }

    const password_hash = await hashDefault();

    const newUser = await userModel.createUser({
      username: username.trim().toLowerCase(),
      full_name: full_name.trim(),
      role,
      dept_id,
      email: email?.trim().toLowerCase() || null,
      phone: phone?.trim() || null,
      password_hash,
    });

    await logAudit(req.user.id, 'USER_CREATED', 'user', newUser.id, null, {
      username: newUser.username, role, dept_id
    });

    res.status(201).json(newUser);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Username already taken' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Admin resets a user's password to default
const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const password_hash = await hashDefault();
    const updated = await userModel.resetUserPassword(id, password_hash);
    if (!updated) return res.status(404).json({ error: 'User not found' });

    await logAudit(req.user.id, 'PASSWORD_RESET', 'user', id, null, null);

    res.json({ message: 'Password reset to default. User must change on next login.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Admin soft-deletes a user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) return res.status(400).json({ error: 'Cannot deactivate yourself' });
    const updated = await userModel.deactivateUser(id);
    if (!updated) return res.status(404).json({ error: 'User not found' });

    await logAudit(req.user.id, 'USER_DEACTIVATED', 'user', id, null, null);

    res.json({ message: 'User deactivated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getAllUsers, createUser, resetPassword, deleteUser };
