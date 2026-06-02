require('dotenv').config();
const { createHoliday } = require('./src/controllers/holidaysController');

const req = {
  user: {
    role: 'hod',
    dept_id: '93c753e4-672d-4a4d-a4a5-0f9b66d5ef13',
    institution_id: 'c4192533-ab93-49fb-bfd5-d1d72af93028',
    id: '9e3d0523-ed90-4891-8cd0-eaa107e788a7'
  },
  body: {
    date: '2026-06-02',
    description: 'holiday test',
  }
};

const res = {
  status: (code) => {
    console.log('STATUS:', code);
    return {
      json: (data) => console.log('JSON:', data)
    };
  }
};

createHoliday(req, res).then(() => process.exit(0));
