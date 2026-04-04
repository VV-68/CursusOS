const userModel = require('../models/userModel');

const logAudit = async (actor_id, action, target_type, target_id, old_value = null, new_value = null) => {
  const pool = require('../db/connection');
  await pool.query(
    `INSERT INTO audit_logs (actor_id, action, target_type, target_id, old_value, new_value)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [actor_id, action, target_type, target_id, JSON.stringify(old_value), JSON.stringify(new_value)]
  );
};

const getAllUsers = async (req, res) => {
  try {
    const { role, dept_id } = req.user;
    let deptIdFilter = null;
    if (role === 'hod') {
      deptIdFilter = dept_id;
    }
    const users = await userModel.getAllUsers(deptIdFilter);
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createUser = async (req, res) => {
  try {
    const newUser = await userModel.createUser(req.body);
    await logAudit(req.user.id, 'USER_CREATED', 'users', newUser.id, null, { username: req.body.username });
    res.status(201).json(newUser);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') return res.status(400).json({ error: 'Username or email already exists' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const userId = req.params.id;
    await userModel.resetPassword(userId);
    await logAudit(req.user.id, 'PASSWORD_RESET', 'users', userId, null, null);
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await userModel.deleteUser(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllUsers,
  createUser,
  resetPassword,
  deleteUser,
  logAudit
};
