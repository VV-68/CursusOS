const courseModel = require('../models/courseModel');
const userModel = require('../models/userModel');
const classModel = require('../models/classModel');
const { logAudit } = require('./userController');
const { getFacultyAssignments } = require('../utils/authorizationHelpers');

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
    const { faculty_id, course_id, class_id, semester_id } = req.body;
    
    // Validation: faculty.dept_id = course.dept_id = class.dept_id
    const faculty = (await userModel.getAllUsers()).find(u => u.id === faculty_id);
    const course = await courseModel.getCourseById(course_id);
    const classObj = (await classModel.getAllClasses()).find(c => c.id === class_id);

    if (!faculty || !course || !classObj) {
      return res.status(404).json({ error: 'Faculty, course, or class not found' });
    }

    if (faculty.dept_id !== req.user.dept_id || course.dept_id !== req.user.dept_id || classObj.dept_id !== req.user.dept_id) {
      return res.status(400).json({ error: 'Mismatch in department IDs' });
    }

    const newAssignment = await courseModel.createCourseAssignment({
      faculty_id, course_id, class_id, semester_id
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

const getMyCourseAssignments = async (req, res) => {
  try {
    const assignments = await getFacultyAssignments(req.user.id);
    res.json(assignments);
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
  getMyCourseAssignments
};
