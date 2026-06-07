require('dotenv').config();
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.SUPABASE_URL });

(async () => {
  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE role = 'admin' LIMIT 1");
    const admin = rows[0];
    const token = jwt.sign({ id: admin.id, role: admin.role, dept_id: admin.dept_id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    // Call pending-courses
    const http = require('http');
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/syllabuses/pending-courses',
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    };
    
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => console.log('STATUS:', res.statusCode, 'DATA:', data));
    });
    req.on('error', e => console.error(e));
    req.end();

  } catch(e) {
    console.error(e.message);
  }
})();
