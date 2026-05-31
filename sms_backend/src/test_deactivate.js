const pool = require('./db/connection');
const { reviewBatchDeactivationRequest } = require('./services/progressionService');

(async () => {
  try {
    // Just a placeholder to see if any syntax error happens
    console.log("Syntax is OK");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
})();
