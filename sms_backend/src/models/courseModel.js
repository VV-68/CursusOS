const pool = require('../db/connection');

const createCourse = async (courseData) => {
  const { name, code, credits, dept_id } = courseData;
  const { rows } = await pool.query(
    'INSERT INTO courses (name, code, credits, dept_id) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, code, credits, dept_id]
  );
  return rows[0];
};

const getAllCourses = async (dept_id = null) => {
  let query = 'SELECT * FROM courses';
  const params = [];
  if (dept_id) {
    query += ' WHERE dept_id = $1';
    params.push(dept_id);
  }
  const { rows } = await pool.query(query, params);
  return rows;
};

const getCourseById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
  return rows[0];
};

const createCourseAssignment = async (assignmentData) => {
  const { faculty_id, course_id, class_id, semester_id } = assignmentData;
  const { rows } = await pool.query(
    'INSERT INTO course_assignments (faculty_id, course_id, class_id, semester_id) VALUES ($1, $2, $3, $4) RETURNING *',
    [faculty_id, course_id, class_id, semester_id]
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
    query += ` AND faculty_id = $${params.length}`;
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
