require('dotenv').config({path: './sms_backend/.env'});
const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: '83d42b5e-d2ea-43ab-883c-8f31b112e91e', role: 'faculty' }, process.env.JWT_SECRET || 'secret');

fetch('http://localhost:3000/api/courses/assignments/mine', {
  headers: { 'Authorization': 'Bearer ' + token }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
