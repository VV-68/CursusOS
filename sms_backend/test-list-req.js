require('dotenv').config();
const syllabusModel = require('./src/models/syllabusModel');

(async () => {
  try {
    const res = await syllabusModel.listRequests();
    console.log(res);
  } catch(e) {
    console.error(e.message);
  }
  process.exit();
})();
