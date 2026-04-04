const pool = require('../db/connection');

const createNotice = async (title, body, posted_by, scope, target_id, is_pinned) => {
  const { rows } = await pool.query(
    `INSERT INTO notices (title, body, posted_by, scope, target_id, is_pinned)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [title, body, posted_by, scope, target_id || null, is_pinned || false]
  );
  return rows[0];
};

const getNotices = async (scope_filter, target_id = null) => {
  // Show notices that are global OR match the scope/target
  let query = `
    SELECT n.*, u.full_name as author_name
    FROM notices n
    JOIN users u ON n.posted_by = u.id
    WHERE n.scope = 'global'
  `;
  const params = [];

  if (scope_filter) {
    params.push(scope_filter);
    query += ` OR n.scope = $${params.length}`;
  }

  if (target_id) {
    params.push(target_id);
    query += ` OR n.target_id = $${params.length}`;
  }

  query += ` ORDER BY n.is_pinned DESC, n.created_at DESC`;

  const { rows } = await pool.query(query, params);
  return rows;
};

module.exports = {
  createNotice,
  getNotices
};
