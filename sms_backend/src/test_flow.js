require('dotenv').config();
const pool = require('./db/connection');
const progressionService = require('./services/progressionService');

(async () => {
  try {
    // 1. Get an active class
    const { rows } = await pool.query("SELECT id FROM classes WHERE is_active = true LIMIT 1");
    if (rows.length === 0) {
      console.log("No active classes found");
      return;
    }
    const classId = rows[0].id;
    
    // Get an admin user
    const adminRes = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    const adminId = adminRes.rows[0].id;
    
    console.log("Class ID:", classId, "Admin ID:", adminId);

    // Update class so it can be deactivated (max_semesters = 1)
    await pool.query("UPDATE classes SET max_semesters = 1, current_semester_number = 1 WHERE id = $1", [classId]);

    // 2. Request deactivation
    let req = await progressionService.createBatchDeactivationRequest({
      batchId: classId,
      requestedBy: adminId,
      reason: 'test1'
    });
    console.log("Requested 1:", req.id);
    
    // Approve
    let res = await progressionService.reviewBatchDeactivationRequest({
      requestId: req.id,
      reviewerId: adminId,
      approve: true
    });
    console.log("Approved 1:", res.status);
    
    // 3. Reactivate
    req = await progressionService.createBatchReactivationRequest({
      batchId: classId,
      requestedBy: adminId,
      reason: 'test reactivate'
    });
    console.log("Requested reactivate:", req.id);
    
    // Approve reactivate
    res = await progressionService.reviewBatchReactivationRequest({
      requestId: req.id,
      reviewerId: adminId,
      approve: true
    });
    console.log("Approved reactivate:", res.status);
    
    // 4. Request deactivation 2
    req = await progressionService.createBatchDeactivationRequest({
      batchId: classId,
      requestedBy: adminId,
      reason: 'test2'
    });
    console.log("Requested 2:", req.id);
    
    // Approve 2
    res = await progressionService.reviewBatchDeactivationRequest({
      requestId: req.id,
      reviewerId: adminId,
      approve: true
    });
    console.log("Approved 2:", res.status);
    
    const finalClass = await pool.query("SELECT is_active FROM classes WHERE id = $1", [classId]);
    console.log("Final is_active:", finalClass.rows[0].is_active);

  } catch (err) {
    console.error("ERROR:", err);
  } finally {
    pool.end();
  }
})();
