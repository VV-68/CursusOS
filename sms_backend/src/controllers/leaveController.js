const leaveModel = require('../models/leaveModel');
const logAudit = require('../utils/auditLogger');
const pool = require('../db/connection');

const applyLeave = async (req, res) => {
  try {
    const { type, from_date, to_date, reason, document_url } = req.body;
    if (!type || !from_date || !to_date || !reason) {
      return res.status(400).json({ error: 'type, from_date, to_date, and reason are required' });
    }
    const request = await leaveModel.createLeaveRequest(req.user.id, type, from_date, to_date, reason, document_url);

    // Notify approver
    try {
      const { notifyAdvisor, notifyHODs } = require('../services/notificationService');
      const { rows: userRows } = await pool.query('SELECT full_name FROM users WHERE id = $1', [req.user.id]);
      const userName = userRows[0]?.full_name || 'A user';
      const leaveMsg = `🗓️ ${userName} applied for ${type} leave (${from_date} to ${to_date})`;

      if (req.user.role === 'student') {
        // Notify advisor
        const { rows } = await pool.query(
          `SELECT class_id FROM student_profiles WHERE user_id = $1`,
          [req.user.id]
        );
        if (rows.length > 0 && rows[0].class_id) {
          await notifyAdvisor(req.user.id, rows[0].class_id, leaveMsg);
        }
      } else if (['faculty', 'advisor'].includes(req.user.role)) {
        // Notify HOD
        if (req.user.dept_id) {
          await notifyHODs(req.user.id, req.user.dept_id, leaveMsg);
        }
      }
    } catch (notifErr) {
      console.error('[leave] notification failed (non-fatal)', notifErr.message);
    }

    res.status(201).json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getMyRequests = async (req, res) => {
  try {
    const requests = await leaveModel.getMyRequests(req.user.id);
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getPendingApprovals = async (req, res) => {
  try {
    const { role, dept_id, id } = req.user;

    if (role === 'hod') {
      const requests = await leaveModel.getPendingForHod(dept_id);
      return res.json(requests);
    }

    if (role === 'advisor') {
      const requests = await leaveModel.getPendingForAdvisor(id);
      return res.json(requests);
    }

    return res.status(403).json({ error: 'Forbidden' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const processLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updated = await leaveModel.processRequest(id, status, req.user.id, remarks);

    await logAudit(req.user.id, `LEAVE_${status.toUpperCase()}`, 'leave_requests', id, null, { status });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  applyLeave,
  getMyRequests,
  getPendingApprovals,
  processLeave
};
