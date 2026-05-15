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
      `INSERT INTO departments (name, code, department_type, structure_count, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, code, department_type, structure_count, description || '']
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
    `SELECT d.*, u.full_name AS hod_name
     FROM departments d
     LEFT JOIN users u ON u.id = d.hod_id
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
  const { period_number, class_id, semester_id } = filters;

  const { rows: deptRows } = await pool.query(
    `SELECT id, name, code, department_type, structure_count FROM departments WHERE id = $1`,
    [deptId]
  );
  if (!deptRows.length) return null;
  const department = deptRows[0];

  let courseQuery = `
    SELECT dc.id, dc.period_number, dc.course_name, dc.course_code, dc.credits, dc.is_elective
    FROM department_courses dc
    WHERE dc.dept_id = $1
  `;
  const params = [deptId];
  if (period_number) {
    params.push(parseInt(period_number, 10));
    courseQuery += ` AND dc.period_number = $${params.length}`;
  }
  courseQuery += ' ORDER BY dc.period_number ASC, dc.course_code ASC';
  const { rows: courses } = await pool.query(courseQuery, params);

  const assignmentByCode = {};
  if (class_id && semester_id && courses.length) {
    const codes = courses.map(c => c.course_code);
    const { rows: assignments } = await pool.query(
      `SELECT ca.id AS assignment_id, ca.faculty_id, c.code AS course_code,
              u.full_name AS faculty_name
       FROM course_assignments ca
       JOIN courses c ON c.id = ca.course_id
       JOIN users u ON u.id = ca.faculty_id
       WHERE ca.class_id = $1 AND ca.semester_id = $2 AND c.dept_id = $3
         AND c.code = ANY($4::text[])`,
      [class_id, semester_id, deptId, codes]
    );
    assignments.forEach(a => { assignmentByCode[a.course_code] = a; });
  }

  const periods = [];
  for (let i = 1; i <= (department.structure_count || 0); i++) {
    periods.push({ period_number: i, label: `${department.department_type === 'year_wise' ? 'Year' : 'Semester'} ${i}` });
  }

  return {
    department,
    period_label: department.department_type === 'year_wise' ? 'Year' : 'Semester',
    periods,
    courses: courses.map(c => ({
      ...c,
      assignment: assignmentByCode[c.course_code] || null
    }))
  };
};

/**
 * Assign faculty to a department course (syncs catalog + semester link + assignment).
 */
const assignFacultyToDeptCourse = async (deptId, data, userId) => {
  const { department_course_id, faculty_id, class_id, semester_id } = data;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: dcRows } = await client.query(
      'SELECT * FROM department_courses WHERE id = $1 AND dept_id = $2',
      [department_course_id, deptId]
    );
    if (!dcRows.length) throw new Error('NOT_FOUND');
    const dc = dcRows[0];

    const { rows: courseRows } = await client.query(
      `INSERT INTO courses (name, code, credits, dept_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (code) DO UPDATE SET
         name = EXCLUDED.name, credits = EXCLUDED.credits, dept_id = EXCLUDED.dept_id
       RETURNING *`,
      [dc.course_name, dc.course_code, dc.credits, deptId]
    );
    const course = courseRows[0];

    await client.query(
      `INSERT INTO department_semester_courses (dept_id, semester_id, course_id, added_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (dept_id, semester_id, course_id) DO UPDATE SET is_active = TRUE`,
      [deptId, semester_id, course.id, userId]
    );

    const { rows: existing } = await client.query(
      `SELECT id FROM course_assignments
       WHERE course_id = $1 AND class_id = $2 AND semester_id = $3`,
      [course.id, class_id, semester_id]
    );

    let assignment;
    if (existing.length) {
      const { rows } = await client.query(
        `UPDATE course_assignments SET faculty_id = $1 WHERE id = $2 RETURNING *`,
        [faculty_id, existing[0].id]
      );
      assignment = rows[0];
    } else {
      const { rows } = await client.query(
        `INSERT INTO course_assignments (faculty_id, course_id, class_id, semester_id)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [faculty_id, course.id, class_id, semester_id]
      );
      assignment = rows[0];
    }

    await client.query('COMMIT');
    return { course, assignment, department_course: dc };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

/**
 * Resolve period_number for a class based on department structure type.
 */
const resolveClassPeriod = (departmentType, classYear) => {
  const year = parseInt(classYear, 10) || 1;
  return Math.max(1, year);
};

/**
 * Delete a department and all its courses (cascade)
 */
const deleteDepartment = async (deptId) => {
  const { rows } = await pool.query(
    `DELETE FROM departments WHERE id = $1 RETURNING *`,
    [deptId]
  );
  return rows[0];
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
  resolveClassPeriod
};
