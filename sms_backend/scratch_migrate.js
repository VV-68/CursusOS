require('dotenv').config();
const pool = require('./src/db/connection');

async function run() {
  await pool.query("ALTER TABLE departments ADD COLUMN IF NOT EXISTS active_term VARCHAR DEFAULT 'all'");
  await pool.query("ALTER TABLE courses ADD COLUMN IF NOT EXISTS semester_number INT");
  // Set existing courses semester_number based on code if possible, or default to 1
  const { rows: courses } = await pool.query("SELECT id, code FROM courses");
  for (const c of courses) {
     let sem = 1;
     if (c.code) {
        const match = c.code.match(/^0?(\d)/);
        if (match) sem = parseInt(match[1]);
     }
     await pool.query("UPDATE courses SET semester_number = $1 WHERE id = $2", [sem, c.id]);
  }
  console.log("Migration complete");
  process.exit();
}
run();
