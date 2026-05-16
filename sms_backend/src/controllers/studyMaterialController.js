const studyMaterialModel = require('../models/studyMaterialModel');
const { getFacultyAssignment, isStudentInAssignment } = require('../utils/authorizationHelpers');
const storage = require('../utils/storageClient');
const { uploadSingle } = require('../utils/fileUpload');

exports.uploadMiddleware = uploadSingle('file', 25);

const log = (msg, meta = {}) => console.log(`[study-materials] ${msg}`, meta);

const isValidUrl = (url) => {
  try { new URL(url); return true; } catch { return false; }
};

exports.create = async (req, res) => {
  try {
    const title = req.body.title?.trim();
    const description = req.body.description?.trim() || null;
    const course_assignment_id = req.body.course_assignment_id;
    const material_type = req.body.material_type || 'notes';
    const external_link = (req.body.external_link || req.body.drive_link || '').trim() || null;

    if (!title || !course_assignment_id) {
      return res.status(400).json({ error: 'title and course_assignment_id are required' });
    }
    if (!req.file && !external_link) {
      return res.status(400).json({ error: 'Provide a file upload or an external link' });
    }
    if (external_link && !isValidUrl(external_link)) {
      return res.status(400).json({ error: 'external_link must be a valid URL' });
    }

    const ca = await getFacultyAssignment(req.user.id, course_assignment_id);
    if (!ca) return res.status(403).json({ error: 'You are not assigned to this course' });

    let material = await studyMaterialModel.create({
      title,
      description,
      course_assignment_id,
      posted_by: req.user.id,
      material_type,
      external_link,
      is_published: true,
    });

    if (req.file) {
      const { path } = await storage.uploadStudyMaterial(
        course_assignment_id, material.id, req.file.buffer, req.file.originalname, req.file.mimetype
      );
      material = await studyMaterialModel.updateById(material.id, {
        file_path: path,
        file_name: req.file.originalname,
        file_mime_type: req.file.mimetype,
        file_size: req.file.size,
      });
    }

    log('created', { id: material.id, course_assignment_id });
    res.status(201).json(material);
  } catch (err) {
    console.error('[study-materials] create error:', err);
    if (err.message === 'File type not allowed') return res.status(400).json({ error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const material = await studyMaterialModel.getById(id);
    if (!material) return res.status(404).json({ error: 'Material not found' });

    if (material.posted_by !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own materials' });
    }

    const ca = await getFacultyAssignment(req.user.id, material.course_assignment_id);
    if (!ca) return res.status(403).json({ error: 'Not authorized' });

    const external_link = req.body.external_link ?? req.body.drive_link;
    if (external_link !== undefined && external_link !== null && external_link !== '' && !isValidUrl(external_link)) {
      return res.status(400).json({ error: 'external_link must be a valid URL' });
    }

    let updates = {
      title: req.body.title?.trim(),
      description: req.body.description?.trim(),
      material_type: req.body.material_type,
      external_link: external_link === '' ? null : external_link,
      is_published: req.body.is_published !== undefined ? req.body.is_published === 'true' || req.body.is_published === true : undefined,
    };

    if (req.file) {
      if (material.file_path) {
        try { await storage.deleteMaterialFile(material.file_path); } catch (e) { log('old file delete warn', e.message); }
      }
      const { path } = await storage.uploadStudyMaterial(
        material.course_assignment_id, id, req.file.buffer, req.file.originalname, req.file.mimetype
      );
      updates = {
        ...updates,
        file_path: path,
        file_name: req.file.originalname,
        file_mime_type: req.file.mimetype,
        file_size: req.file.size,
      };
    }

    const updated = await studyMaterialModel.updateById(id, updates);
    res.json(updated);
  } catch (err) {
    console.error('[study-materials] update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.list = async (req, res) => {
  try {
    const { course_assignment_id } = req.params;

    if (req.user.role === 'student') {
      const enrolled = await isStudentInAssignment(req.user.id, course_assignment_id);
      if (!enrolled) return res.status(403).json({ error: 'Not enrolled in this course' });
      const materials = await studyMaterialModel.getByCourseAssignment(course_assignment_id, true);
      return res.json(materials);
    }

    const ca = await getFacultyAssignment(req.user.id, course_assignment_id);
    if (!ca && !['admin', 'hod'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized for this course' });
    }

    const materials = await studyMaterialModel.getByCourseAssignment(course_assignment_id, false);
    res.json(materials);
  } catch (err) {
    console.error('[study-materials] list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getDownloadUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const material = await studyMaterialModel.getById(id);
    if (!material) return res.status(404).json({ error: 'Material not found' });
    if (!material.file_path) return res.status(404).json({ error: 'No file attached to this material' });

    if (req.user.role === 'student') {
      if (!material.is_published) return res.status(403).json({ error: 'Material not available' });
      const enrolled = await isStudentInAssignment(req.user.id, material.course_assignment_id);
      if (!enrolled) return res.status(403).json({ error: 'Not enrolled in this course' });
    } else {
      const ca = await getFacultyAssignment(req.user.id, material.course_assignment_id);
      if (!ca && material.posted_by !== req.user.id && !['admin', 'hod'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Not authorized' });
      }
    }

    const signed_url = await storage.getMaterialSignedUrl(material.file_path);
    res.json({ signed_url, file_name: material.file_name });
  } catch (err) {
    console.error('[study-materials] download error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const material = await studyMaterialModel.getById(id);
    if (!material) return res.status(404).json({ error: 'Material not found' });

    if (material.posted_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this material' });
    }

    const ca = await getFacultyAssignment(req.user.id, material.course_assignment_id);
    if (!ca && material.posted_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (material.file_path) {
      try { await storage.deleteMaterialFile(material.file_path); } catch (e) { log('file delete warn', e.message); }
    }

    await studyMaterialModel.deleteById(id);
    log('deleted', { id });
    res.json({ message: 'Material deleted' });
  } catch (err) {
    console.error('[study-materials] delete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
