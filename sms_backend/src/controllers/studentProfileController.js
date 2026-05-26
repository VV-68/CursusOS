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
    
    // Notify advisor
    try {
      const { notifyAdvisor } = require('../services/notificationService');
      const profile = await profileModel.getFullProfile(req.user.id);
      if (profile && profile.class_id) {
        const { rows: userRows } = await pool.query('SELECT full_name FROM users WHERE id = $1', [req.user.id]);
        const studentName = userRows[0]?.full_name || 'A student';
        await notifyAdvisor(
          req.user.id, 
          profile.class_id, 
          `${studentName} updated their profile.`
        );
      }
    } catch (notifErr) {
      console.error('[profile] notification failed (non-fatal)', notifErr.message);
    }
    
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
// GET /api/profile/my-courses
exports.getMyCourses = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.name, c.code, c.credits,
              u1.full_name AS faculty1_name, u1.email AS faculty1_email, u1.phone AS faculty1_phone, fc1.designation AS faculty1_designation,
              u2.full_name AS faculty2_name, u2.email AS faculty2_email, u2.phone AS faculty2_phone, fc2.designation AS faculty2_designation,
              ca.id AS course_assignment_id,
              dc.period_number,
              d.active_term,
              d.department_type
       FROM course_assignments ca
       JOIN courses c   ON c.id  = ca.course_id
       LEFT JOIN department_courses dc ON dc.course_code = c.code AND dc.dept_id = c.dept_id
       JOIN departments d ON d.id = c.dept_id
       LEFT JOIN users u1     ON u1.id  = ca.faculty1_id
       LEFT JOIN faculty_codes fc1 ON fc1.user_id = u1.id
       LEFT JOIN users u2     ON u2.id  = ca.faculty2_id
       LEFT JOIN faculty_codes fc2 ON fc2.user_id = u2.id
       JOIN student_profiles sp ON sp.class_id = ca.class_id AND sp.user_id = $1
       JOIN semesters s ON s.id  = ca.semester_id AND s.is_active = TRUE
       WHERE d.department_type != 'semester_wise' 
         OR d.active_term = 'all' 
         OR (d.active_term = 'even' AND dc.period_number % 2 = 0)
         OR (d.active_term = 'odd' AND dc.period_number % 2 != 0)
       ORDER BY c.code`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
