require('dotenv').config();
const pool = require('./src/db/connection');
(async () => {
  const { rows } = await pool.query(`
    SELECT table_name, column_name, is_nullable
    FROM information_schema.columns
    WHERE column_name = 'semester_id' AND table_schema = 'public';
  `);
  console.log(rows);
  process.exit(0);
})();
