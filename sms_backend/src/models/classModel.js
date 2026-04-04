const pool = require('../db/connection');

const getAllClasses = async () => {
  const { rows } = await pool.query(`
    SELECT c.*, 
    u1.full_name as advisor1_name, 
    u2.full_name as advisor2_name 
    FROM classes c
    LEFT JOIN users u1 ON c.advisor1_id = u1.id
    LEFT JOIN users u2 ON c.advisor2_id = u2.id
  `);
  return rows;
};

const createClass = async (classData) => {
  const { name, year, section, dept_id, semester_id } = classData;
  const { rows } = await pool.query(
    'INSERT INTO classes (name, year, section, dept_id, semester_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [name, year, section, dept_id, semester_id]
  );
  return rows[0];
};

const assignAdvisors = async (classId, advisor1_id, advisor2_id) => {
  const { rows } = await pool.query(
    'UPDATE classes SET advisor1_id = $1, advisor2_id = $2 WHERE id = $3 RETURNING *',
    [advisor1_id, advisor2_id, classId]
  );
  return rows[0];
};

const getStudentsInClass = async (classId) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.username, u.full_name, u.email, u.phone, p.* 
     FROM users u 
     LEFT JOIN student_profiles p ON u.id = p.user_id 
     WHERE p.class_id = $1 AND u.role = 'student'`,
    [classId]
  );
  return rows;
};

module.exports = {
  getAllClasses,
  createClass,
  assignAdvisors,
  getStudentsInClass
};
