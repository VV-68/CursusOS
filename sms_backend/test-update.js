require('dotenv').config();
const syllabusModel = require('./src/models/syllabusModel');

(async () => {
  try {
    const res = await syllabusModel.update('799bbdfa-e708-44fd-bf9a-612c08c44673', { is_active: true });
    console.log(res);
  } catch(e) {
    console.error(e);
  }
  process.exit();
})();
