const deptCreationModel = require('../models/departmentCreationModel');
const logAudit = require('../utils/auditLogger');

/**
 * POST /api/department-creation
 * Creates a department with full course structure.
 */
const createFullDepartment = async (req, res) => {
  try {
    const { name, code, department_type, structure_count, description, periods } = req.body;

    // ── Validation ──────────────────────────────────────────────
    const errors = [];

    if (!name || !name.trim()) errors.push('Department name is required');
    if (!code || !code.trim()) errors.push('Department code is required');
    if (!department_type || !['semester_wise', 'year_wise'].includes(department_type)) {
      errors.push('Department type must be semester_wise or year_wise');
    }
    if (!structure_count || structure_count < 1 || structure_count > 20) {
      errors.push('Number of semesters/years must be between 1 and 20');
    }

    // Validate periods (optional — empty periods are allowed)
    if (periods && Array.isArray(periods)) {
      const allCourseCodes = [];

      for (const period of periods) {
        if (!period.period_number || period.period_number < 1) {
          errors.push(`Invalid period number: ${period.period_number}`);
        }
        if (period.courses && Array.isArray(period.courses)) {
          for (const course of period.courses) {
            // Skip completely empty courses
            const hasName = course.course_name && course.course_name.trim();
            const hasCode = course.course_code && course.course_code.trim();
            const hasCredits = course.credits !== undefined && course.credits !== null && course.credits !== '';
            if (!hasName && !hasCode && !hasCredits) continue;

            // If partially filled, validate
            if (!hasName) {
              errors.push(`Course name is required in period ${period.period_number}`);
            }
            if (!hasCode) {
              errors.push(`Course code is required in period ${period.period_number}`);
            }
            if (!hasCredits || isNaN(Number(course.credits)) || Number(course.credits) < 0) {
              errors.push(`Credits must be a non-negative number for ${course.course_name || 'unnamed course'} in period ${period.period_number}`);
            }

            // Check duplicate course codes within the department
            if (hasCode) {
              const normalizedCode = course.course_code.trim().toUpperCase();
              if (allCourseCodes.includes(normalizedCode)) {
                errors.push(`Duplicate course code: ${normalizedCode}`);
              }
              allCourseCodes.push(normalizedCode);
            }
          }
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    // Check if code already exists
    const exists = await deptCreationModel.codeExists(code);
    if (exists) {
      return res.status(409).json({ error: 'Department code already exists' });
    }

    // ── Create ──────────────────────────────────────────────────
    const result = await deptCreationModel.createFullDepartment({
      name: name.trim(),
      code: code.toUpperCase().trim().replace(/[^A-Z0-9]/g, '').slice(0, 10),
      department_type,
      structure_count: parseInt(structure_count),
      description: (description || '').trim(),
      periods,
      institution_id: req.user.institution_id
    });

    await logAudit(req.user.id, 'DEPARTMENT_FULL_CREATED', 'department', result.department.id, null, {
      name: result.department.name,
      code: result.department.code,
      courses_count: result.summary.total_courses
    });

    // Delete draft after successful creation
    try {
      await deptCreationModel.deleteDraft(req.user.id);
    } catch (_) { /* ignore */ }

    res.status(201).json(result);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Department code or course code already exists' });
    }
    console.error('createFullDepartment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PUT /api/department-creation/:id
 * Updates a department and its full course structure.
 */
const updateFullDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, department_type, structure_count, description, periods } = req.body;

    // ── Validation ──────────────────────────────────────────────
    const errors = [];

    if (req.user.role === 'admin') {
      if (!name || !name.trim()) errors.push('Department name is required');
      if (!code || !code.trim()) errors.push('Department code is required');
      if (!department_type || !['semester_wise', 'year_wise'].includes(department_type)) {
        errors.push('Department type must be semester_wise or year_wise');
      }
    }
    
    if (!structure_count || structure_count < 1 || structure_count > 20) {
      errors.push('Number of semesters/years must be between 1 and 20');
    }

    // Validate periods (optional — empty periods allowed)
    if (periods && Array.isArray(periods)) {
      const allCourseCodes = [];

      for (const period of periods) {
        if (!period.period_number || period.period_number < 1) {
          errors.push(`Invalid period number: ${period.period_number}`);
        }
        if (period.courses && Array.isArray(period.courses)) {
          for (const course of period.courses) {
            // Skip completely empty courses
            const hasName = course.course_name && course.course_name.trim();
            const hasCode = course.course_code && course.course_code.trim();
            const hasCredits = course.credits !== undefined && course.credits !== null && course.credits !== '';
            if (!hasName && !hasCode && !hasCredits) continue;

            // If partially filled, validate
            if (!hasName) {
              errors.push(`Course name is required in period ${period.period_number}`);
            }
            if (!hasCode) {
              errors.push(`Course code is required in period ${period.period_number}`);
            }
            if (!hasCredits || isNaN(Number(course.credits)) || Number(course.credits) < 0) {
              errors.push(`Credits must be a non-negative number for ${course.course_name || 'unnamed course'} in period ${period.period_number}`);
            }

            // Check duplicate course codes within the department
            if (hasCode) {
              const normalizedCode = course.course_code.trim().toUpperCase();
              if (allCourseCodes.includes(normalizedCode)) {
                errors.push(`Duplicate course code: ${normalizedCode}`);
              }
              allCourseCodes.push(normalizedCode);
            }
          }
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    // Check if code already exists for OTHER departments (only if admin)
    if (req.user.role === 'admin') {
      const existing = await deptCreationModel.getFullDepartment(id);
      if (existing && existing.code !== code.toUpperCase().trim()) {
        const exists = await deptCreationModel.codeExists(code);
        if (exists) {
          return res.status(409).json({ error: 'Department code already exists' });
        }
      }
    }

    // ── Update ──────────────────────────────────────────────────
    const result = await deptCreationModel.updateFullDepartment(
      id,
      {
        name: name ? name.trim() : undefined,
        code: code ? code.toUpperCase().trim().replace(/[^A-Z0-9]/g, '').slice(0, 10) : undefined,
        department_type,
        structure_count: parseInt(structure_count),
        description: description ? description.trim() : '',
        periods
      },
      req.user.role,
      req.user.dept_id
    );

    await logAudit(req.user.id, 'DEPARTMENT_FULL_UPDATED', 'department', id, null, {
      courses_count: result.summary.total_courses
    });

    if (req.user.role === 'hod') {
      try {
        const pool = require('../db/connection');
        const { notifyUser } = require('../services/notificationService');
        const { rows: admins } = await pool.query("SELECT id FROM users WHERE role = 'admin' AND is_active = true AND institution_id = $1", [req.user.institution_id]);
        const deptRes = await pool.query("SELECT name FROM departments WHERE id = $1", [id]);
        const deptName = deptRes.rows[0]?.name || 'a department';
        for (let admin of admins) {
          await notifyUser(req.user.id, admin.id, `HOD of ${deptName} has uploaded/updated courses that require your approval.`);
        }
      } catch (e) {
        console.error('Failed to notify admin of courses upload', e);
      }
    }

    res.json(result);
  } catch (err) {
    if (err.message === 'FORBIDDEN') {
      return res.status(403).json({ error: 'You do not have permission to edit this department' });
    }
    if (err.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Department not found' });
    }
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Department code or course code already exists' });
    }
    console.error('updateFullDepartment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/department-creation/:id
 * Get full department details with courses grouped by period.
 */
const getFullDepartment = async (req, res) => {
  try {
    const result = await deptCreationModel.getFullDepartment(req.params.id);
    if (!result) return res.status(404).json({ error: 'Department not found' });
    res.json(result);
  } catch (err) {
    console.error('getFullDepartment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * DELETE /api/department-creation/:id
 * Admin deletes department
 */
const deleteDepartment = async (req, res) => {
  try {
    const pool = require('../db/connection');
    const { rows } = await pool.query(
      `SELECT COUNT(*) FROM student_profiles sp JOIN classes c ON sp.class_id = c.id WHERE c.dept_id = $1`,
      [req.params.id]
    );
    if (Number(rows[0].count) > 0) {
      return res.status(403).json({ error: 'Cannot delete a department that has students.' });
    }

    const deleted = await deptCreationModel.deleteDepartment(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Department not found' });
    res.json({ message: 'Department deleted' });
  } catch (err) {
    console.error('deleteDepartment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/department-creation/draft
 * Save a draft of the department creation form.
 */
const saveDraft = async (req, res) => {
  try {
    const draft = await deptCreationModel.saveDraft(req.user.id, req.body);
    res.json({ message: 'Draft saved', draft });
  } catch (err) {
    console.error('saveDraft error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/department-creation/draft
 * Load the user's saved draft.
 */
const getDraft = async (req, res) => {
  try {
    const draft = await deptCreationModel.getDraft(req.user.id);
    res.json(draft || { draft_data: null });
  } catch (err) {
    console.error('getDraft error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * DELETE /api/department-creation/draft
 */
const deleteDraft = async (req, res) => {
  try {
    await deptCreationModel.deleteDraft(req.user.id);
    res.json({ message: 'Draft deleted' });
  } catch (err) {
    console.error('deleteDraft error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/department-creation/:id/manage-courses
 */
const getManageCourses = async (req, res) => {
  try {
    const deptId = req.params.id;
    if (req.user.role === 'hod' && req.user.dept_id !== deptId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { class_id, semester_id } = req.query;
    if (!class_id) {
      return res.status(400).json({ error: 'class_id query parameter is required' });
    }
    const result = await deptCreationModel.getManageCourses(deptId, {
      class_id,
      semester_id
    });
    if (!result) return res.status(404).json({ error: 'Department not found' });
    res.json(result);
  } catch (err) {
    if (err.message === 'CLASS_NOT_FOUND') {
      return res.status(404).json({ error: 'Class not found in your department' });
    }
    console.error('getManageCourses error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/department-creation/:id/assign-faculty
 */
const assignFaculty = async (req, res) => {
  const deptId = req.params.id;
  console.log('[assignFaculty] POST', { deptId, body: req.body, userId: req.user?.id, role: req.user?.role });
  try {
    if (req.user.role === 'hod' && req.user.dept_id !== deptId) {
      console.log('[assignFaculty] forbidden: hod dept mismatch', { hodDept: req.user.dept_id, deptId });
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { department_course_id, faculty1_id, faculty2_id, class_id } = req.body;
    if (!department_course_id || (!faculty1_id && !faculty2_id) || !class_id) {
      return res.status(400).json({ error: 'department_course_id, at least one faculty_id, and class_id are required' });
    }
    const result = await deptCreationModel.assignFacultyToDeptCourse(
      deptId,
      { department_course_id, faculty1_id, faculty2_id, class_id },
      req.user.id
    );
    console.log('[assignFaculty] success', { assignmentId: result.assignment?.id, courseId: result.course?.id });
    res.status(201).json({ message: 'Faculty assigned successfully', ...result });
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Course not found' });
    if (err.code === '23505') return res.status(400).json({ error: 'Assignment already exists' });
    if (err.code === '23503') return res.status(400).json({ error: 'Invalid faculty, class, or semester reference' });
    if (err.code === '23514') return res.status(400).json({ error: 'Course credits must be greater than zero' });
    console.error('[assignFaculty] error:', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      constraint: err.constraint,
      stack: err.stack
    });
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/department-creation/validate-code
 * Check if a department code is already taken.
 */
const validateCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'code is required' });
    const exists = await deptCreationModel.codeExists(code);
    res.json({ exists });
  } catch (err) {
    console.error('validateCode error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createFullDepartment,
  getFullDepartment,
  saveDraft,
  getDraft,
  deleteDraft,
  validateCode,
  updateFullDepartment,
  deleteDepartment,
  getManageCourses,
  assignFaculty
};
