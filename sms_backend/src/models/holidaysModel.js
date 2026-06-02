const pool = require('../db/connection');

const getHolidays = async (institution_id, dept_id, month, year) => {
  const query = `
    SELECT id, date, description, dept_id, created_by
    FROM holidays
    WHERE institution_id = $1
      AND (dept_id IS NULL OR dept_id = $2)
      AND EXTRACT(MONTH FROM date) = $3
      AND EXTRACT(YEAR FROM date) = $4
    ORDER BY date ASC
  `;
  const { rows } = await pool.query(query, [institution_id, dept_id, month, year]);
  return rows;
};

const getHolidayByDate = async (institution_id, dept_id, date) => {
  const query = `
    SELECT id, description, dept_id
    FROM holidays
    WHERE institution_id = $1
      AND (dept_id IS NULL OR dept_id = $2)
      AND date = $3
  `;
  const { rows } = await pool.query(query, [institution_id, dept_id, date]);
  return rows[0]; // Returns undefined if not a holiday
};

const createHoliday = async (institution_id, dept_id, date, description, created_by) => {
  const query = `
    INSERT INTO holidays (institution_id, dept_id, date, description, created_by)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const { rows } = await pool.query(query, [institution_id, dept_id, date, description, created_by]);
  return rows[0];
};

const deleteHoliday = async (id, institution_id) => {
  const query = `
    DELETE FROM holidays
    WHERE id = $1 AND institution_id = $2
    RETURNING *
  `;
  const { rows } = await pool.query(query, [id, institution_id]);
  return rows[0];
};

const getHolidayById = async (id) => {
  const query = `SELECT * FROM holidays WHERE id = $1`;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
};

module.exports = {
  getHolidays,
  getHolidayByDate,
  createHoliday,
  deleteHoliday,
  getHolidayById
};
