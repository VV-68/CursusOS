const pool = require('../db/connection');
const notificationModel = require('../models/notificationModel');

// Helper to notify a single user
const notifyUser = async (creator_id, receiver_id, message) => {
  if (!receiver_id) return;
  await notificationModel.createNotification(creator_id, receiver_id, message);
};

// Notify all students in a class
const notifyClassStudents = async (creator_id, class_id, message) => {
  const { rows } = await pool.query(
    `SELECT user_id FROM student_profiles WHERE class_id = $1`,
    [class_id]
  );
  for (const row of rows) {
    await notifyUser(creator_id, row.user_id, message);
  }
};

// Notify all faculties in a department (or all faculties if no dept)
const notifyFaculties = async (creator_id, dept_id, message, institution_id = null) => {
  let query = `SELECT id FROM users WHERE role = 'faculty'`;
  let params = [];
  
  if (dept_id) {
    query = `SELECT u.id FROM users u JOIN faculty_codes fc ON u.id = fc.user_id WHERE u.role = 'faculty' AND fc.dept_id = $1`;
    params.push(dept_id);
  } else if (institution_id) {
    params.push(institution_id);
    query += ` AND institution_id = $${params.length}`;
  }
  
  const { rows } = await pool.query(query, params);
  for (const row of rows) {
    await notifyUser(creator_id, row.id, message);
  }
};

// Notify HODs (either all or specific dept)
const notifyHODs = async (creator_id, dept_id, message, institution_id = null) => {
  let query = `SELECT id FROM users WHERE role = 'hod'`;
  let params = [];
  
  if (dept_id) {
    query = `SELECT u.id FROM users u JOIN departments d ON u.id = d.hod_id WHERE d.id = $1`;
    params.push(dept_id);
  } else if (institution_id) {
    params.push(institution_id);
    query += ` AND institution_id = $${params.length}`;
  }
  
  const { rows } = await pool.query(query, params);
  for (const row of rows) {
    await notifyUser(creator_id, row.id, message);
  }
};

// Notify class advisor(s)
const notifyAdvisor = async (creator_id, class_id, message) => {
  const { rows } = await pool.query(
    `SELECT advisor1_id, advisor2_id FROM classes WHERE id = $1`,
    [class_id]
  );
  if (rows.length > 0) {
    if (rows[0].advisor1_id) await notifyUser(creator_id, rows[0].advisor1_id, message);
    if (rows[0].advisor2_id) await notifyUser(creator_id, rows[0].advisor2_id, message);
  }
};

// Notify faculties who teach a specific course in a specific class
const notifyCourseFaculties = async (creator_id, course_assignment_id, message) => {
  const { rows } = await pool.query(
    `SELECT faculty1_id, faculty2_id FROM course_assignments WHERE id = $1`,
    [course_assignment_id]
  );
  if (rows.length > 0) {
    if (rows[0].faculty1_id) await notifyUser(creator_id, rows[0].faculty1_id, message);
    if (rows[0].faculty2_id) await notifyUser(creator_id, rows[0].faculty2_id, message);
  }
};

// Notify all students in the institution
const notifyAllStudents = async (creator_id, message, institution_id = null) => {
  let inst_id = institution_id;
  if (!inst_id) {
    const { rows } = await pool.query(`SELECT institution_id FROM users WHERE id = $1`, [creator_id]);
    inst_id = rows[0]?.institution_id;
  }
  if (!inst_id) return;
  const { rows: users } = await pool.query(`SELECT id FROM users WHERE role = 'student' AND institution_id = $1`, [inst_id]);
  for (const row of users) {
    await notifyUser(creator_id, row.id, message);
  }
};

// Notify HOD, Faculties, and Advisors for notice
const notifyFacultiesAndHODs = async (creator_id, message, institution_id = null) => {
  let inst_id = institution_id;
  if (!inst_id) {
    const { rows } = await pool.query(`SELECT institution_id FROM users WHERE id = $1`, [creator_id]);
    inst_id = rows[0]?.institution_id;
  }
  if (!inst_id) return;
  const { rows: users } = await pool.query(`SELECT id FROM users WHERE role IN ('faculty', 'hod', 'advisor') AND institution_id = $1`, [inst_id]);
  for (const row of users) {
    await notifyUser(creator_id, row.id, message);
  }
};

module.exports = {
  notifyUser,
  notifyClassStudents,
  notifyFaculties,
  notifyHODs,
  notifyAdvisor,
  notifyCourseFaculties,
  notifyAllStudents,
  notifyFacultiesAndHODs
};
