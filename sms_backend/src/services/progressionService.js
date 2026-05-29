const pool = require('../db/connection');
const {
  deriveYearFromSemester,
  getBatchCurrentState,
  getStudentActiveAcademicState,
  resolveSemesterIdForNumber,
} = require('./academicStateService');
const { notifyUser, notifyHODs } = require('./notificationService');

const getCurrentAcademicState = async (studentId) => getStudentActiveAcademicState(studentId);
const getStudentCurrentSemester = async (studentId) => (await getCurrentAcademicState(studentId))?.semester_id || null;
const getStudentCurrentAdvisor = async (studentId) => {
  const state = await getCurrentAcademicState(studentId);
  return state ? { advisor1: state.advisor1_id, advisor2: state.advisor2_id } : null;
};
const getStudentCurrentClass = async (studentId) => (await getCurrentAcademicState(studentId))?.class_id || null;
const ensureEvenSemesterForRequest = (semester) => {
  if (!semester || Number(semester) % 2 !== 0) {
    throw new Error('Promotion requests are allowed only from even semesters (Year progression)');
  }
};

const copyCourseAssignmentsToNewSemester = async (client, classId, currentSemesterId, targetSemesterId) => {
  if (!targetSemesterId) return 0;
  const res = await client.query(
    `INSERT INTO course_assignments (faculty1_id, faculty2_id, course_id, class_id, semester_id)
     SELECT ca.faculty1_id, ca.faculty2_id, ca.course_id, ca.class_id, $2
     FROM course_assignments ca
     WHERE ca.class_id = $1 AND ca.semester_id = $3
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [classId, targetSemesterId, currentSemesterId]
  );
  return res.rowCount;
};

const createBatchPromotionRequest = async ({ batchId, requestedBy, remarks }) => {
  const batch = await getBatchCurrentState(batchId);
  if (!batch) throw new Error('Batch not found');
  if (batch.is_active === false || batch.is_graduated === true) {
    throw new Error('Inactive or graduated batches cannot be promoted');
  }
  ensureEvenSemesterForRequest(batch.current_semester_number);

  const targetSemester = Number(batch.current_semester_number) + 1;
  const targetYear = deriveYearFromSemester(targetSemester);

  const pending = await pool.query(
    `SELECT id FROM batch_promotion_requests WHERE batch_id = $1 AND status = 'pending' LIMIT 1`,
    [batchId]
  );
  if (pending.rows[0]) throw new Error('Pending promotion request already exists for this batch');

  const { rows } = await pool.query(
    `INSERT INTO batch_promotion_requests (
      batch_id, requested_by, current_semester, target_semester, current_year, target_year, status, remarks
    ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)
    RETURNING *`,
    [batchId, requestedBy, batch.current_semester_number, targetSemester, batch.current_year_number, targetYear, remarks || null]
  );

  const admins = await pool.query(`SELECT id FROM users WHERE role = 'admin' AND is_active = true`);
  for (const admin of admins.rows) {
    await notifyUser(requestedBy, admin.id, `Promotion request pending for batch ${batch.name} (${batch.current_semester_number} -> ${targetSemester}).`);
  }
  return rows[0];
};

const applyPromotion = async (requestId, reviewerId, approve, remarks) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const reqRes = await client.query(
      `SELECT * FROM batch_promotion_requests WHERE id = $1 FOR UPDATE`,
      [requestId]
    );
    const req = reqRes.rows[0];
    if (!req) throw new Error('Promotion request not found');
    if (req.status !== 'pending') throw new Error('Promotion request already reviewed');

    if (!approve) {
      const rejected = await client.query(
        `UPDATE batch_promotion_requests
         SET status = 'rejected', remarks = COALESCE($2, remarks), reviewed_by = $3, reviewed_at = now()
         WHERE id = $1
         RETURNING *`,
        [requestId, remarks || null, reviewerId]
      );
      await client.query('COMMIT');
      await notifyUser(reviewerId, req.requested_by, `Promotion request rejected for batch.`);
      return rejected.rows[0];
    }

    const batchRes = await client.query(`SELECT * FROM classes WHERE id = $1 FOR UPDATE`, [req.batch_id]);
    const batch = batchRes.rows[0];
    if (!batch) throw new Error('Batch not found');

    const targetSemesterId = await resolveSemesterIdForNumber(req.target_semester);
    const advisors = {
      advisor1: batch.advisor1_id || null,
      advisor2: batch.advisor2_id || null,
    };

    await client.query(
      `UPDATE student_academic_history
       SET is_active = false, ended_at = now()
       WHERE class_id = $1 AND is_active = true`,
      [req.batch_id]
    );

    const studentRes = await client.query(
      `SELECT user_id FROM student_profiles WHERE class_id = $1`,
      [req.batch_id]
    );
    for (const student of studentRes.rows) {
      await client.query(
        `INSERT INTO student_academic_history (
          student_id, class_id, semester_id, current_year, current_semester,
          advisor1_id, advisor2_id, promoted_at, is_active, remarks
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, now(), true, $8)`,
        [
          student.user_id,
          req.batch_id,
          targetSemesterId,
          req.target_year,
          req.target_semester,
          advisors.advisor1,
          advisors.advisor2,
          `Promotion approved via request ${req.id}`,
        ]
      );
    }

    await client.query(
      `UPDATE classes
       SET current_semester_number = $1,
           current_year_number = $2,
           semester_id = COALESCE($3, semester_id),
           is_active = true,
           deactivation_requested = false
       WHERE id = $4`,
      [req.target_semester, req.target_year, targetSemesterId, req.batch_id]
    );

    await copyCourseAssignmentsToNewSemester(client, req.batch_id, batch.semester_id, targetSemesterId);

    const approved = await client.query(
      `UPDATE batch_promotion_requests
       SET status = 'approved', remarks = COALESCE($2, remarks), reviewed_by = $3, reviewed_at = now()
       WHERE id = $1
       RETURNING *`,
      [requestId, remarks || null, reviewerId]
    );

    await client.query('COMMIT');
    await notifyUser(reviewerId, req.requested_by, `Promotion approved for batch ${batch.name}.`);
    await notifyHODs(reviewerId, batch.dept_id, `Batch ${batch.name} moved to semester ${req.target_semester}.`);
    return approved.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const directPromoteOddToEven = async (batchId, actorId) => {
  const batch = await getBatchCurrentState(batchId);
  if (!batch) throw new Error('Batch not found');
  if (batch.is_active === false || batch.is_graduated === true) {
    throw new Error('Inactive or graduated batches cannot be promoted');
  }

  if (Number(batch.current_semester_number) % 2 === 0) {
    throw new Error('Direct promotion is only allowed from odd to even semesters (within year). For year progression, please use request promotion.');
  }

  const targetSemester = Number(batch.current_semester_number) + 1;
  const targetYear = batch.current_year_number; // same year

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Lock batch
    await client.query(`SELECT id FROM classes WHERE id = $1 FOR UPDATE`, [batchId]);

    const targetSemesterId = await resolveSemesterIdForNumber(targetSemester);
    const advisors = {
      advisor1: batch.advisor1_id || null,
      advisor2: batch.advisor2_id || null,
    };

    await client.query(
      `UPDATE student_academic_history
       SET is_active = false, ended_at = now()
       WHERE class_id = $1 AND is_active = true`,
      [batchId]
    );

    const studentRes = await client.query(
      `SELECT user_id FROM student_profiles WHERE class_id = $1`,
      [batchId]
    );
    for (const student of studentRes.rows) {
      await client.query(
        `INSERT INTO student_academic_history (
          student_id, class_id, semester_id, current_year, current_semester,
          advisor1_id, advisor2_id, promoted_at, is_active, remarks
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, now(), true, $8)`,
        [
          student.user_id,
          batchId,
          targetSemesterId,
          targetYear,
          targetSemester,
          advisors.advisor1,
          advisors.advisor2,
          `Direct promotion to semester ${targetSemester} by HOD`
        ]
      );
    }

    await client.query(
      `UPDATE classes
       SET current_semester_number = $1,
           current_year_number = $2,
           semester_id = COALESCE($3, semester_id),
           is_active = true,
           deactivation_requested = false
       WHERE id = $4`,
      [targetSemester, targetYear, targetSemesterId, batchId]
    );

    await copyCourseAssignmentsToNewSemester(client, batchId, batch.semester_id, targetSemesterId);

    await client.query('COMMIT');
    return { success: true, targetSemester, targetYear };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const createBatchDeactivationRequest = async ({ batchId, requestedBy, reason }) => {
  const batch = await getBatchCurrentState(batchId);
  if (!batch) throw new Error('Batch not found');
  if (batch.is_active === false) throw new Error('Batch is already inactive');

  const pending = await pool.query(
    `SELECT id FROM batch_deactivation_requests WHERE batch_id = $1 AND status = 'pending' LIMIT 1`,
    [batchId]
  );
  if (pending.rows[0]) throw new Error('Pending deactivation request already exists');

  await pool.query(
    `UPDATE classes
     SET deactivation_requested = true, deactivation_requested_at = now(), deactivation_requested_by = $2
     WHERE id = $1`,
    [batchId, requestedBy]
  );

  const { rows } = await pool.query(
    `INSERT INTO batch_deactivation_requests (batch_id, requested_by, reason, status)
     VALUES ($1, $2, $3, 'pending')
     RETURNING *`,
    [batchId, requestedBy, reason || null]
  );

  const admins = await pool.query(`SELECT id FROM users WHERE role = 'admin' AND is_active = true`);
  for (const admin of admins.rows) {
    await notifyUser(requestedBy, admin.id, `Deactivation request pending for batch ${batch.name}.`);
  }
  return rows[0];
};

const reviewBatchDeactivationRequest = async ({ requestId, reviewerId, approve }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const reqRes = await client.query(
      `SELECT * FROM batch_deactivation_requests WHERE id = $1 FOR UPDATE`,
      [requestId]
    );
    const req = reqRes.rows[0];
    if (!req) throw new Error('Deactivation request not found');
    if (req.status !== 'pending') throw new Error('Deactivation request already reviewed');

    const status = approve ? 'approved' : 'rejected';
    const reviewed = await client.query(
      `UPDATE batch_deactivation_requests
       SET status = $2, reviewed_by = $3, reviewed_at = now()
       WHERE id = $1
       RETURNING *`,
      [requestId, status, reviewerId]
    );

    if (approve) {
      await client.query(
        `UPDATE classes
         SET is_active = false,
             course_completed = true,
             is_graduated = true,
             deactivated_at = now(),
             deactivation_approved_by = $2,
             deactivation_requested = false
         WHERE id = $1`,
        [req.batch_id, reviewerId]
      );
      await client.query(
        `UPDATE users u
         SET is_active = false
         FROM student_profiles sp
         WHERE sp.class_id = $1 AND sp.user_id = u.id AND u.role = 'student'`,
        [req.batch_id]
      );
    } else {
      await client.query(
        `UPDATE classes
         SET deactivation_requested = false
         WHERE id = $1`,
        [req.batch_id]
      );
    }

    await client.query('COMMIT');
    await notifyUser(reviewerId, req.requested_by, `Batch deactivation request ${status}.`);
    return reviewed.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// Legacy compatibility methods (retain old APIs).
const promoteStudent = async (studentId, newSemesterId, newYear, newSemesterNumber, newAdvisor1, newAdvisor2, remarks = 'Promoted') => {
  const classId = await getStudentCurrentClass(studentId);
  if (!classId) throw new Error('Student profile not found');
  const req = await createBatchPromotionRequest({ batchId: classId, requestedBy: studentId, remarks });
  return applyPromotion(req.id, studentId, true, remarks || `Legacy promote student to S${newSemesterNumber || ''}`);
};

const promoteClass = async (classId, _newSemesterId, newYear, newSemesterNumber, _newAdvisor1, _newAdvisor2, remarks = 'Batch Promoted', actorId = null) => {
  let requesterId = actorId;
  if (!requesterId) {
    const fallbackUser = await pool.query(
      `SELECT id FROM users WHERE role IN ('admin', 'hod') AND is_active = true ORDER BY created_at ASC NULLS LAST LIMIT 1`
    );
    requesterId = fallbackUser.rows[0]?.id;
  }
  if (!requesterId) throw new Error('No eligible requester available for legacy promotion');

  const req = await createBatchPromotionRequest({
    batchId: classId,
    requestedBy: requesterId,
    remarks: remarks || `Promote to S${newSemesterNumber}, Y${newYear}`,
  });
  return applyPromotion(req.id, requesterId, true, remarks);
};

const listPromotionRequests = async (status = null) => {
  const params = [];
  let q = `SELECT bpr.*, c.name as batch_name FROM batch_promotion_requests bpr JOIN classes c ON c.id = bpr.batch_id WHERE 1=1`;
  if (status) {
    params.push(status);
    q += ` AND bpr.status = $${params.length}`;
  }
  q += ` ORDER BY bpr.requested_at DESC`;
  const { rows } = await pool.query(q, params);
  return rows;
};

const listDeactivationRequests = async (status = null) => {
  const params = [];
  let q = `SELECT bdr.*, c.name as batch_name FROM batch_deactivation_requests bdr JOIN classes c ON c.id = bdr.batch_id WHERE 1=1`;
  if (status) {
    params.push(status);
    q += ` AND bdr.status = $${params.length}`;
  }
  q += ` ORDER BY bdr.requested_at DESC`;
  const { rows } = await pool.query(q, params);
  return rows;
};

module.exports = {
  getCurrentAcademicState,
  getStudentCurrentSemester,
  getStudentCurrentAdvisor,
  getStudentCurrentClass,
  promoteStudent,
  promoteClass,
  createBatchPromotionRequest,
  applyPromotion,
  directPromoteOddToEven,
  listPromotionRequests,
  createBatchDeactivationRequest,
  reviewBatchDeactivationRequest,
  listDeactivationRequests,
};
