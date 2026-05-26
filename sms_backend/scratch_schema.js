require('dotenv').config({ path: '.env' });
const pool = require('./src/db/connection');

async function test() {
  const { rows } = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'departments'");
  console.log(rows);
  const { rows: semRows } = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'semesters'");
  console.log("semesters:", semRows);
  process.exit();
}
test();
