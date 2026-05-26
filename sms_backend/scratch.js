require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.SUPABASE_URL });

async function getColumns(tableName) {
  const { rows } = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = $1
  `, [tableName]);
  console.log(`Table: ${tableName}`);
  console.table(rows);
}

async function run() {
  await getColumns('users');
  await getColumns('departments');
  process.exit();
}
run();
