require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.SUPABASE_URL });

(async () => {
  try {
    const id = '799bbdfa-e708-44fd-bf9a-612c08c44673';
    const name = null;
    const description = null;
    const is_active = true;
    
    const { rows } = await pool.query(
      `UPDATE syllabuses
       SET name = COALESCE($2, name),
           description = COALESCE($3, description),
           is_active = COALESCE($4, is_active),
           updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [id, name, description, is_active]
    );
    console.log(rows);
  } catch(e) {
    console.error(e.message);
  }
  process.exit();
})();
