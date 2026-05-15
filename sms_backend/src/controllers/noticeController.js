const noticeModel = require('../models/noticeModel');
const logAudit = require('../utils/auditLogger');
const { resolveAudienceRoles, audienceLabel } = require('../utils/noticeAudience');
const pool = require('../db/connection');

/** Safe JSON payload for Express (dates, arrays from pg). */
const serializeNotice = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    posted_by: row.posted_by,
    scope: row.scope,
    target_id: row.target_id,
    audience: row.audience ?? null,
    dept_id: row.dept_id ?? null,
    is_pinned: !!row.is_pinned,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    audience_label: row.scope === 'role' ? audienceLabel(row.audience) : row.scope
  };
};

const getNotices = async (req, res) => {
  try {
    const { role, id, dept_id } = req.user;
    let classId = null;
    let deptId = dept_id || null;

    if (role === 'student') {
      const { rows } = await pool.query(
        `SELECT sp.class_id, c.dept_id
         FROM student_profiles sp
         LEFT JOIN classes c ON c.id = sp.class_id
         WHERE sp.user_id = $1`,
        [id]
      );
      if (rows.length) {
        classId = rows[0].class_id;
        deptId = rows[0].dept_id || deptId;
      }
    }

    const notices = await noticeModel.getNoticesForUser({
      userId: id,
      role,
      deptId,
      classId
    });
    res.json(notices);
  } catch (err) {
    console.error('[getNotices] error:', { message: err.message, stack: err.stack });
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

const createNotice = async (req, res) => {
  console.log('[createNotice] start', {
    params: req.params,
    body: req.body,
    userId: req.user?.id,
    role: req.user?.role
  });

  try {
    const { title, body, audience, audience_type, is_pinned } = req.body;
    const audienceInput = audience ?? audience_type;

    if (!title?.trim() || !body?.trim()) {
      console.log('[createNotice] validation failed: missing title/body');
      return res.status(400).json({ error: 'title and body are required' });
    }

    if (!audienceInput || (Array.isArray(audienceInput) && !audienceInput.length)) {
      console.log('[createNotice] validation failed: no audience selected');
      return res.status(400).json({ error: 'Select at least one recipient group' });
    }

    let resolvedAudience;
    try {
      resolvedAudience = resolveAudienceRoles(req.user.role, audienceInput);
    } catch (e) {
      if (e.message === 'INVALID_AUDIENCE') {
        return res.status(400).json({ error: 'Invalid audience selection for your role' });
      }
      if (e.message === 'FORBIDDEN_AUDIENCE') {
        return res.status(403).json({ error: 'You are not allowed to post notices' });
      }
      throw e;
    }

    const dept_id = req.user.role === 'hod' ? req.user.dept_id : null;
    if (req.user.role === 'hod' && !dept_id) {
      return res.status(400).json({ error: 'HOD department not configured' });
    }

    console.log('[createNotice] before insert', { audience: resolvedAudience, dept_id });
    const noticeRow = await noticeModel.createNotice({
      title: title.trim(),
      body: body.trim(),
      posted_by: req.user.id,
      audience: resolvedAudience,
      dept_id,
      is_pinned: !!is_pinned
    });
    console.log('[createNotice] after insert', {
      rowCount: noticeRow ? 1 : 0,
      noticeId: noticeRow?.id,
      scope: noticeRow?.scope,
      audience: noticeRow?.audience
    });

    if (!noticeRow?.id) {
      console.error('[createNotice] insert returned no row');
      return res.status(500).json({ error: 'Notice was not created' });
    }

    const payload = serializeNotice(noticeRow);
    console.log('[createNotice] serialized payload', { id: payload.id, audience_label: payload.audience_label });

    try {
      console.log('[createNotice] before logAudit');
      await logAudit(req.user.id, 'NOTICE_CREATED', 'notices', noticeRow.id, null, {
        title: noticeRow.title,
        audience: resolvedAudience
      });
      console.log('[createNotice] after logAudit ok');
    } catch (auditErr) {
      console.error('[createNotice] logAudit failed (non-fatal)', {
        message: auditErr.message,
        stack: auditErr.stack
      });
    }

    if (res.headersSent) {
      console.error('[createNotice] headers already sent before res.status(201)');
      return;
    }

    console.log('[createNotice] sending 201');
    res.status(201).json(payload);
    console.log('[createNotice] response sent');
  } catch (err) {
    console.error('[createNotice] error:', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      stack: err.stack,
      headersSent: res.headersSent
    });
    if (res.headersSent) return;
    if (err.code === '23514' || err.code === '22P02') {
      return res.status(400).json({
        error: 'Invalid notice data. Run migrate_notices_audience.js if this is a new install.'
      });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteNotice = async (req, res) => {
  console.log('[deleteNotice] start', { noticeId: req.params.id, userId: req.user?.id });

  try {
    if (!['admin', 'hod'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    console.log('[deleteNotice] before delete query');
    const deletedRow = await noticeModel.deleteNotice(req.params.id, req.user.id);
    console.log('[deleteNotice] after delete query', { deleted: !!deletedRow, id: deletedRow?.id });

    if (!deletedRow) {
      return res.status(404).json({ error: 'Notice not found or you are not the author' });
    }

    try {
      console.log('[deleteNotice] before logAudit');
      await logAudit(req.user.id, 'NOTICE_DELETED', 'notices', deletedRow.id, null, {
        title: deletedRow.title
      });
      console.log('[deleteNotice] after logAudit ok');
    } catch (auditErr) {
      console.error('[deleteNotice] logAudit failed (non-fatal)', {
        message: auditErr.message,
        stack: auditErr.stack
      });
    }

    if (res.headersSent) {
      console.error('[deleteNotice] headers already sent before res.json');
      return;
    }

    console.log('[deleteNotice] sending 200');
    res.json({ message: 'Notice deleted', id: deletedRow.id });
    console.log('[deleteNotice] response sent');
  } catch (err) {
    console.error('[deleteNotice] error:', {
      message: err.message,
      stack: err.stack,
      headersSent: res.headersSent
    });
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = {
  getNotices,
  createNotice,
  deleteNotice
};
