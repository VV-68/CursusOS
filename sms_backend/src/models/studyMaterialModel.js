const pool = require('../db/connection');

const create = async ({
  title, description, course_assignment_id, posted_by, material_type,
  external_link, drive_link, file_path, file_name, file_mime_type, file_size, is_published = true,
}) => {
  const link = external_link || drive_link || null;
  const { rows } = await pool.query(
    `INSERT INTO study_materials
       (title, description, course_assignment_id, posted_by, material_type,
        drive_link, external_link, file_path, file_name, file_mime_type, file_size, is_published)
     VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      title, description || null, course_assignment_id, posted_by,
      material_type || 'notes', link, file_path || null, file_name || null,
      file_mime_type || null, file_size || null, is_published,
    ]
  );
  return rows[0];
};

const updateById = async (id, fields) => {
  const { rows } = await pool.query(
    `UPDATE study_materials
     SET title = COALESCE($1, title),
         description = COALESCE($2, description),
         material_type = COALESCE($3, material_type),
         external_link = COALESCE($4, external_link),
         drive_link = COALESCE($4, drive_link),
         file_path = COALESCE($5, file_path),
         file_name = COALESCE($6, file_name),
         file_mime_type = COALESCE($7, file_mime_type),
         file_size = COALESCE($8, file_size),
         is_published = COALESCE($9, is_published),
         updated_at = NOW()
     WHERE id = $10
     RETURNING *`,
    [
      fields.title, fields.description, fields.material_type, fields.external_link,
      fields.file_path, fields.file_name, fields.file_mime_type, fields.file_size,
      fields.is_published, id,
    ]
  );
  return rows[0];
};

const getByCourseAssignment = async (course_assignment_id, published_only = false) => {
  const { rows } = await pool.query(
    `SELECT m.*, u.full_name AS posted_by_name, u.full_name AS uploaded_by_name
     FROM study_materials m
     JOIN users u ON u.id = m.posted_by
     WHERE m.course_assignment_id = $1
       ${published_only ? 'AND m.is_published = TRUE' : ''}
     ORDER BY m.created_at DESC`,
    [course_assignment_id]
  );
  return rows;
};

const getById = async (id) => {
  const { rows } = await pool.query(
    `SELECT m.*, ca.faculty1_id, ca.faculty2_id
     FROM study_materials m
     JOIN course_assignments ca ON ca.id = m.course_assignment_id
     WHERE m.id = $1`,
    [id]
  );
  return rows[0];
};

const deleteById = async (id) => {
  const { rows } = await pool.query(`DELETE FROM study_materials WHERE id = $1 RETURNING *`, [id]);
  return rows[0];
};

module.exports = { create, updateById, getByCourseAssignment, getById, deleteById };
