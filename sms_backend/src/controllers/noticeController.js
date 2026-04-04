const noticeModel = require('../models/noticeModel');
const { logAudit } = require('./userController');
const pool = require('../db/connection');

const getNotices = async (req, res) => {
  try {
    const { role, id } = req.user;
    let target_id = null;

    // For students, find their class_id to show class-specific notices
    if (role === 'student') {
      const { rows } = await pool.query('SELECT class_id FROM student_profiles WHERE user_id = $1', [id]);
      if (rows.length > 0) {
        target_id = rows[0].class_id;
      }
    }

    const notices = await noticeModel.getNotices(role, target_id);
    res.json(notices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createNotice = async (req, res) => {
  try {
    const { title, body, scope, target_id, is_pinned } = req.body;

    if (!title || !body || !scope) {
      return res.status(400).json({ error: 'title, body, and scope are required' });
    }

    const notice = await noticeModel.createNotice(title, body, req.user.id, scope, target_id, is_pinned);

    await logAudit(req.user.id, 'NOTICE_CREATED', 'notices', notice.id, null, { title });

    res.status(201).json(notice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getNotices,
  createNotice
};
