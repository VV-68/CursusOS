const pool = require('../db/connection');

const getAllDepartments = async () => {
  const { rows } = await pool.query(`
    SELECT
      d.id,
      d.name,
      d.code,
      d.created_at,
      u.full_name AS hod_name,
      u.id        AS hod_id
    FROM departments d
    LEFT JOIN users u ON u.id = d.hod_id
    ORDER BY d.name ASC
  `);
  return rows;
};

const getDepartmentById = async (id) => {
  const { rows } = await pool.query(
    `SELECT d.id, d.name, d.code, d.hod_id, d.created_at, u.full_name AS hod_name
     FROM departments d
     LEFT JOIN users u ON u.id = d.hod_id
     WHERE d.id = $1`,
    [id]
  );
  return rows[0];
};

const createDepartment = async ({ name, code }) => {
  const { rows } = await pool.query(
    `INSERT INTO departments (name, code)
     VALUES ($1, $2)
     RETURNING *`,
    [name, code]
  );
  return rows[0];
};

const assignHOD = async (departmentId, newHodId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get old HOD
    const { rows } = await client.query('SELECT hod_id FROM departments WHERE id = $1', [departmentId]);
    const oldHodId = rows[0]?.hod_id;

    // Revert old HOD to faculty if there was one and it's a different user
    if (oldHodId && oldHodId !== newHodId) {
      await client.query("UPDATE users SET role = 'faculty' WHERE id = $1", [oldHodId]);
    }

    // Set new user's role to hod
    await client.query("UPDATE users SET role = 'hod', dept_id = $2 WHERE id = $1", [newHodId, departmentId]);

    // Update department record
    await client.query('UPDATE departments SET hod_id = $1 WHERE id = $2', [newHodId, departmentId]);

    await client.query('COMMIT');
    return oldHodId;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

const getClassesInDepartment = async (departmentId) => {
  const { rows } = await pool.query('SELECT * FROM classes WHERE dept_id = $1', [departmentId]);
  return rows;
};

module.exports = {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  assignHOD,
  getClassesInDepartment
};
