const http = require('http');

const postData = JSON.stringify({
  username: 'hod.cse@college.edu',
  password: 'password123'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    const token = json.token;
    if (!token) return console.log('Login failed:', data);
    
    // Now fetch getMine
    const getOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/courses/assignments/mine',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    http.request(getOptions, getRes => {
        let getData = '';
        getRes.on('data', chunk => getData += chunk);
        getRes.on('end', () => console.log('getMine:', getData));
    }).end();
  });
});
req.on('error', e => console.error(e));
req.write(postData);
req.end();
