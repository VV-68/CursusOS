require('dotenv').config();
const { Pool } = require('pg');
const fetch = require('node:url').URL ? globalThis.fetch : require('undici').fetch;

async function test() {
  const pool = new Pool({ connectionString: process.env.SUPABASE_URL });
  
  // Find a user
  const { rows: users } = await pool.query("SELECT username FROM users LIMIT 1");
  const username = users[0].username;
  
  // Fake login by generating a token directly or just using the API
  const loginRes = await fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({username, password: 'password123'})
  });
  const loginData = await loginRes.json();
  let token = loginData.token;
  
  if (!token) {
    // try to get a raw token since login might fail due to wrong password
    const jwt = require('jsonwebtoken');
    const { rows: uRows } = await pool.query("SELECT * FROM users LIMIT 1");
    token = jwt.sign(
        { id: uRows[0].id, role: uRows[0].role, username: uRows[0].username },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '1d' }
      );
  }
  
  const { rows: caRows } = await pool.query('SELECT id FROM course_assignments LIMIT 1');
  if (caRows.length === 0) return console.log("No course_assignments found");
  const caId = caRows[0].id;
  
  const res = await fetch(`http://localhost:3000/api/assignments/course/${caId}`, {
    headers: {'Authorization': `Bearer ${token}`}
  });
  
  console.log("Status:", res.status);
  console.log("Body:", await res.text());
  
  process.exit(0);
}
test();
