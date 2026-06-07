
const pool = require('../db/connection');

// ── Syllabuses CRUD ─────────────────────────────────────────────────────

const getAllByDept = async (deptId) => {
  const { rows } = await pool.query(
    `SELECT s.*, u.full_name AS created_by_name
     FROM syllabuses s
     LEFT JOIN users u ON u.id = s.created_by
     WHERE s.dept_id = $1
     ORDER BY s.created_at DESC`,
    [deptId]
  );
  return rows;
};

const getById = async (id) => {
  const { rows } = await pool.query(
    `SELECT s.*, u.full_name AS created_by_name, d.name AS dept_name
     FROM syllabuses s
     LEFT JOIN users u ON u.id = s.created_by
     LEFT JOIN departments d ON d.id = s.dept_id
     WHERE s.id = $1`,
    [id]
  );
  return rows[0];
};

const create = async ({ dept_id, name, description, created_by, is_active = true }) => {
  const { rows } = await pool.query(
    `INSERT INTO syllabuses (dept_id, name, description, created_by, is_active)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [dept_id, name.trim(), description || null, created_by, is_active]
  );
  return rows[0];
};

const update = async (id, { name, description, is_active, is_rejected }) => {
  const { rows } = await pool.query(
    `UPDATE syllabuses
     SET name = COALESCE($2, name),
         description = COALESCE($3, description),
         is_active = COALESCE($4, is_active),
         is_rejected = COALESCE($5, is_rejected),
         updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, name || null, description !== undefined ? description : null, is_active !== undefined ? is_active : null, is_rejected !== undefined ? is_rejected : null]
  );
  return rows[0];
};

const remove = async (id) => {
  // Check for dependent records first
  const { rows: classRefs } = await pool.query(
    'SELECT COUNT(*) FROM classes WHERE syllabus_id = $1', [id]
  );
  if (parseInt(classRefs[0].count) > 0) {
    throw new Error('Cannot delete syllabus: it is assigned to one or more batches');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Delete associated courses
    await client.query('DELETE FROM department_courses WHERE syllabus_id = $1', [id]);
    
    // Delete any pending requests that reference this syllabus
    await client.query('DELETE FROM batch_syllabus_requests WHERE requested_syllabus_id = $1', [id]);

    const { rows } = await client.query(
      'DELETE FROM syllabuses WHERE id = $1 RETURNING *', [id]
    );
    
    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ── Batch-Syllabus Assignment Requests ──────────────────────────────────

const createAssignmentRequest = async ({ batch_id, requested_syllabus_id, requested_by, remarks }) => {
  // Check if there's already a pending request for this batch
  const { rows: existing } = await pool.query(
    `SELECT id FROM batch_syllabus_requests 
     WHERE batch_id = $1 AND status = 'pending'`,
    [batch_id]
  );
  if (existing.length > 0) {
    throw new Error('A pending syllabus assignment request already exists for this batch');
  }
  const { rows } = await pool.query(
    `INSERT INTO batch_syllabus_requests (batch_id, requested_syllabus_id, requested_by, remarks)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [batch_id, requested_syllabus_id, requested_by, remarks || null]
  );
  return rows[0];
};

const listRequests = async (filters = {}) => {
  let query = `
    SELECT bsr.*,
           c.name AS batch_name, c.section AS batch_section, c.batch_year,
           s.name AS syllabus_name, s.dept_id,
           d.name AS dept_name, d.code AS dept_code,
           u.full_name AS requested_by_name,
           ru.full_name AS reviewed_by_name,
           cs.name AS current_syllabus_name
    FROM batch_syllabus_requests bsr
    JOIN classes c ON c.id = bsr.batch_id
    JOIN syllabuses s ON s.id = bsr.requested_syllabus_id
    JOIN departments d ON d.id = s.dept_id
    LEFT JOIN users u ON u.id = bsr.requested_by
    LEFT JOIN users ru ON ru.id = bsr.reviewed_by
    LEFT JOIN syllabuses cs ON cs.id = c.syllabus_id
    WHERE 1=1
  `;
  const params = [];

  if (filters.status) {
    params.push(filters.status);
    query += ` AND bsr.status = $${params.length}`;
  }
  if (filters.dept_id) {
    params.push(filters.dept_id);
    query += ` AND s.dept_id = $${params.length}`;
  }
  if (filters.institution_id) {
    params.push(filters.institution_id);
    query += ` AND d.institution_id = $${params.length}`;
  }

  query += ' ORDER BY bsr.requested_at DESC';

  const { rows } = await pool.query(query, params);
  return rows;
};

const reviewRequest = async (requestId, { status, reviewed_by, remarks }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update the request
    const { rows } = await client.query(
      `UPDATE batch_syllabus_requests
       SET status = $2, reviewed_by = $3, reviewed_at = now(),
           remarks = COALESCE($4, remarks)
       WHERE id = $1
       RETURNING *`,
      [requestId, status, reviewed_by, remarks || null]
    );

    if (rows.length === 0) throw new Error('Request not found');
    const request = rows[0];

    // If approved, update the batch's syllabus_id
    if (status === 'approved') {
      await client.query(
        'UPDATE classes SET syllabus_id = $1 WHERE id = $2',
        [request.requested_syllabus_id, request.batch_id]
      );
    }

    await client.query('COMMIT');
    return request;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getBatchesWithSyllabus = async (deptId) => {
  const { rows } = await pool.query(
    `SELECT c.id, c.name, c.section, c.batch_year, c.year, c.is_active,
            c.syllabus_id, s.name AS syllabus_name
     FROM classes c
     LEFT JOIN syllabuses s ON s.id = c.syllabus_id
     WHERE c.dept_id = $1
     ORDER BY c.batch_year DESC, c.name ASC`,
    [deptId]
  );
  return rows;
};

const getSyllabusesByStatus = async (status = 'pending', institutionId = null) => {
  let condition = '1=1';
  if (status === 'pending') condition = 's.is_active = false AND s.is_rejected = false';
  else if (status === 'approved') condition = 's.is_active = true AND s.is_rejected = false';
  else if (status === 'rejected') condition = 's.is_rejected = true';

  let query = `SELECT s.*, d.name AS dept_name, d.code AS dept_code, u.full_name AS created_by_name
     FROM syllabuses s
     JOIN departments d ON d.id = s.dept_id
     LEFT JOIN users u ON u.id = s.created_by
     WHERE ${condition}`;
  
  const params = [];
  if (institutionId) {
    params.push(institutionId);
    query += ` AND d.institution_id = $1`;
  }
  
  query += ` ORDER BY s.created_at DESC`;

  const { rows } = await pool.query(query, params);
  return rows;
};

const getCourseGroupsByStatus = async (status = 'pending', institutionId = null) => {
  let condition = '1=1';
  if (status === 'pending') condition = 'dc.is_approved = false AND dc.is_rejected = false';
  else if (status === 'approved') condition = 'dc.is_approved = true AND dc.is_rejected = false';
  else if (status === 'rejected') condition = 'dc.is_rejected = true';

  let query = `SELECT DISTINCT s.id AS syllabus_id, s.name AS syllabus_name, 
            d.id AS dept_id, d.name AS dept_name, d.code AS dept_code
     FROM department_courses dc
     LEFT JOIN syllabuses s ON s.id = dc.syllabus_id
     JOIN departments d ON d.id = dc.dept_id
     WHERE ${condition}`;
  
  const params = [];
  if (institutionId) {
    params.push(institutionId);
    query += ` AND d.institution_id = $1`;
  }

  const { rows } = await pool.query(query, params);
  return rows;
};

module.exports = {
  getAllByDept,
  getById,
  create,
  update,
  remove,
  createAssignmentRequest,
  listRequests,
  reviewRequest,
  getBatchesWithSyllabus,
  getSyllabusesByStatus,
  getCourseGroupsByStatus
};
