const semesterModel = require('../models/semesterModel');

const getAllSemesters = async (req, res) => {
  try {
    const semesters = await semesterModel.getAllSemesters();
    res.json(semesters);
  } catch (err) {
    console.error('getAllSemesters error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getAllSemesters };
