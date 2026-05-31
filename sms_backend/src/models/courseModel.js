const pool = require('../db/connection');

const createCourse = async (courseData) => {
  const { name, code, credits, dept_id } = courseData;
  const { rows } = await pool.query(
    'INSERT INTO courses (name, code, credits, dept_id) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, code, credits, dept_id]
  );
  return rows[0];
};

const getAllCourses = async (dept_id = null, institution_id = null) => {
  let query = 'SELECT c.* FROM courses c JOIN departments d ON c.dept_id = d.id WHERE 1=1';
  const params = [];
  if (dept_id) {
    params.push(dept_id);
    query += ` AND c.dept_id = $${params.length}`;
  }
  if (institution_id) {
    params.push(institution_id);
    query += ` AND d.institution_id = $${params.length}`;
  }
  const { rows } = await pool.query(query, params);
  return rows;
};

const getCourseById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
  return rows[0];
};

const createCourseAssignment = async (assignmentData) => {
  const { faculty1_id, faculty2_id, course_id, class_id } = assignmentData;
  const { rows } = await pool.query(
    'INSERT INTO course_assignments (faculty1_id, faculty2_id, course_id, class_id) VALUES ($1, $2, $3, $4) RETURNING *',
    [faculty1_id || null, faculty2_id || null, course_id, class_id]
  );
  return rows[0];
};

const getCourseAssignments = async (class_id = null, faculty_id = null) => {
  let query = 'SELECT * FROM course_assignments WHERE 1=1';
  let params = [];
  if (class_id) {
    params.push(class_id);
    query += ` AND class_id = $${params.length}`;
  }
  if (faculty_id) {
    params.push(faculty_id);
    query += ` AND (faculty1_id = $${params.length} OR faculty2_id = $${params.length})`;
  }
  const { rows } = await pool.query(query, params);
  return rows;
};

const deleteCourseAssignment = async (id) => {
  await pool.query('DELETE FROM course_assignments WHERE id = $1', [id]);
};

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  createCourseAssignment,
  getCourseAssignments,
  deleteCourseAssignment
};
