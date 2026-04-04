const departmentModel = require('../models/departmentModel');
const { logAudit } = require('./userController'); // Assuming we shared logAudit from userController or utils

const getAllDepartments = async (req, res) => {
  try {
    const deps = await departmentModel.getAllDepartments();
    // Non-admins can only see their own department data. This endpoint lists *all* for admin, 
    // or filters to just their own dept for others. BUT the prompt says "GET /api/departments -> list all, hod/advisor/faculty can read their own dept only"
    if (req.user.role !== 'admin') {
      const filtered = deps.filter(d => d.id === req.user.dept_id);
      return res.json(filtered);
    }
    res.json(deps);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createDepartment = async (req, res) => {
  try {
    const dept = await departmentModel.createDepartment(req.body);
    res.status(201).json(dept);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Department code already exists' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

const assignHOD = async (req, res) => {
  try {
    const { hod_id } = req.body;
    const oldHodId = await departmentModel.assignHOD(req.params.id, hod_id);
    await logAudit(req.user.id, 'HOD_ASSIGNED', 'department', req.params.id, oldHodId, hod_id);
    res.json({ message: 'HOD assigned successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getClassesInDepartment = async (req, res) => {
  try {
    const classes = await departmentModel.getClassesInDepartment(req.params.id);
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllDepartments,
  createDepartment,
  assignHOD,
  getClassesInDepartment
};
