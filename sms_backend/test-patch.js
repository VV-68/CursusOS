require('dotenv').config();
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.SUPABASE_URL });

(async () => {
  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE role = 'admin' LIMIT 1");
    const admin = rows[0];
    const token = jwt.sign({ id: admin.id, role: admin.role, dept_id: admin.dept_id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    const http = require('http');
    const data = JSON.stringify({ is_active: true });
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/syllabuses/799bbdfa-e708-44fd-bf9a-612c08c44673',
      method: 'PATCH',
      headers: { 
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => console.log('STATUS:', res.statusCode, 'DATA:', body));
    });
    req.on('error', e => console.error(e));
    req.write(data);
    req.end();

  } catch(e) {
    console.error(e.message);
  }
})();
