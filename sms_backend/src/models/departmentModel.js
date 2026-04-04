const pool = require('../db/connection');

const getAllDepartments = async () => {
  const { rows } = await pool.query(
    `SELECT d.*, u.full_name as hod_name 
     FROM departments d 
     LEFT JOIN users u ON d.hod_id = u.id`
  );
  return rows;
};

const createDepartment = async (departmentData) => {
  const { name, code } = departmentData;
  const { rows } = await pool.query(
    'INSERT INTO departments (name, code) VALUES ($1, $2) RETURNING *',
    [name, code]
  );
  return rows[0];
};

const assignHOD = async (departmentId, newHodId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Check if department had an old HOD
    const { rows } = await client.query('SELECT hod_id FROM departments WHERE id = $1', [departmentId]);
    const oldHodId = rows[0]?.hod_id;
    
    // Set old HOD role to faculty if there was one
    if (oldHodId) {
      await client.query("UPDATE users SET role = 'faculty' WHERE id = $1", [oldHodId]);
    }
    
    // Set new HOD role to hod
    await client.query("UPDATE users SET role = 'hod' WHERE id = $1", [newHodId]);
    
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
  createDepartment,
  assignHOD,
  getClassesInDepartment
};
