const pool = require('../db/connection');

const createUser = async ({ username, full_name, role, dept_id, email, phone, password_hash, institution_id, is_approved = true }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO users
         (username, password_hash, role, full_name, email, phone, dept_id, institution_id, must_change_password, is_active, is_approved)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, TRUE, $9)
       RETURNING id, username, role, full_name, email, phone, dept_id, institution_id, must_change_password, is_active, is_approved, created_at`,
      [username, password_hash, role, full_name, email || null, phone || null, dept_id, institution_id, is_approved]
    );
    const newUser = rows[0];

    let faculty_code = null;
    if (['faculty', 'advisor', 'hod'].includes(role) && dept_id) {
      const deptRes = await client.query('SELECT code FROM departments WHERE id = $1', [dept_id]);
      if (deptRes.rows.length > 0) {
        const deptCode = deptRes.rows[0].code.toUpperCase();
        
        const seqRes = await client.query(
          `SELECT unique_code FROM faculty_codes 
           WHERE unique_code LIKE $1 
           ORDER BY LENGTH(unique_code) DESC, unique_code DESC LIMIT 1`,
          [`${deptCode}%`]
        );
        
        let nextSeq = 101;
        if (seqRes.rows.length > 0) {
          const lastCode = seqRes.rows[0].unique_code;
          const match = lastCode.match(/\d+$/);
          if (match) {
            nextSeq = parseInt(match[0], 10) + 1;
          }
        }
        
        faculty_code = `${deptCode}${nextSeq}`;
        await client.query(
          `INSERT INTO faculty_codes (user_id, unique_code) VALUES ($1, $2)`,
          [newUser.id, faculty_code]
        );
      }
    }

    await client.query('COMMIT');
    return { ...newUser, faculty_code };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getAllUsers = async (deptId = null, roleFilter = null, institution_id = null) => {
  let query = `
    SELECT u.id, u.username, u.full_name, u.role, u.dept_id, u.institution_id, u.email, u.phone, u.is_active, u.is_approved, u.created_at, fc.unique_code as faculty_code, fc.designation, sp.class_id, c.name as class_name, c.is_active as class_is_active
    FROM users u
    LEFT JOIN faculty_codes fc ON u.id = fc.user_id
    LEFT JOIN student_profiles sp ON u.id = sp.user_id
    LEFT JOIN classes c ON sp.class_id = c.id
    WHERE 1=1
  `;
  const params = [];
  
  if (institution_id) {
    params.push(institution_id);
    query += ` AND u.institution_id = $${params.length}`;
  }
  
  if (deptId) {
    params.push(deptId);
    query += ` AND u.dept_id = $${params.length}`;
  }
  if (roleFilter && roleFilter.length > 0) {
    params.push(roleFilter);
    query += ` AND u.role = ANY($${params.length})`;
  }
  query += ' ORDER BY u.full_name ASC';
  const { rows } = await pool.query(query, params);
  return rows;
};

const getUserById = async (id) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.username, u.role, u.full_name, u.email, u.phone, u.dept_id, u.must_change_password, u.is_active, fc.unique_code as faculty_code, fc.designation
     FROM users u
     LEFT JOIN faculty_codes fc ON u.id = fc.user_id
     WHERE u.id = $1`,
    [id]
  );
  return rows[0];
};

const getUserByUsernameOrEmail = async (identifier) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.username, u.password_hash, u.role, u.dept_id, u.is_active, u.is_approved, u.must_change_password, u.full_name, u.institution_id, fc.unique_code as faculty_code, fc.designation
     FROM users u
     LEFT JOIN faculty_codes fc ON u.id = fc.user_id
     WHERE u.username = $1 OR u.email = $1`,
    [identifier]
  );
  return rows[0];
};

const getUserPasswordHash = async (id) => {
  const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [id]);
  return rows[0];
};

const resetUserPassword = async (id, password_hash) => {
  const { rows } = await pool.query(
    `UPDATE users SET password_hash = $1, must_change_password = TRUE, updated_at = NOW()
     WHERE id = $2
     RETURNING id, username, role`,
    [password_hash, id]
  );
  return rows[0];
};

const changePassword = async (id, password_hash) => {
  await pool.query(
    'UPDATE users SET password_hash = $1, must_change_password = FALSE, updated_at = NOW() WHERE id = $2',
    [password_hash, id]
  );
};

const deactivateUser = async (id) => {
  const { rows } = await pool.query(
    `UPDATE users SET is_active = FALSE, updated_at = NOW()
     WHERE id = $1 RETURNING id`,
    [id]
  );
  return rows[0];
};

const reactivateUser = async (id) => {
  const { rows } = await pool.query(
    `UPDATE users SET is_active = TRUE, is_approved = TRUE, updated_at = NOW()
     WHERE id = $1 RETURNING id`,
    [id]
  );
  return rows[0];
};

const reactivateUserPending = async (id) => {
  const { rows } = await pool.query(
    `UPDATE users SET is_active = TRUE, is_approved = FALSE, updated_at = NOW()
     WHERE id = $1 RETURNING id`,
    [id]
  );
  return rows[0];
};

const updateUserRole = async (id, role) => {
  const { rows } = await pool.query(
    `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username, role, dept_id`,
    [role, id]
  );
  return rows[0];
};

const updateMyProfile = async (id, { email, phone }) => {
  const { rows } = await pool.query(
    'UPDATE users SET email = $1, phone = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
    [email || null, phone || null, id]
  );
  return rows[0];
};

const updateDesignation = async (id, designation) => {
  const { rows } = await pool.query(
    `INSERT INTO faculty_codes (user_id, unique_code, designation)
     VALUES ($2, 'LEGACY-' || substr($2::text, 1, 6), $1)
     ON CONFLICT (user_id) DO UPDATE SET designation = EXCLUDED.designation
     RETURNING *`,
    [designation || 'Faculty', id]
  );
  return rows[0];
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  getUserByUsernameOrEmail,
  getUserPasswordHash,
  resetUserPassword,
  changePassword,
  deactivateUser,
  reactivateUser,
  reactivateUserPending,
  updateUserRole,
  updateMyProfile,
  updateDesignation
};
