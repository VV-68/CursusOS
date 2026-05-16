require('dotenv').config();
const pool = require('./src/db/connection');
async function run() {
  try {
    await pool.query('ALTER TABLE departments ADD COLUMN pending_hod_id UUID REFERENCES users(id) ON DELETE SET NULL');
    console.log('done');
  } catch(e) { console.error(e); }
  process.exit(0);
}
run();
