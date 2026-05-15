const pool = require('../db/connection');

const getAllSemesters = async () => {
  const { rows } = await pool.query(
    `SELECT id, name, academic_year, start_date, end_date, is_active, created_at
     FROM semesters
     ORDER BY is_active DESC, start_date DESC NULLS LAST, name ASC`
  );
  return rows;
};

module.exports = { getAllSemesters };
