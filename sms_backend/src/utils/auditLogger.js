const pool = require('../db/connection');

const logAudit = async (actor_id, action, target_type = null, target_id = null, old_value = null, new_value = null) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (actor_id, action, target_type, target_id, old_value, new_value)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        actor_id,
        action,
        target_type,
        target_id,
        old_value ? JSON.stringify(old_value) : null,
        new_value ? JSON.stringify(new_value) : null,
      ]
    );
  } catch (err) {
    // Audit log failures must never crash the main operation
    console.error('Audit log failed:', err.message);
  }
};

module.exports = logAudit;
