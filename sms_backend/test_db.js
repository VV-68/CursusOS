const { Pool } = require('pg');
require('dotenv').config();
async function test() {
  const pool = new Pool({ connectionString: process.env.SUPABASE_URL });
  const { rows } = await pool.query("SELECT * FROM semesters");
  console.log(rows);
  process.exit(0);
}
test();
