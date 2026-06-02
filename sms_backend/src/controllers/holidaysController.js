const holidaysModel = require('../models/holidaysModel');

const getHolidays = async (req, res) => {
  try {
    const { month, year, dept_id } = req.query;
    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }
    let targetDeptId = dept_id || null;
    if (req.user.role === 'hod') {
      targetDeptId = req.user.dept_id;
    }
    
    const holidays = await holidaysModel.getHolidays(req.user.institution_id, targetDeptId, month, year);
    res.json(holidays);
  } catch (err) {
    console.error('Error fetching holidays:', err);
    res.status(500).json({ error: 'Failed to fetch holidays' });
  }
};

const createHoliday = async (req, res) => {
  try {
    const { date, description, dept_id } = req.body;
    
    // Admin can create institution-wide or dept-specific.
    // HOD can only create dept-specific for their own department.
    let targetDeptId = dept_id || null;
    
    if (req.user.role === 'hod') {
      if (!req.user.dept_id) return res.status(403).json({ error: 'HOD has no department assigned' });
      targetDeptId = req.user.dept_id; // Override to HOD's dept
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only Admins and HODs can create holidays' });
    }
    
    // Check if holiday already exists
    const existing = await holidaysModel.getHolidayByDate(req.user.institution_id, targetDeptId, date);
    if (existing && existing.dept_id === targetDeptId) {
       return res.status(400).json({ error: 'Holiday already marked for this date and scope' });
    }

    const holiday = await holidaysModel.createHoliday(
      req.user.institution_id,
      targetDeptId,
      date,
      description,
      req.user.id
    );
    res.status(201).json(holiday);
  } catch (err) {
    console.error('Error creating holiday:', err);
    res.status(500).json({ error: 'Failed to create holiday' });
  }
};

const deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    
    const holiday = await holidaysModel.getHolidayById(id);
    if (!holiday) return res.status(404).json({ error: 'Holiday not found' });
    
    // Role checks
    if (req.user.role === 'hod') {
      if (holiday.created_by !== req.user.id) {
        return res.status(403).json({ error: 'You can only revert holidays you created' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only Admins and HODs can delete holidays' });
    }

    await holidaysModel.deleteHoliday(id, req.user.institution_id);
    res.json({ message: 'Holiday removed successfully' });
  } catch (err) {
    console.error('Error deleting holiday:', err);
    res.status(500).json({ error: 'Failed to delete holiday' });
  }
};

module.exports = {
  getHolidays,
  createHoliday,
  deleteHoliday
};
