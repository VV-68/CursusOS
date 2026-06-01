const pool = require('../db/connection');

const getAllDepartments = async (institution_id) => {
  let query = `
    SELECT
      d.id,
      d.name,
      d.code,
      d.created_at,
      d.active_term,
      u.full_name AS hod_name,
      u.id        AS hod_id,
      d.pending_hod_id,
      d.institution_id,
      (SELECT COUNT(*) FROM student_profiles sp JOIN classes c ON sp.class_id = c.id WHERE c.dept_id = d.id) AS student_count
    FROM departments d
    LEFT JOIN users u ON u.id = d.hod_id
  `;
  const params = [];
  if (institution_id) {
    query += ' WHERE d.institution_id = $1';
    params.push(institution_id);
  }
  query += ' ORDER BY d.name ASC';
  const { rows } = await pool.query(query, params);
  return rows;
};

const getDepartmentById = async (id) => {
  const { rows } = await pool.query(
    `SELECT d.id, d.name, d.code, d.hod_id, d.pending_hod_id, d.created_at, d.institution_id, u.full_name AS hod_name,
            pu.full_name AS pending_hod_name
     FROM departments d
     LEFT JOIN users u ON u.id = d.hod_id
     LEFT JOIN users pu ON pu.id = d.pending_hod_id
     WHERE d.id = $1`,
    [id]
  );
  return rows[0];
};

const createDepartment = async ({ name, code, institution_id }) => {
  const { rows } = await pool.query(
    `INSERT INTO departments (name, code, institution_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, code, institution_id]
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

    // Update department record and clear pending
    await client.query('UPDATE departments SET hod_id = $1, pending_hod_id = NULL WHERE id = $2', [newHodId, departmentId]);

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

const requestHODChange = async (departmentId, newHodId) => {
  const { rows } = await pool.query(
    'UPDATE departments SET pending_hod_id = $1 WHERE id = $2 RETURNING *',
    [newHodId, departmentId]
  );
  return rows[0];
};

const getPendingHOD = async (departmentId) => {
  const { rows } = await pool.query('SELECT pending_hod_id FROM departments WHERE id = $1', [departmentId]);
  return rows[0]?.pending_hod_id;
};



module.exports = {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  assignHOD,
  getClassesInDepartment,
  requestHODChange,
  getPendingHOD
};
