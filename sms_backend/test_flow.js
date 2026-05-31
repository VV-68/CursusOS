const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.tactdxuxzshdjdqjpcvw:PM01dDpP7fmDOpbk@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

(async () => {
  try {
    await client.connect();
    
    const users = await client.query(`
      SELECT id, role FROM users WHERE role = 'advisor'
    `);
    
    for (let u of users.rows) {
      const cls = await client.query(`
        SELECT id FROM classes WHERE is_active = true AND (advisor1_id = $1 OR advisor2_id = $1)
      `, [u.id]);
      console.log(`Advisor ${u.id} has ${cls.rows.length} active classes`);
    }
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
})();
