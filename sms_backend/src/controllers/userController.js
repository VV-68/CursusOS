const userModel = require('../models/userModel');
const departmentModel = require('../models/departmentModel');
const { hashDefault } = require('../utils/passwordUtils');
const logAudit = require('../utils/auditLogger');
const pool = require('../db/connection');

// Admin or HOD: list users
const getAllUsers = async (req, res) => {
  try {
    const { role: callerRole, dept_id: callerDept, institution_id } = req.user;
    const { role, dept_id } = req.query;

    // HOD is always scoped to their own department
    const effectiveDept = callerRole === 'hod' ? callerDept : (dept_id || null);
    const roleFilter = role ? role.split(',') : null;

    const users = await userModel.getAllUsers(effectiveDept, roleFilter, institution_id);
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
      institution_id: req.user.institution_id,
      email: email?.trim().toLowerCase() || null,
      phone: phone?.trim() || null,
      password_hash,
    });

    await logAudit(req.user.id, 'USER_CREATED', 'user', newUser.id, null, {
      username: newUser.username, role, dept_id
    });

    let message = 'User created successfully';
    let pending = false;

    // If role is hod and dept_id is provided, link it in the departments table
    if (role === 'hod' && dept_id) {
      const existingDept = await departmentModel.getDepartmentById(dept_id);
      if (existingDept) {
        if (!existingDept.hod_id) {
          // Direct assignment if no HOD exists
          await departmentModel.assignHOD(dept_id, newUser.id);
          message = `User "${username}" created and assigned as HOD for ${existingDept.name}`;
        } else {
          // If HOD exists, request permission
          await departmentModel.requestHODChange(dept_id, newUser.id);
          message = `User "${username}" created. HOD transfer request sent for ${existingDept.name} (awaiting approval from current HOD).`;
          pending = true;
        }
      }
    }

    res.status(201).json({ ...newUser, message, pending });
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

// HOD/Admin change role between faculty and advisor
const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    console.log('[updateRole] Request received:', { targetId: id, targetRole: role });
    console.log('[updateRole] Authenticated User:', { id: req.user.id, role: req.user.role, dept_id: req.user.dept_id });

    if (!['faculty', 'advisor'].includes(role)) {
      console.log('[updateRole] Invalid role rejected:', role);
      return res.status(400).json({ error: 'Role can only be changed to faculty or advisor via this endpoint' });
    }

    console.log('[updateRole] Fetching target user...');
    const targetUser = await userModel.getUserById(id);
    if (!targetUser) {
      console.log('[updateRole] Target user not found:', id);
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('[updateRole] Target user found:', { id: targetUser.id, currentRole: targetUser.role, dept_id: targetUser.dept_id });

    // Handle HOD demotion
    if (targetUser.role === 'hod' && role === 'faculty') {
      console.log('[updateRole] Entering HOD demotion transaction...');
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        console.log('[updateRole] SQL: Updating user role to faculty...');
        await client.query("UPDATE users SET role = 'faculty', updated_at = NOW() WHERE id = $1", [id]);
        
        console.log('[updateRole] SQL: Clearing hod_id from departments...');
        const deptUpdate = await client.query("UPDATE departments SET hod_id = NULL WHERE hod_id = $1", [id]);
        console.log('[updateRole] Departments updated count:', deptUpdate.rowCount);
        
        await client.query('COMMIT');
        console.log('[updateRole] Transaction committed.');
        
        await logAudit(req.user.id, 'HOD_DEMOTED', 'user', id, { role: 'hod' }, { role: 'faculty' });
        return res.json({ message: 'HOD demoted to Faculty successfully' });
      } catch (dbErr) {
        console.error('[updateRole] Database Transaction Error:', dbErr);
        await client.query('ROLLBACK');
        throw dbErr;
      } finally {
        client.release();
      }
    }

    // HOD can only change roles for users in their own department
    if (req.user.role === 'hod' && targetUser.dept_id !== req.user.dept_id) {
      return res.status(403).json({ error: 'You can only change roles for users in your department' });
    }

    // Only allow changing if current role is faculty or advisor (or if admin is doing it)
    if (!['faculty', 'advisor'].includes(targetUser.role) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only toggle roles between faculty and advisor' });
    }

    console.log('[updateRole] Proceeding with standard role update...');
    const updatedUser = await userModel.updateUserRole(id, role);
    await logAudit(req.user.id, 'USER_ROLE_UPDATED', 'user', id, { role: targetUser.role }, { role });

    console.log('[updateRole] Success:', { id: updatedUser.id, newRole: updatedUser.role });
    res.json({ message: 'User role updated successfully', user: updatedUser });
  } catch (err) {
    console.error('[updateRole] Final Catch Error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const { email, phone } = req.body;
    const updated = await userModel.updateMyProfile(req.user.id, { email, phone });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateDesignation = async (req, res) => {
  try {
    const { id } = req.params;
    const { designation } = req.body;

    const targetUser = await userModel.getUserById(id);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    if (req.user.role === 'hod' && targetUser.dept_id !== req.user.dept_id) {
      return res.status(403).json({ error: 'User is not in your department' });
    }

    const updated = await userModel.updateDesignation(id, designation);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getAllUsers, createUser, resetPassword, deleteUser, updateRole, updateMyProfile, updateDesignation };
