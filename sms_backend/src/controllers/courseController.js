const courseModel = require('../models/courseModel');
const userModel = require('../models/userModel');
const classModel = require('../models/classModel');
const { logAudit } = require('./userController');
const { getFacultyAssignments } = require('../utils/authorizationHelpers');
const pool = require('../db/connection');

const getCourses = async (req, res) => {
  try {
    const { role, dept_id, id } = req.user;
    if (role === 'faculty') {
      const assignments = await courseModel.getCourseAssignments(null, id);
      const courses = [];
      // naive implementation: fetch each assigned course details (for production do a join instead)
      for (const a of assignments) {
        const c = await courseModel.getCourseById(a.course_id);
        if (c) courses.push(c);
      }
      return res.json(courses);
    }
    
    // admin sees all or HOD sees their own dept
    const targetDeptId = role === 'hod' ? dept_id : null;
    const courses = await courseModel.getAllCourses(targetDeptId);
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createCourse = async (req, res) => {
  try {
    const newCourse = await courseModel.createCourse({
      ...req.body,
      dept_id: req.user.dept_id // HOD creates course in their dept
    });
    res.status(201).json(newCourse);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Course code already exists' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

  const createCourseAssignment = async (req, res) => {
  try {
    const { faculty1_id, faculty2_id, course_id, class_id, semester_id } = req.body;
    
    // Validation: faculty.dept_id = course.dept_id = class.dept_id
    const users = await userModel.getAllUsers();
    let faculty1 = null;
    let faculty2 = null;
    
    if (faculty1_id) {
      faculty1 = users.find(u => u.id === faculty1_id);
      if (!faculty1) return res.status(404).json({ error: 'Faculty 1 not found' });
      if (faculty1.dept_id !== req.user.dept_id) return res.status(400).json({ error: 'Faculty 1 mismatch department' });
    }
    
    if (faculty2_id) {
      faculty2 = users.find(u => u.id === faculty2_id);
      if (!faculty2) return res.status(404).json({ error: 'Faculty 2 not found' });
      if (faculty2.dept_id !== req.user.dept_id) return res.status(400).json({ error: 'Faculty 2 mismatch department' });
    }

    const course = await courseModel.getCourseById(course_id);
    const classObj = (await classModel.getAllClasses()).find(c => c.id === class_id);

    if (!course || !classObj) {
      return res.status(404).json({ error: 'Course or class not found' });
    }

    if (course.dept_id !== req.user.dept_id || classObj.dept_id !== req.user.dept_id) {
      return res.status(400).json({ error: 'Mismatch in department IDs' });
    }

    const newAssignment = await courseModel.createCourseAssignment({
      faculty1_id, faculty2_id, course_id, class_id, semester_id
    });
    
    await logAudit(req.user.id, 'COURSE_ASSIGNED', 'course_assignments', newAssignment.id, null, newAssignment);
    res.status(201).json(newAssignment);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Assignment already exists' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCourseAssignments = async (req, res) => {
  try {
    const { class_id, faculty_id } = req.query;
    const assignments = await courseModel.getCourseAssignments(class_id, faculty_id);
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteCourseAssignment = async (req, res) => {
  try {
    await courseModel.deleteCourseAssignment(req.params.id);
    res.json({ message: 'Course assignment deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getMine = async (req, res) => {
  try {
    const { semester_id } = req.query;

    // If no semester_id given, use active semester
    let semId = semester_id;
    if (!semId) {
      const { rows } = await pool.query(
        'SELECT id FROM semesters WHERE is_active = TRUE LIMIT 1'
      );
      if (!rows.length) return res.status(400).json({ error: 'No active semester' });
      semId = rows[0].id;
    }

    const { rows } = await pool.query(
      `SELECT ca.id AS course_assignment_id,
              c.name AS course_name, c.code AS course_code,
              cl.name AS class_name, cl.year, cl.section,
              d.name AS dept_name,
              s.name AS semester_name
       FROM course_assignments ca
       JOIN courses     c  ON c.id  = ca.course_id
       JOIN classes     cl ON cl.id = ca.class_id
       JOIN departments d  ON d.id  = cl.dept_id
       JOIN semesters   s  ON s.id  = ca.semester_id
       WHERE (ca.faculty1_id = $1 OR ca.faculty2_id = $1) AND ca.semester_id = $2
       ORDER BY d.code, cl.name, c.code`,
      [req.user.id, semId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getCourses,
  createCourse,
  createCourseAssignment,
  getCourseAssignments,
  deleteCourseAssignment,
  getMine
};
