const pool = require('../db/connection');

const create = async ({ title, description, drive_link, course_assignment_id, posted_by, material_type }) => {
  const { rows } = await pool.query(
    `INSERT INTO study_materials
       (title, description, drive_link, course_assignment_id, posted_by, material_type, is_published)
     VALUES ($1, $2, $3, $4, $5, $6, TRUE)
     RETURNING *`,
    [title, description || null, drive_link, course_assignment_id, posted_by, material_type || 'notes']
  );
  return rows[0];
};

const getByCourseAssignment = async (course_assignment_id, published_only = false) => {
  const { rows } = await pool.query(
    `SELECT m.*, u.full_name AS posted_by_name
     FROM study_materials m
     JOIN users u ON u.id = m.posted_by
     WHERE m.course_assignment_id = $1
       ${published_only ? 'AND m.is_published = TRUE' : ''}
     ORDER BY m.created_at DESC`,
    [course_assignment_id]
  );
  return rows;
};

const deleteById = async (id) => {
  const { rows } = await pool.query(
    `DELETE FROM study_materials WHERE id = $1 RETURNING *`,
    [id]
  );
  return rows[0];
};

module.exports = { create, getByCourseAssignment, deleteById };
