const studyMaterialModel = require('../models/studyMaterialModel');
const { getFacultyAssignment, isStudentInAssignment } = require('../utils/authorizationHelpers');
const pool = require('../db/connection');

// Validate that a URL is a proper Google Drive or external link
const isValidUrl = (url) => {
  try { new URL(url); return true; }
  catch { return false; }
};

exports.create = async (req, res) => {
  try {
    const { title, description, drive_link, course_assignment_id, material_type } = req.body;

    if (!title || !drive_link || !course_assignment_id) {
      return res.status(400).json({ error: 'title, drive_link, and course_assignment_id are required' });
    }
    if (!isValidUrl(drive_link)) {
      return res.status(400).json({ error: 'drive_link must be a valid URL' });
    }

    // Verify faculty owns this course_assignment
    const ca = await getFacultyAssignment(req.user.id, course_assignment_id);
    if (!ca) return res.status(403).json({ error: 'You are not assigned to this course' });

    const material = await studyMaterialModel.create({
      title: title.trim(),
      description: description?.trim() || null,
      drive_link: drive_link.trim(),
      course_assignment_id,
      posted_by: req.user.id,
      material_type: material_type || 'notes',
    });

    res.status(201).json(material);
  } catch (err) {
    console.error(err);
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
    if (!ca) return res.status(403).json({ error: 'Not authorized for this course' });

    const materials = await studyMaterialModel.getByCourseAssignment(course_assignment_id, false);
    res.json(materials);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT m.*, ca.faculty1_id, ca.faculty2_id FROM study_materials m
       JOIN course_assignments ca ON ca.id = m.course_assignment_id
       WHERE m.id = $1`,
      [id]
    );
    const material = rows[0];
    if (!material) return res.status(404).json({ error: 'Material not found' });

    // Only the poster or admin can delete
    if (material.posted_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this material' });
    }

    await studyMaterialModel.deleteById(id);
    res.json({ message: 'Material deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
