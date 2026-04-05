const departmentModel = require('../models/departmentModel');
const logAudit = require('../utils/auditLogger');

const getAllDepartments = async (req, res) => {
  try {
    const deps = await departmentModel.getAllDepartments();
    // Non-admins can only see their own department
    if (req.user.role !== 'admin') {
      const filtered = deps.filter(d => d.id === req.user.dept_id);
      return res.json(filtered);
    }
    res.json(deps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createDepartment = async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'name and code are required' });
    }

    const dept = await departmentModel.createDepartment({
      name: name.trim(),
      code: code.toUpperCase().trim().replace(/[^A-Z0-9]/g, '').slice(0, 10)
    });

    await logAudit(req.user.id, 'DEPARTMENT_CREATED', 'department', dept.id, null, { name: dept.name, code: dept.code });

    res.status(201).json(dept);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Department code already exists' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const assignHOD = async (req, res) => {
  try {
    const { hod_id } = req.body;
    const { id } = req.params;
    if (!hod_id) return res.status(400).json({ error: 'hod_id is required' });

    const existing = await departmentModel.getDepartmentById(id);
    if (!existing) return res.status(404).json({ error: 'Department not found' });

    const oldHodId = await departmentModel.assignHOD(id, hod_id);

    await logAudit(req.user.id, 'HOD_ASSIGNED', 'department', id,
      { hod_id: oldHodId },
      { hod_id }
    );

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
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getAllDepartments, createDepartment, assignHOD, getClassesInDepartment };
