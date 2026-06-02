require('dotenv').config();
const pool = require('./src/db/connection');
const holidaysModel = require('./src/models/holidaysModel');

async function test() {
  const institution_id = 'c4192533-ab93-49fb-bfd5-d1d72af93028';
  const targetDeptId = '93c753e4-672d-4a4d-a4a5-0f9b66d5ef13'; // HOD's dept
  const date = '2026-06-02'; // same date as holiday1

  const existing = await holidaysModel.getHolidayByDate(institution_id, targetDeptId, date);
  console.log("existing:", existing);
  console.log("targetDeptId:", targetDeptId);
  console.log("existing.dept_id === targetDeptId", existing && existing.dept_id === targetDeptId);
  process.exit(0);
}
test();
