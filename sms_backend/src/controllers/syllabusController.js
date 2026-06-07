const syllabusModel = require('../models/syllabusModel');
const logAudit = require('../utils/auditLogger');
const pool = require('../db/connection');

// ── Syllabuses ──────────────────────────────────────────────────────────

const listSyllabuses = async (req, res) => {
  try {
    const dept_id = req.query.dept_id || req.user.dept_id;
    if (!dept_id) return res.status(400).json({ error: 'dept_id is required' });
    const syllabuses = await syllabusModel.getAllByDept(dept_id);
    res.json(syllabuses);
  } catch (err) {
    console.error('[syllabus] listSyllabuses error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getSyllabus = async (req, res) => {
  try {
    const syllabus = await syllabusModel.getById(req.params.id);
    if (!syllabus) return res.status(404).json({ error: 'Syllabus not found' });
    res.json(syllabus);
  } catch (err) {
    console.error('[syllabus] getSyllabus error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createSyllabus = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Syllabus name is required' });

    const dept_id = req.user.dept_id;
    if (!dept_id) return res.status(400).json({ error: 'You must belong to a department' });

    const syllabus = await syllabusModel.create({
      dept_id,
      name,
      description,
      created_by: req.user.id,
      is_active: req.user.role === 'admin'
    });

    await logAudit(req.user.id, 'SYLLABUS_CREATED', 'syllabus', syllabus.id, null, { name: syllabus.name });
    res.status(201).json(syllabus);
  } catch (err) {
    console.error('[syllabus] createSyllabus error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateSyllabus = async (req, res) => {
  try {
    const { name, description, is_active, is_rejected } = req.body;
    const existing = await syllabusModel.getById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Syllabus not found' });

    // HODs can only modify syllabuses in their dept
    if (req.user.role === 'hod' && existing.dept_id !== req.user.dept_id) {
      return res.status(403).json({ error: 'You can only modify syllabuses in your department' });
    }

    // Admins can only modify if in same institution
    if (req.user.role === 'admin' && req.user.institution_id) {
      const deptRes = await pool.query('SELECT institution_id FROM departments WHERE id = $1', [existing.dept_id]);
      if (deptRes.rows[0]?.institution_id !== req.user.institution_id) {
        return res.status(403).json({ error: 'Syllabus belongs to another institution' });
      }
    }

    const updated = await syllabusModel.update(req.params.id, { name, description, is_active, is_rejected });
    await logAudit(req.user.id, 'SYLLABUS_UPDATED', 'syllabus', req.params.id, 
      { name: existing.name, is_active: existing.is_active },
      { name: updated.name, is_active: updated.is_active }
    );
    res.json(updated);
  } catch (err) {
    console.error('[syllabus] updateSyllabus error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteSyllabus = async (req, res) => {
  try {
    const existing = await syllabusModel.getById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Syllabus not found' });

    if (req.user.role === 'hod') {
      if (existing.dept_id !== req.user.dept_id) {
        return res.status(403).json({ error: 'You can only delete syllabuses in your department' });
      }
      if (existing.is_active) {
        return res.status(403).json({ error: 'Cannot delete an active/approved syllabus. Please contact an admin.' });
      }
    }

    await syllabusModel.remove(req.params.id);
    await logAudit(req.user.id, 'SYLLABUS_DELETED', 'syllabus', req.params.id, { name: existing.name }, null);
    res.json({ message: 'Syllabus deleted successfully' });
  } catch (err) {
    if (err.message.includes('Cannot delete')) {
      return res.status(400).json({ error: err.message });
    }
    console.error('[syllabus] deleteSyllabus error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── Assignment Requests (HOD → Admin approval) ─────────────────────────

const requestAssignment = async (req, res) => {
  try {
    const { batch_id, syllabus_id, remarks } = req.body;
    if (!batch_id || !syllabus_id) {
      return res.status(400).json({ error: 'batch_id and syllabus_id are required' });
    }

    // Verify the batch belongs to HOD's department
    const { rows: batchRows } = await pool.query('SELECT dept_id FROM classes WHERE id = $1', [batch_id]);
    if (batchRows.length === 0) return res.status(404).json({ error: 'Batch not found' });
    if (req.user.role === 'hod' && batchRows[0].dept_id !== req.user.dept_id) {
      return res.status(403).json({ error: 'Batch not in your department' });
    }

    // Verify syllabus belongs to same department
    const syllabus = await syllabusModel.getById(syllabus_id);
    if (!syllabus) return res.status(404).json({ error: 'Syllabus not found' });
    if (syllabus.dept_id !== batchRows[0].dept_id) {
      return res.status(400).json({ error: 'Syllabus must belong to the same department as the batch' });
    }

    const request = await syllabusModel.createAssignmentRequest({
      batch_id,
      requested_syllabus_id: syllabus_id,
      requested_by: req.user.id,
      remarks
    });

    // Notify admins
    try {
      const { notifyUser } = require('../services/notificationService');
      const { rows: admins } = await pool.query(
        "SELECT id FROM users WHERE role = 'admin' AND is_active = true AND institution_id = $1",
        [req.user.institution_id]
      );
      const { rows: deptRows } = await pool.query('SELECT name FROM departments WHERE id = $1', [batchRows[0].dept_id]);
      const deptName = deptRows[0]?.name || 'a department';
      for (const admin of admins) {
        await notifyUser(req.user.id, admin.id, 
          `HOD of ${deptName} has requested syllabus "${syllabus.name}" for a batch. Please review.`
        );
      }
    } catch (notifErr) {
      console.error('[syllabus] notification failed (non-fatal)', notifErr.message);
    }

    await logAudit(req.user.id, 'SYLLABUS_ASSIGNMENT_REQUESTED', 'batch_syllabus_request', request.id, null, {
      batch_id, syllabus_id, syllabus_name: syllabus.name
    });

    res.status(201).json(request);
  } catch (err) {
    if (err.message.includes('pending')) {
      return res.status(400).json({ error: err.message });
    }
    console.error('[syllabus] requestAssignment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const listRequests = async (req, res) => {
  try {
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    // HODs see only their department requests
    if (req.user.role === 'hod') filters.dept_id = req.user.dept_id;
    // Admins can filter by dept if they want
    if (req.user.role === 'admin' && req.query.dept_id) filters.dept_id = req.query.dept_id;
    if (req.user.institution_id) filters.institution_id = req.user.institution_id;

    const requests = await syllabusModel.listRequests(filters);
    res.json(requests);
  } catch (err) {
    console.error('[syllabus] listRequests error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const reviewRequest = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'status must be "approved" or "rejected"' });
    }

    if (req.user.role === 'admin' && req.user.institution_id) {
      const reqRes = await pool.query(`
        SELECT d.institution_id 
        FROM batch_syllabus_requests bsr
        JOIN classes c ON c.id = bsr.batch_id
        JOIN departments d ON d.id = c.dept_id
        WHERE bsr.id = $1
      `, [req.params.id]);
      
      if (reqRes.rows.length === 0 || reqRes.rows[0].institution_id !== req.user.institution_id) {
        return res.status(403).json({ error: 'Request belongs to another institution' });
      }
    }

    const request = await syllabusModel.reviewRequest(req.params.id, {
      status,
      reviewed_by: req.user.id,
      remarks
    });

    // Notify the requester
    try {
      const { notifyUser } = require('../services/notificationService');
      const emoji = status === 'approved' ? '✅' : '❌';
      await notifyUser(req.user.id, request.requested_by,
        `${emoji} Your syllabus assignment request has been ${status}.${remarks ? ` Remarks: ${remarks}` : ''}`
      );
    } catch (notifErr) {
      console.error('[syllabus] review notification failed (non-fatal)', notifErr.message);
    }

    await logAudit(req.user.id, `SYLLABUS_ASSIGNMENT_${status.toUpperCase()}`, 'batch_syllabus_request', req.params.id, null, {
      status, batch_id: request.batch_id, syllabus_id: request.requested_syllabus_id
    });

    res.json({ message: `Request ${status} successfully`, request });
  } catch (err) {
    console.error('[syllabus] reviewRequest error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getBatchesWithSyllabus = async (req, res) => {
  try {
    const dept_id = req.query.dept_id || req.user.dept_id;
    if (!dept_id) return res.status(400).json({ error: 'dept_id is required' });
    const batches = await syllabusModel.getBatchesWithSyllabus(dept_id);
    res.json(batches);
  } catch (err) {
    console.error('[syllabus] getBatchesWithSyllabus error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getSyllabusesListByStatus = async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const institutionId = req.user.institution_id;
    const data = await syllabusModel.getSyllabusesByStatus(status, institutionId);
    res.json(data);
  } catch (err) {
    console.error('[syllabus] getSyllabusesListByStatus error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCourseGroupsListByStatus = async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const institutionId = req.user.institution_id;
    const data = await syllabusModel.getCourseGroupsByStatus(status, institutionId);
    res.json(data);
  } catch (err) {
    console.error('[syllabus] getCourseGroupsListByStatus error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  listSyllabuses,
  getSyllabus,
  createSyllabus,
  updateSyllabus,
  deleteSyllabus,
  requestAssignment,
  listRequests,
  reviewRequest,
  getBatchesWithSyllabus,
  getSyllabusesListByStatus,
  getCourseGroupsListByStatus
};
