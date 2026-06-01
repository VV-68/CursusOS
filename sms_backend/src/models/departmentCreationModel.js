const pool = require('../db/connection');

/**
 * Create a full department with courses in a single transaction.
 *
 * @param {Object} departmentData
 * @param {string} departmentData.name
 * @param {string} departmentData.code
 * @param {string} departmentData.department_type  – 'semester_wise' | 'year_wise'
 * @param {number} departmentData.structure_count   – number of semesters or years
 * @param {string} [departmentData.description]
 * @param {Array}  departmentData.periods           – [{period_number, courses: [{course_name, course_code, credits, is_elective}]}]
 * @returns {Object} created department + courses
 */
const createFullDepartment = async (departmentData) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { name, code, department_type, structure_count, description, periods } = departmentData;

    // 1. Insert department
    const { rows: deptRows } = await client.query(
      `INSERT INTO departments (name, code, department_type, structure_count, description, institution_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, code, department_type, structure_count, description || '', departmentData.institution_id]
    );
    const department = deptRows[0];

    // 2. Insert all courses (skip empty ones)
    const insertedCourses = [];
    if (periods && Array.isArray(periods)) {
      for (const period of periods) {
        if (period.courses && Array.isArray(period.courses)) {
          for (const course of period.courses) {
            // Skip empty courses
            if (!course.course_name || !course.course_name.trim() || !course.course_code || !course.course_code.trim()) continue;

            const { rows: courseRows } = await client.query(
              `INSERT INTO department_courses (dept_id, period_number, course_name, course_code, credits, is_elective)
               VALUES ($1, $2, $3, $4, $5, $6)
               RETURNING *`,
              [
                department.id,
                period.period_number,
                course.course_name.trim(),
                course.course_code.trim().toUpperCase(),
                course.credits || 0,
                course.is_elective || false
              ]
            );
            insertedCourses.push(courseRows[0]);
          }
        }
      }
    }

    await client.query('COMMIT');

    return {
      department,
      courses: insertedCourses,
      summary: {
        total_periods: structure_count,
        total_courses: insertedCourses.length,
        total_credits: insertedCourses.reduce((sum, c) => sum + parseFloat(c.credits || 0), 0)
      }
    };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

/**
 * Update a full department with courses in a single transaction.
 */
const updateFullDepartment = async (deptId, departmentData, role, hodDeptId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify ownership for HOD
    if (role === 'hod') {
      if (deptId !== hodDeptId) {
        throw new Error('FORBIDDEN');
      }
    }

    const { name, code, department_type, structure_count, description, periods } = departmentData;

    // 1. Update department (only admin can change core details like code, type, structure_count?
    // Wait, requirement says HOD can "Reorganize semester/year structure". Let's allow updating structure_count for HOD too, or just let them update courses.
    // Let's let them update what they pass, but maybe admin passes name and code, hod passes only courses?
    // Let's just update the department if admin, or just structure count for HOD.
    let department;
    if (role === 'admin') {
      const { rows: deptRows } = await client.query(
        `UPDATE departments
         SET name = $1, code = $2, department_type = $3, structure_count = $4, description = $5
         WHERE id = $6
         RETURNING *`,
        [name, code, department_type, structure_count, description || '', deptId]
      );
      department = deptRows[0];
    } else {
      // HOD can update structure count and description maybe? Let's keep it safe.
      const { rows: deptRows } = await client.query(
        `UPDATE departments
         SET structure_count = $1
         WHERE id = $2
         RETURNING *`,
        [structure_count, deptId]
      );
      department = deptRows[0];
    }

    if (!department) throw new Error('NOT_FOUND');

    // 2. Delete existing courses and recreate them (Simplest for full replacement, but let's be careful about cascading constraints. If courses are linked in department_semester_courses... wait, we have `courses` and `department_courses`.)
    // Wait, the migration `migrate_department_creation.js` created `department_courses`. 
    // Are there other tables linking to `department_courses`?
    // Looking at the migration, `department_courses` doesn't have child tables. So deleting and re-inserting is fine.
    await client.query('DELETE FROM department_courses WHERE dept_id = $1', [deptId]);

    const insertedCourses = [];
    if (periods && Array.isArray(periods)) {
      for (const period of periods) {
        if (period.courses && Array.isArray(period.courses)) {
          for (const course of period.courses) {
            // Skip empty courses
            if (!course.course_name || !course.course_name.trim() || !course.course_code || !course.course_code.trim()) continue;

            const { rows: courseRows } = await client.query(
              `INSERT INTO department_courses (dept_id, period_number, course_name, course_code, credits, is_elective)
               VALUES ($1, $2, $3, $4, $5, $6)
               RETURNING *`,
              [
                deptId,
                period.period_number,
                course.course_name.trim(),
                course.course_code.trim().toUpperCase(),
                course.credits || 0,
                course.is_elective || false
              ]
            );
            insertedCourses.push(courseRows[0]);
          }
        }
      }
    }

    await client.query('COMMIT');

    return {
      department,
      courses: insertedCourses,
      summary: {
        total_periods: structure_count,
        total_courses: insertedCourses.length,
        total_credits: insertedCourses.reduce((sum, c) => sum + parseFloat(c.credits || 0), 0)
      }
    };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

/**
 * Get full department details with courses grouped by period.
 */
const getFullDepartment = async (deptId) => {
  const { rows: deptRows } = await pool.query(
    `SELECT d.*, u.full_name AS hod_name, pu.full_name AS pending_hod_name
     FROM departments d
     LEFT JOIN users u ON u.id = d.hod_id
     LEFT JOIN users pu ON pu.id = d.pending_hod_id
     WHERE d.id = $1`,
    [deptId]
  );
  if (!deptRows.length) return null;

  const department = deptRows[0];

  const { rows: courses } = await pool.query(
    `SELECT * FROM department_courses
     WHERE dept_id = $1
     ORDER BY period_number ASC, course_name ASC`,
    [deptId]
  );

  // Group courses by period
  const periodMap = {};
  courses.forEach(c => {
    if (!periodMap[c.period_number]) {
      periodMap[c.period_number] = [];
    }
    periodMap[c.period_number].push(c);
  });

  return {
    ...department,
    periods: Object.entries(periodMap).map(([num, courses]) => ({
      period_number: parseInt(num),
      courses,
      total_credits: courses.reduce((s, c) => s + parseFloat(c.credits || 0), 0)
    }))
  };
};

/**
 * Save draft
 */
const saveDraft = async (userId, draftData) => {
  // Upsert: one draft per user
  const { rows } = await pool.query(
    `INSERT INTO department_drafts (created_by, draft_data)
     VALUES ($1, $2)
     ON CONFLICT (created_by)
     DO UPDATE SET draft_data = $2, updated_at = NOW()
     RETURNING *`,
    [userId, JSON.stringify(draftData)]
  );
  return rows[0];
};

/**
 * Get draft for user
 */
const getDraft = async (userId) => {
  const { rows } = await pool.query(
    `SELECT * FROM department_drafts WHERE created_by = $1 ORDER BY updated_at DESC LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
};

/**
 * Delete draft
 */
const deleteDraft = async (userId) => {
  await pool.query(`DELETE FROM department_drafts WHERE created_by = $1`, [userId]);
};

/**
 * Check if department code exists
 */
const codeExists = async (code) => {
  const { rows } = await pool.query(
    `SELECT id FROM departments WHERE code = $1`,
    [code.toUpperCase().trim()]
  );
  return rows.length > 0;
};

/**
 * List department courses for manage page with optional assignment info.
 */
const getManageCourses = async (deptId, filters = {}) => {
  const { class_id, semester_id } = filters;

  const { rows: deptRows } = await pool.query(
    `SELECT id, name, code, department_type, structure_count FROM departments WHERE id = $1`,
    [deptId]
  );
  if (!deptRows.length) return null;
  const department = deptRows[0];

  let effectiveStructureCount = parseInt(department.structure_count, 10) || 0;
  if (!effectiveStructureCount) {
    const { rows: maxRows } = await pool.query(
      `SELECT COALESCE(MAX(period_number), 0) AS max_period FROM department_courses WHERE dept_id = $1`,
      [deptId]
    );
    effectiveStructureCount = parseInt(maxRows[0]?.max_period, 10) || 8;
  }

  let classMeta = null;
  let periodNumbers = null;

  if (class_id) {
    const { rows: clsRows } = await pool.query(
      `SELECT id, name, year, section FROM classes WHERE id = $1 AND dept_id = $2`,
      [class_id, deptId]
    );
    if (!clsRows.length) throw new Error('CLASS_NOT_FOUND');
    classMeta = clsRows[0];
    periodNumbers = resolveClassPeriods(
      department.department_type,
      classMeta.year,
      effectiveStructureCount
    );
  }

  let courseQuery = `
    SELECT dc.id, dc.period_number, dc.course_name, dc.course_code, dc.credits, dc.is_elective
    FROM department_courses dc
    WHERE dc.dept_id = $1
  `;
  const params = [deptId];
  if (periodNumbers && periodNumbers.length) {
    params.push(periodNumbers);
    courseQuery += ` AND dc.period_number = ANY($${params.length}::int[])`;
  }
  courseQuery += ' ORDER BY dc.period_number ASC, dc.course_code ASC';
  const { rows: courses } = await pool.query(courseQuery, params);

  const assignmentByCode = {};
  if (class_id && courses.length) {
    const codes = courses.map(c => c.course_code);
    const { rows: assignments } = await pool.query(
      `SELECT ca.id AS assignment_id, ca.faculty1_id, ca.faculty2_id, c.code AS course_code,
              u1.full_name AS faculty1_name, u2.full_name AS faculty2_name
       FROM course_assignments ca
       JOIN courses c ON c.id = ca.course_id
       LEFT JOIN users u1 ON u1.id = ca.faculty1_id
       LEFT JOIN users u2 ON u2.id = ca.faculty2_id
       WHERE ca.class_id = $1 AND c.dept_id = $2
         AND c.code = ANY($3::text[])`,
      [class_id, deptId, codes]
    );
    assignments.forEach(a => { assignmentByCode[a.course_code] = a; });
  }

  const periods = [];
  for (let i = 1; i <= effectiveStructureCount; i++) {
    periods.push({ period_number: i, label: `${department.department_type === 'year_wise' ? 'Year' : 'Semester'} ${i}` });
  }

  return {
    department,
    period_label: department.department_type === 'year_wise' ? 'Year' : 'Semester',
    periods,
    class: classMeta,
    applicable_periods: periodNumbers || [],
    courses: courses.map(c => ({
      ...c,
      assignment: assignmentByCode[c.course_code] || null
    }))
  };
};

/**
 * Assign faculty to a department course (syncs catalog + semester link + assignment).
 */
/** Map department_courses.credits (numeric) to courses.credits (smallint, must be > 0). */
const catalogCreditsFromDeptCourse = (rawCredits) => {
  const n = Number(rawCredits);
  const rounded = Number.isFinite(n) ? Math.round(n) : 0;
  return Math.max(1, rounded);
};

const assignFacultyToDeptCourse = async (deptId, data, userId) => {
  const { department_course_id, faculty1_id, faculty2_id, class_id } = data;
  console.log('[assignFacultyToDeptCourse] start', { deptId, department_course_id, faculty1_id, faculty2_id, class_id, userId });
  const client = await pool.connect();
  try {
    console.log('[assignFacultyToDeptCourse] BEGIN');
    await client.query('BEGIN');

    console.log('[assignFacultyToDeptCourse] before SELECT department_courses', { department_course_id, deptId });
    const { rows: dcRows } = await client.query(
      'SELECT * FROM department_courses WHERE id = $1 AND dept_id = $2',
      [department_course_id, deptId]
    );
    console.log('[assignFacultyToDeptCourse] after SELECT department_courses', { rowCount: dcRows.length });
    if (!dcRows.length) throw new Error('NOT_FOUND');
    const dc = dcRows[0];

    const catalogCredits = catalogCreditsFromDeptCourse(dc.credits);
    console.log('[assignFacultyToDeptCourse] before INSERT/UPSERT courses', {
      course_code: dc.course_code,
      rawCredits: dc.credits,
      catalogCredits
    });
    const { rows: courseRows } = await client.query(
      `INSERT INTO courses (name, code, credits, dept_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (code) DO UPDATE SET
         name = EXCLUDED.name, credits = EXCLUDED.credits, dept_id = EXCLUDED.dept_id
       RETURNING *`,
      [dc.course_name, dc.course_code, catalogCredits, deptId]
    );
    const course = courseRows[0];
    console.log('[assignFacultyToDeptCourse] after INSERT/UPSERT courses', { courseId: course.id });

    console.log('[assignFacultyToDeptCourse] before SELECT course_assignments');
    const { rows: existing } = await client.query(
      `SELECT id FROM course_assignments
       WHERE course_id = $1 AND class_id = $2`,
      [course.id, class_id]
    );
    console.log('[assignFacultyToDeptCourse] after SELECT course_assignments', { existingCount: existing.length });

    let assignment;
    if (existing.length) {
      console.log('[assignFacultyToDeptCourse] before UPDATE course_assignments', { assignmentId: existing[0].id });
      const { rows } = await client.query(
        `UPDATE course_assignments SET faculty1_id = $1, faculty2_id = $2 WHERE id = $3 RETURNING *`,
        [faculty1_id || null, faculty2_id || null, existing[0].id]
      );
      assignment = rows[0];
      console.log('[assignFacultyToDeptCourse] after UPDATE course_assignments', { assignmentId: assignment.id });
    } else {
      console.log('[assignFacultyToDeptCourse] before INSERT course_assignments');
      const { rows } = await client.query(
        `INSERT INTO course_assignments (faculty1_id, faculty2_id, course_id, class_id)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [faculty1_id || null, faculty2_id || null, course.id, class_id]
      );
      assignment = rows[0];
      console.log('[assignFacultyToDeptCourse] after INSERT course_assignments', { assignmentId: assignment.id });
    }

    await client.query('COMMIT');
    console.log('[assignFacultyToDeptCourse] COMMIT ok');
    return { course, assignment, department_course: dc };
  } catch (e) {
    console.error('[assignFacultyToDeptCourse] ROLLBACK', {
      message: e.message,
      code: e.code,
      detail: e.detail,
      constraint: e.constraint,
      stack: e.stack
    });
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

const SEMESTERS_PER_YEAR = 2;

/**
 * All period numbers for a class academic year (e.g. year 1 → [1, 2]).
 */
const resolveClassPeriods = (departmentType, classYear, structureCount = 8) => {
  const year = parseInt(classYear, 10) || 1;
  const max = parseInt(structureCount, 10) || 8;
  if (departmentType === 'year_wise') {
    return year <= max ? [year] : [];
  }
  const start = (year - 1) * SEMESTERS_PER_YEAR + 1;
  const periods = [];
  for (let i = 0; i < SEMESTERS_PER_YEAR; i++) {
    const p = start + i;
    if (p <= max) periods.push(p);
  }
  return periods;
};

/** Single period (legacy); prefer resolveClassPeriods */
const resolveClassPeriod = (departmentType, classYear) => {
  const periods = resolveClassPeriods(departmentType, classYear);
  return periods[0] || 1;
};

/**
 * Delete a department and all its courses (cascade)
 */
const deleteDepartment = async (deptId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Change HOD to faculty
    await client.query(`UPDATE users SET role = 'faculty' WHERE dept_id = $1 AND role = 'hod'`, [deptId]);
    
    // Clear faculty code for all users in this department
    await client.query(`DELETE FROM faculty_codes WHERE user_id IN (SELECT id FROM users WHERE dept_id = $1)`, [deptId]);
    
    // Nullify dept_id for all users in this department
    await client.query(`UPDATE users SET dept_id = NULL WHERE dept_id = $1`, [deptId]);
    
    // Delete the department
    const { rows } = await client.query(
      `DELETE FROM departments WHERE id = $1 RETURNING *`,
      [deptId]
    );
    
    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  createFullDepartment,
  getFullDepartment,
  saveDraft,
  getDraft,
  deleteDraft,
  codeExists,
  deleteDepartment,
  updateFullDepartment,
  getManageCourses,
  assignFacultyToDeptCourse,
  resolveClassPeriod,
  resolveClassPeriods
};
