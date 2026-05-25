const classModel = require('../models/classModel');
const logAudit = require('../utils/auditLogger');

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

const getUnrestrictedClasses = async (req, res) => {
  try {
    const classes = await classModel.getAllClasses();
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createClass = async (req, res) => {
  try {
    const { name, year, section, dept_id, semester_id } = req.body;
    
    // If HOD, they can only create class for their own department
    if (req.user.role === 'hod' && req.user.dept_id !== dept_id) {
      return res.status(403).json({ error: 'Forbidden. You can only create classes for your own department.' });
    }

    const newClass = await classModel.createClass({ name, year, section, dept_id, semester_id });
    res.status(201).json(newClass);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const assignAdvisors = async (req, res) => {
  try {
    console.log('[assignAdvisors] req.params.id:', req.params.id);
    console.log('[assignAdvisors] req.body:', req.body);

    // hod only, must verify class belongs to their dept
    let { advisor1_id, advisor2_id } = req.body;
    
    // Convert empty strings to null for UUID foreign key constraints
    advisor1_id = advisor1_id || null;
    advisor2_id = advisor2_id || null;
    
    console.log('[assignAdvisors] after parsing - advisor1_id:', advisor1_id, 'advisor2_id:', advisor2_id);
    
    // Fetch class to verify dept_id
    const allClasses = await classModel.getAllClasses();
    const classObj = allClasses.find(c => c.id === req.params.id);
    
    if (!classObj) return res.status(404).json({ error: 'Class not found' });
    console.log('[assignAdvisors] class exists, dept check...', { classDept: classObj.dept_id, userDept: req.user.dept_id });
    
    if (req.user.role === 'hod' && classObj.dept_id !== req.user.dept_id) {
      return res.status(403).json({ error: 'Forbidden. Not your department.' });
    }
    
    const old_value = { advisor1: classObj.advisor1_id, advisor2: classObj.advisor2_id };
    const new_value = { advisor1: advisor1_id, advisor2: advisor2_id };

    console.log('[assignAdvisors] proceeding to update DB...');
    try {
      const updatedClass = await classModel.assignAdvisors(req.params.id, advisor1_id, advisor2_id);
      console.log('[assignAdvisors] database update successful:', updatedClass);
    } catch (dbErr) {
      console.error('[assignAdvisors] database update failed!', dbErr);
      throw dbErr;
    }

    console.log('[assignAdvisors] logging audit...');
    await logAudit(req.user.id, 'ADVISOR_REASSIGNED', 'class', req.params.id, old_value, new_value);
    
    res.json({ message: 'Advisors assigned successfully' });
  } catch (err) {
    console.error('[assignAdvisors] Caught Error in Controller:', err);
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

const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, year, section, semester_id } = req.body;

    const allClasses = await classModel.getAllClasses();
    const classObj = allClasses.find(c => c.id === id);
    if (!classObj) return res.status(404).json({ error: 'Class not found' });

    if (req.user.role === 'hod' && classObj.dept_id !== req.user.dept_id) {
      return res.status(403).json({ error: 'Forbidden. Not your department.' });
    }

    const updatedClass = await classModel.updateClass(id, { name, year, section, semester_id });
    res.json(updatedClass);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    const allClasses = await classModel.getAllClasses();
    const classObj = allClasses.find(c => c.id === id);
    if (!classObj) return res.status(404).json({ error: 'Class not found' });

    if (req.user.role === 'hod' && classObj.dept_id !== req.user.dept_id) {
      return res.status(403).json({ error: 'Forbidden. Not your department.' });
    }

    await classModel.deleteClass(id);
    res.json({ message: 'Class deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllClasses,
  getUnrestrictedClasses,
  createClass,
  assignAdvisors,
  getStudentsInClass,
  updateClass,
  deleteClass
};
