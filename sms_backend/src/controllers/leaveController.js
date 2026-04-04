const leaveModel = require('../models/leaveModel');
const { logAudit } = require('./userController');

const applyLeave = async (req, res) => {
  try {
    const { type, from_date, to_date, reason, document_url } = req.body;
    if (!type || !from_date || !to_date || !reason) {
      return res.status(400).json({ error: 'type, from_date, to_date, and reason are required' });
    }
    const request = await leaveModel.createLeaveRequest(req.user.id, type, from_date, to_date, reason, document_url);
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
