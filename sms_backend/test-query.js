require('dotenv').config();
const syllabusModel = require('./src/models/syllabusModel');

(async () => {
  try {
    const res = await syllabusModel.getPendingCourseGroups();
    console.log(res);
  } catch(e) {
    console.error(e);
  }
  process.exit();
})();
