const pool = require('../db/connection');

const getAllClasses = async () => {
  const { rows } = await pool.query(`
    SELECT c.*, 
    u1.full_name as advisor1_name, 
    fc1.unique_code as advisor1_code,
    u2.full_name as advisor2_name,
    fc2.unique_code as advisor2_code,
    d.code as dept_code
    FROM classes c
    JOIN departments d ON c.dept_id = d.id
    LEFT JOIN users u1 ON c.advisor1_id = u1.id
    LEFT JOIN faculty_codes fc1 ON u1.id = fc1.user_id
    LEFT JOIN users u2 ON c.advisor2_id = u2.id
    LEFT JOIN faculty_codes fc2 ON u2.id = fc2.user_id
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
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get old advisors before update
    const { rows: oldRows } = await client.query('SELECT advisor1_id, advisor2_id FROM classes WHERE id = $1', [classId]);
    const oldAdvisors = oldRows.length > 0 ? [oldRows[0].advisor1_id, oldRows[0].advisor2_id].filter(id => id !== null) : [];

    // Update classes
    const { rows } = await client.query(
      'UPDATE classes SET advisor1_id = $1, advisor2_id = $2 WHERE id = $3 RETURNING *',
      [advisor1_id, advisor2_id, classId]
    );

    // Switch role of the new advisors if they are 'faculty'
    if (advisor1_id) {
      await client.query("UPDATE users SET role = 'advisor' WHERE id = $1 AND role = 'faculty'", [advisor1_id]);
    }
    if (advisor2_id) {
      await client.query("UPDATE users SET role = 'advisor' WHERE id = $1 AND role = 'faculty'", [advisor2_id]);
    }

    // Check if old advisors should be demoted back to faculty
    for (const oldId of oldAdvisors) {
      if (oldId !== advisor1_id && oldId !== advisor2_id) {
        // Check if they advise ANY other class
        const { rows: countRows } = await client.query(
          'SELECT COUNT(*) FROM classes WHERE advisor1_id = $1 OR advisor2_id = $1',
          [oldId]
        );
        if (parseInt(countRows[0].count) === 0) {
          await client.query("UPDATE users SET role = 'faculty' WHERE id = $1 AND role = 'advisor'", [oldId]);
        }
      }
    }

    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
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

const updateClass = async (classId, classData) => {
  const { name, year, section, semester_id } = classData;
  const { rows } = await pool.query(
    'UPDATE classes SET name = $1, year = $2, section = $3, semester_id = $4 WHERE id = $5 RETURNING *',
    [name, year, section, semester_id, classId]
  );
  return rows[0];
};

const deleteClass = async (classId) => {
  const { rows } = await pool.query('DELETE FROM classes WHERE id = $1 RETURNING *', [classId]);
  return rows[0];
};

module.exports = {
  getAllClasses,
  createClass,
  assignAdvisors,
  getStudentsInClass,
  updateClass,
  deleteClass
};
