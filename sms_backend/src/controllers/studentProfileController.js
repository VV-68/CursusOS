const profileModel = require('../models/studentProfileModel');
const { isAdvisorOfStudent } = require('../utils/authorizationHelpers');
const pool = require('../db/connection');

// GET /api/profile/me — student views/edits their own profile
exports.getMyProfile = async (req, res) => {
  try {
    const profile = await profileModel.getFullProfile(req.user.id);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PATCH /api/profile/me — student updates their own profile
exports.updateMyProfile = async (req, res) => {
  try {
    const updated = await profileModel.updateProfile(req.user.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Profile not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/profile/student/:student_id — advisor/hod/admin views a student's profile
exports.getStudentProfile = async (req, res) => {
  try {
    const { student_id } = req.params;

    if (req.user.role === 'advisor') {
      // Advisor can only view students in their own class
      const authorized = await isAdvisorOfStudent(req.user.id, student_id);
      if (!authorized) return res.status(403).json({ error: 'This student is not in your class' });
      const profile = await profileModel.getSafeProfile(student_id);
      return res.json(profile); // no bank fields
    }

    if (req.user.role === 'hod') {
      // HOD can view students in their department only
      const { rows } = await pool.query(
        `SELECT 1 FROM student_profiles sp
         JOIN classes c ON c.id = sp.class_id
         WHERE sp.user_id = $1 AND c.dept_id = $2`,
        [student_id, req.user.dept_id]
      );
      if (!rows.length) return res.status(403).json({ error: 'Student is not in your department' });
      const profile = await profileModel.getSafeProfile(student_id);
      return res.json(profile); // no bank fields
    }

    if (req.user.role === 'admin') {
      const profile = await profileModel.getFullProfile(student_id);
      return res.json(profile); // full profile including bank
    }

    // Faculty (non-advisor, non-hod) cannot view student profiles
    return res.status(403).json({ error: 'Not authorized to view student profiles' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/profile/class/:class_id — advisor views all students in their class
exports.getClassStudents = async (req, res) => {
  try {
    const { class_id } = req.params;

    if (req.user.role === 'advisor') {
      // Verify this advisor owns this class
      const { rows } = await pool.query(
        `SELECT 1 FROM classes
         WHERE id = $1 AND (advisor1_id = $2 OR advisor2_id = $2)`,
        [class_id, req.user.id]
      );
      if (!rows.length) return res.status(403).json({ error: 'This is not your class' });
    } else if (req.user.role === 'hod') {
      // HOD can view any class in their dept
      const { rows } = await pool.query(
        `SELECT 1 FROM classes WHERE id = $1 AND dept_id = $2`,
        [class_id, req.user.dept_id]
      );
      if (!rows.length) return res.status(403).json({ error: 'Class is not in your department' });
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const students = await profileModel.getStudentsByClass(class_id);
    res.json(students); // safe fields — no bank details for list view
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
