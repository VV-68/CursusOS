const departmentModel = require('../models/departmentModel');
const logAudit = require('../utils/auditLogger');
const multer  = require('multer');
const pool    = require('../db/connection');

const upload  = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1 * 1024 * 1024 } });
const uploadMiddleware = upload.single('file');


const getAllDepartments = async (req, res) => {
  try {
    const institution_id = req.user.institution_id;
    const deps = await departmentModel.getAllDepartments(institution_id);
    // Non-admins can only see their own department
    if (req.user.role !== 'admin') {
      const filtered = deps.filter(d => d.id === req.user.dept_id);
      return res.json(filtered);
    }
    res.json(deps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createDepartment = async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'name and code are required' });
    }

    const dept = await departmentModel.createDepartment({
      name: name.trim(),
      code: code.toUpperCase().trim().replace(/[^A-Z0-9]/g, '').slice(0, 10),
      institution_id: req.user.institution_id
    });

    await logAudit(req.user.id, 'DEPARTMENT_CREATED', 'department', dept.id, null, { name: dept.name, code: dept.code });

    res.status(201).json(dept);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Department code already exists' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const assignHOD = async (req, res) => {
  try {
    const { hod_id } = req.body;
    const { id } = req.params;
    if (!hod_id) return res.status(400).json({ error: 'hod_id is required' });

    // Validate hod_id is active
    const pool = require('../db/connection');
    const { rows: userRows } = await pool.query('SELECT is_active FROM users WHERE id = $1', [hod_id]);
    if (userRows.length === 0 || !userRows[0].is_active) {
      return res.status(400).json({ error: 'Cannot assign a deactivated user as HOD' });
    }

    const existing = await departmentModel.getDepartmentById(id);
    if (!existing) return res.status(404).json({ error: 'Department not found' });

    if (req.user.role !== 'admin' && existing.id !== req.user.dept_id) {
      return res.status(403).json({ error: 'You can only manage your own department' });
    }

    // If an HOD exists and requester is not the current HOD, request permission
    if (existing.hod_id && existing.hod_id !== req.user.id) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can request HOD changes' });
      }
      await departmentModel.requestHODChange(id, hod_id);

      // Notify current HOD about pending transfer
      try {
        const { notifyUser } = require('../services/notificationService');
        const { rows: newHodRows } = await pool.query('SELECT full_name FROM users WHERE id = $1', [hod_id]);
        const newHodName = newHodRows[0]?.full_name || 'a new faculty member';
        await notifyUser(req.user.id, existing.hod_id, `⚠️ Admin has requested to transfer HOD role to ${newHodName}. Please approve or reject.`);
      } catch (notifErr) {
        console.error('[department] HOD change notification failed (non-fatal)', notifErr.message);
      }

      return res.json({ message: 'HOD change requested. Awaiting approval from current HOD.', pending: true });
    }

    // No existing HOD, assign directly
    const oldHodId = await departmentModel.assignHOD(id, hod_id);

    await logAudit(req.user.id, 'HOD_ASSIGNED', 'department', id,
      { hod_id: oldHodId },
      { hod_id }
    );

    // Notify admins if this was a voluntary transfer by the HOD
    if (req.user.role === 'hod') {
      try {
        const { notifyUser } = require('../services/notificationService');
        const { rows: admins } = await pool.query("SELECT id FROM users WHERE role = 'admin' AND is_active = true AND institution_id = $1", [req.user.institution_id]);
        const { rows: newHodRows } = await pool.query('SELECT full_name FROM users WHERE id = $1', [hod_id]);
        const newHodName = newHodRows[0]?.full_name || 'a new faculty member';
        for (let admin of admins) {
          await notifyUser(req.user.id, admin.id, `HOD transfer occurred in department ${existing.name}. New HOD is ${newHodName}.`);
        }
      } catch (notifErr) {
        console.error('[department] HOD transfer notification to admin failed', notifErr.message);
      }
    }

    res.json({ message: 'HOD assigned successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const approveHODChange = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await departmentModel.getDepartmentById(id);
    if (!existing) return res.status(404).json({ error: 'Department not found' });

    if (existing.hod_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the current HOD can approve this change' });
    }

    const pendingHodId = await departmentModel.getPendingHOD(id);
    if (!pendingHodId) return res.status(400).json({ error: 'No pending HOD change' });

    const oldHodId = await departmentModel.assignHOD(id, pendingHodId);
    
    await logAudit(req.user.id, 'HOD_ASSIGNED', 'department', id, { hod_id: oldHodId }, { hod_id: pendingHodId });
    
    // Notify admins of approval
    try {
      const { notifyUser } = require('../services/notificationService');
      const { rows: admins } = await pool.query("SELECT id FROM users WHERE role = 'admin' AND is_active = true AND institution_id = $1", [req.user.institution_id]);
      for (let admin of admins) {
        await notifyUser(req.user.id, admin.id, `HOD of ${existing.name} has approved the HOD transfer request.`);
      }
    } catch (e) {
      console.error('Failed to notify admin of HOD approval', e);
    }
    
    res.json({ message: 'HOD change approved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const rejectHODChange = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await departmentModel.getDepartmentById(id);
    if (!existing) return res.status(404).json({ error: 'Department not found' });

    if (existing.hod_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the current HOD can reject this change' });
    }

    await departmentModel.requestHODChange(id, null);
    
    // Notify admins of rejection
    try {
      const { notifyUser } = require('../services/notificationService');
      const { rows: admins } = await pool.query("SELECT id FROM users WHERE role = 'admin' AND is_active = true AND institution_id = $1", [req.user.institution_id]);
      for (let admin of admins) {
        await notifyUser(req.user.id, admin.id, `HOD of ${existing.name} has rejected the HOD transfer request.`);
      }
    } catch (e) {
      console.error('Failed to notify admin of HOD rejection', e);
    }
    
    res.json({ message: 'HOD change rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getClassesInDepartment = async (req, res) => {
  try {
    const classes = await departmentModel.getClassesInDepartment(req.params.id);
    res.json(classes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const uploadCourses = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'JSON file required' });

    let payload;
    try {
      payload = JSON.parse(req.file.buffer.toString());
    } catch {
      return res.status(400).json({ error: 'Invalid JSON file' });
    }

    // Accept semester_number (new) or semester_id (legacy compat)
    const { semester_number, semester_id: legacySemesterId, courses } = payload;
    const effectiveSemesterNumber = semester_number || null;

    // Resolve a semester_id for DB compatibility: use legacy if provided, otherwise try to find one
    let semester_id = legacySemesterId || null;

    if (!semester_id && !effectiveSemesterNumber) {
      return res.status(400).json({ error: 'semester_number (or legacy semester_id) and courses array are required' });
    }
    if (!Array.isArray(courses) || courses.length === 0) {
      return res.status(400).json({ error: 'courses array is required and must not be empty' });
    }

    const dept_id = req.user.dept_id;
    const results = [];

    for (const course of courses) {
      if (!course.name || !course.code || !course.credits) {
        return res.status(400).json({ error: `Invalid course entry: ${JSON.stringify(course)}` });
      }

      // Upsert course into courses table
      const { rows: courseRows } = await pool.query(
        `INSERT INTO courses (name, code, credits, dept_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (code)
         DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits
         RETURNING id, name, code, credits`,
        [course.name.trim(), course.code.trim().toUpperCase(), course.credits, dept_id]
      );
      const savedCourse = courseRows[0];

      // Link course to dept+semester (semester_id kept for compatibility)
      if (semester_id) {
        await pool.query(
          `INSERT INTO department_semester_courses (dept_id, semester_id, course_id, added_by)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (dept_id, semester_id, course_id) DO UPDATE SET is_active = TRUE`,
          [dept_id, semester_id, savedCourse.id, req.user.id]
        );
      }

      results.push(savedCourse);
    }

    // Deactivate any old courses for this dept+sem not in the new upload
    if (semester_id) {
      const uploadedIds = results.map(r => r.id);
      await pool.query(
        `UPDATE department_semester_courses
         SET is_active = FALSE
         WHERE dept_id = $1 AND semester_id = $2
           AND course_id != ALL($3::uuid[])`,
        [dept_id, semester_id, uploadedIds]
      );
    }

    await logAudit(req.user.id, 'COURSES_UPLOADED', 'department', dept_id, null,
      { semester_number: effectiveSemesterNumber, semester_id, count: results.length }
    );

    res.status(200).json({ message: `${results.length} courses synced`, courses: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getDeptCourses = async (req, res) => {
  try {
    const { semester_id, semester_number } = req.query;

    // Prefer semester_number (batch-based); fall back to legacy semester_id
    if (semester_number) {
      // Resolve courses via department_courses by period_number
      const { rows } = await pool.query(
        `SELECT dc.id, dc.course_name AS name, dc.course_code AS code, dc.credits
         FROM department_courses dc
         WHERE dc.dept_id = $1 AND dc.period_number = $2
         ORDER BY dc.course_code ASC`,
        [req.params.id, semester_number]
      );
      return res.json(rows);
    }

    if (!semester_id) return res.status(400).json({ error: 'semester_number or semester_id query param required' });

    // Legacy path: use department_semester_courses
    const { rows } = await pool.query(
      `SELECT c.id, c.name, c.code, c.credits
       FROM department_semester_courses dsc
       JOIN courses c ON c.id = dsc.course_id
       WHERE dsc.dept_id = $1 AND dsc.semester_id = $2 AND dsc.is_active = TRUE
       ORDER BY c.code ASC`,
      [req.params.id, semester_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};



module.exports = { getAllDepartments, createDepartment, assignHOD, getClassesInDepartment, uploadMiddleware, uploadCourses, getDeptCourses, approveHODChange, rejectHODChange };
