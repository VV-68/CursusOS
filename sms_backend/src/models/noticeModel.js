const pool = require('../db/connection');
const { audienceLabel } = require('../utils/noticeAudience');

const createNotice = async ({ title, body, posted_by, audience, dept_id, is_pinned }) => {
  console.log('[noticeModel.createNotice] before INSERT', {
    posted_by,
    audience,
    dept_id: dept_id || null
  });
  const result = await pool.query(
    `INSERT INTO notices (title, body, posted_by, scope, target_id, audience, dept_id, is_pinned)
     VALUES ($1, $2, $3, 'role', NULL, $4, $5, $6)
     RETURNING *`,
    [title, body, posted_by, audience, dept_id || null, is_pinned || false]
  );
  console.log('[noticeModel.createNotice] after INSERT', {
    rowCount: result.rowCount,
    hasRow: !!result.rows?.[0],
    id: result.rows?.[0]?.id
  });
  return result.rows[0] || null;
};

/**
 * Notices visible to the current user (role-based + legacy scopes) filtered by institution.
 */
const getNoticesForUser = async ({ userId, role, deptId, classId, institutionId }) => {
  const tags = role === 'faculty' || role === 'advisor'
    ? ['faculty']
    : role === 'hod'
      ? ['hod']
      : role === 'student'
        ? ['student']
        : [];

  const { rows } = await pool.query(
    `SELECT n.*, u.full_name AS author_name, u.role AS author_role
     FROM notices n
     JOIN users u ON n.posted_by = u.id
     WHERE
       (u.institution_id = $5 OR $5 IS NULL)
       AND (
         n.posted_by = $1
         OR n.scope = 'global'
         OR (n.scope = 'dept' AND n.target_id = $2)
         OR (n.scope = 'class' AND n.target_id = $3)
         OR (
           n.scope = 'role'
           AND n.audience && $4::text[]
           AND (n.dept_id IS NULL OR n.dept_id = $2)
         )
       )
     ORDER BY n.is_pinned DESC, n.created_at DESC`,
    [userId, deptId || null, classId || null, tags, institutionId]
  );

  return rows.map(n => ({
    ...n,
    audience_label: n.scope === 'role' ? audienceLabel(n.audience) : n.scope
  }));
};

const deleteNotice = async (noticeId, userId) => {
  console.log('[noticeModel.deleteNotice] before DELETE', { noticeId, userId });
  const result = await pool.query(
    `DELETE FROM notices WHERE id = $1 AND posted_by = $2 RETURNING *`,
    [noticeId, userId]
  );
  console.log('[noticeModel.deleteNotice] after DELETE', { rowCount: result.rowCount });
  return result.rows[0] || null;
};

module.exports = {
  createNotice,
  getNoticesForUser,
  deleteNotice
};
