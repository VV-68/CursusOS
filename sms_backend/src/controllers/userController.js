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

    const is_approved = req.user.role === 'admin';

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
      is_approved
    });

    await logAudit(req.user.id, 'USER_CREATED', 'user', newUser.id, null, {
      username: newUser.username, role, dept_id, is_approved
    });

    let message = is_approved ? 'User created successfully' : 'User created and pending admin approval';
    let pending = !is_approved;

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
    
    const targetUser = await userModel.getUserById(id);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });
    if (req.user.institution_id && targetUser.institution_id !== req.user.institution_id) {
      return res.status(403).json({ error: 'User is not in your institution' });
    }

    if (targetUser.role === 'hod' && req.user.role === 'admin') {
      await pool.query("UPDATE departments SET hod_id = NULL WHERE hod_id = $1", [id]);
      await pool.query("UPDATE users SET role = 'faculty' WHERE id = $1", [id]);
    } else if (targetUser.role === 'advisor' && req.user.role === 'admin') {
      await pool.query("UPDATE classes SET advisor1_id = NULL WHERE advisor1_id = $1", [id]);
      await pool.query("UPDATE classes SET advisor2_id = NULL WHERE advisor2_id = $1", [id]);
      await pool.query("UPDATE users SET role = 'faculty' WHERE id = $1", [id]);
    }

    const updated = await userModel.deactivateUser(id);
    if (!updated) return res.status(404).json({ error: 'User not found' });

    await logAudit(req.user.id, 'USER_DEACTIVATED', 'user', id, null, null);

    res.json({ message: 'User deactivated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const reactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = await userModel.getUserById(id);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });
    if (req.user.institution_id && targetUser.institution_id !== req.user.institution_id) {
      return res.status(403).json({ error: 'User is not in your institution' });
    }

    // "when admin or hod tries to reactivate a student and the batch is deactivayed, then popup a message, student deactivated due to course completion. cant reactivate"
    // Wait, targetUser has role but doesn't have class info. We need to check class_is_active.
    // Instead of querying student profile here, we can do it:
    if (targetUser.role === 'student') {
      const spRows = await pool.query(
        `SELECT c.is_active FROM student_profiles sp JOIN classes c ON sp.class_id = c.id WHERE sp.user_id = $1`,
        [id]
      );
      if (spRows.rows.length > 0 && spRows.rows[0].is_active === false) {
        return res.status(400).json({ error: 'student deactivated due to course completion. cant reactivate' });
      }
    }

    if (req.user.role === 'admin') {
      await userModel.reactivateUser(id);
      await logAudit(req.user.id, 'USER_REACTIVATED', 'user', id, null, null);
      return res.json({ message: 'User reactivated successfully' });
    } else if (req.user.role === 'hod') {
      if (targetUser.dept_id !== req.user.dept_id) {
        return res.status(403).json({ error: 'User not in your department' });
      }
      await userModel.reactivateUserPending(id);
      await logAudit(req.user.id, 'USER_REACTIVATION_REQUESTED', 'user', id, null, null);
      return res.json({ message: 'Reactivation request sent to admin for approval' });
    } else {
      return res.status(403).json({ error: 'Forbidden' });
    }
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
    if (req.user.institution_id && targetUser.institution_id !== req.user.institution_id) {
      return res.status(403).json({ error: 'User is not in your institution' });
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

    if (req.user.institution_id && targetUser.institution_id !== req.user.institution_id) {
      return res.status(403).json({ error: 'User is not in your institution' });
    }

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

const approveUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch the target user to check role and dept
    const targetUser = await userModel.getUserById(id);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });
    
    if (req.user.institution_id && targetUser.institution_id !== req.user.institution_id) {
      return res.status(403).json({ error: 'User is not in your institution' });
    }
    
    if (req.user.role === 'hod') {
      if (targetUser.role !== 'student') {
        return res.status(403).json({ error: 'HODs can only approve students' });
      }
      if (targetUser.dept_id !== req.user.dept_id) {
        return res.status(403).json({ error: 'Student is not in your department' });
      }
    }
    
    const { rows } = await pool.query(
      `UPDATE users SET is_approved = true, updated_at = NOW() WHERE id = $1 RETURNING id, username, role`,
      [id]
    );
    
    await logAudit(req.user.id, 'USER_APPROVED', 'user', id, null, null);
    
    try {
      const { notifyUser } = require('../services/notificationService');
      // Notify the user themselves
      // await notifyUser(id, `Your ${targetUser.role} account has been verified and approved. You can now login.`);

      // If faculty was approved by admin, notify the HOD
      if (targetUser.role === 'faculty') {
        const hodQuery = await pool.query('SELECT id FROM users WHERE dept_id = $1 AND role = $2 AND is_active = true LIMIT 1', [targetUser.dept_id, 'hod']);
        if (hodQuery.rows.length > 0) {
          await notifyUser(req.user.id, hodQuery.rows[0].id, `The admin has verified and approved the account for new faculty: ${targetUser.full_name}.`);
        }
      }

      // If student was approved by HOD, notify the Advisor
      if (targetUser.role === 'student') {
        const advisorQuery = await pool.query(`
          SELECT c.advisor1_id, c.advisor2_id, sp.class_id FROM classes c 
          JOIN student_profiles sp ON c.id = sp.class_id 
          WHERE sp.user_id = $1
        `, [targetUser.id]);
        
        if (advisorQuery.rows.length > 0) {
          const { advisor1_id, advisor2_id, class_id } = advisorQuery.rows[0];
          if (advisor1_id) {
            await notifyUser(req.user.id, advisor1_id, `The HOD has verified and approved the account for your student: ${targetUser.full_name}.`);
          }
          if (advisor2_id) {
            await notifyUser(req.user.id, advisor2_id, `The HOD has verified and approved the account for your student: ${targetUser.full_name}.`);
          }
          
          // Add to academic history upon approval
          try {
            const studentModel = require('../models/studentModel');
            await studentModel.addToAcademicHistory(targetUser.id, class_id);
          } catch (e) {
            console.error('Failed to add student to academic history', e);
          }
        }
      }

    } catch (e) {
      console.error('Failed to send approval notification', e);
    }
    
    res.json({ message: 'User approved successfully', user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { dept_id } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const targetUser = await userModel.getUserById(id);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });
    
    if (req.user.institution_id && targetUser.institution_id !== req.user.institution_id) {
      return res.status(403).json({ error: 'User is not in your institution' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const { rows } = await client.query(
        `UPDATE users SET dept_id = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username, dept_id`,
        [dept_id || null, id]
      );
      if (rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'User not found' });
      }

      if (dept_id) {
        // Generate new faculty code
        const deptRes = await client.query('SELECT code FROM departments WHERE id = $1', [dept_id]);
        if (deptRes.rows.length > 0) {
          const deptCode = deptRes.rows[0].code.toUpperCase();
          const seqRes = await client.query(
            `SELECT unique_code FROM faculty_codes 
             WHERE unique_code LIKE $1 
             ORDER BY LENGTH(unique_code) DESC, unique_code DESC LIMIT 1`,
            [`${deptCode}%`]
          );
          
          let nextSeq = 101;
          if (seqRes.rows.length > 0) {
            const lastCode = seqRes.rows[0].unique_code;
            const match = lastCode.match(/\d+$/);
            if (match) nextSeq = parseInt(match[0], 10) + 1;
          }
          const faculty_code = `${deptCode}${nextSeq}`;
          
          // Delete old code if exists, then insert new one
          await client.query('DELETE FROM faculty_codes WHERE user_id = $1', [id]);
          await client.query('INSERT INTO faculty_codes (user_id, unique_code) VALUES ($1, $2)', [id, faculty_code]);
        }
      }

      await client.query('COMMIT');
      
      await logAudit(req.user.id, 'USER_DEPARTMENT_UPDATED', 'user', id, null, { dept_id });

      res.json({ message: 'Department assigned successfully', user: rows[0] });
    } catch (dbErr) {
      await client.query('ROLLBACK');
      throw dbErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getAllUsers, createUser, resetPassword, deleteUser, reactivateUser, updateRole, updateMyProfile, updateDesignation, approveUser, updateDepartment };
