require('dotenv').config();
const pool = require('./src/db/connection');
(async () => {
  const { rows } = await pool.query(`
    SELECT conname, pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE conrelid = 'course_assignments'::regclass;
  `);
  console.log(rows);
  process.exit(0);
})();
