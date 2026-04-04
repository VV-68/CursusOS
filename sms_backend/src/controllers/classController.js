const classModel = require('../models/classModel');
const { logAudit } = require('./userController');

const getAllClasses = async (req, res) => {
  try {
    const classes = await classModel.getAllClasses();
    
    // admin sees all; hod sees own dept; advisor sees own classes
    const { role, dept_id, id } = req.user;
    
    let filtered_classes = classes;
    if (role === 'hod') {
      filtered_classes = classes.filter(c => c.dept_id === dept_id);
    } else if (role === 'advisor') {
      filtered_classes = classes.filter(c => c.advisor1_id === id || c.advisor2_id === id);
    } else if (role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    res.json(filtered_classes);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createClass = async (req, res) => {
  try {
    const newClass = await classModel.createClass(req.body);
    res.status(201).json(newClass);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const assignAdvisors = async (req, res) => {
  try {
    // hod only, must verify class belongs to their dept
    const { advisor1_id, advisor2_id } = req.body;
    
    // Fetch class to verify dept_id
    const allClasses = await classModel.getAllClasses();
    const classObj = allClasses.find(c => c.id === req.params.id);
    
    if (!classObj) return res.status(404).json({ error: 'Class not found' });
    
    if (req.user.role === 'hod' && classObj.dept_id !== req.user.dept_id) {
      return res.status(403).json({ error: 'Forbidden. Not your department.' });
    }
    
    const old_value = { advisor1: classObj.advisor1_id, advisor2: classObj.advisor2_id };
    const new_value = { advisor1: advisor1_id, advisor2: advisor2_id };

    await classModel.assignAdvisors(req.params.id, advisor1_id, advisor2_id);
    await logAudit(req.user.id, 'ADVISOR_REASSIGNED', 'class', req.params.id, old_value, new_value);
    
    res.json({ message: 'Advisors assigned successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getStudentsInClass = async (req, res) => {
  try {
    const students = await classModel.getStudentsInClass(req.params.id);
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllClasses,
  createClass,
  assignAdvisors,
  getStudentsInClass
};
