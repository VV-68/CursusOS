const timetableModel = require('../models/timetableModel');
const classModel = require('../models/classModel');

const getTimetable = async (req, res) => {
  try {
    const { class_id } = req.params;
    const timetable = await timetableModel.getTimetable(class_id);
    res.json(timetable);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const replaceTimetable = async (req, res) => {
  try {
    const { class_id, slots } = req.body;
    
    // Validation: Advisor must own the class
    const classObj = (await classModel.getAllClasses()).find(c => c.id === class_id);
    if (!classObj) return res.status(404).json({ error: 'Class not found' });

    if (req.user.role === 'advisor' && req.user.id !== classObj.advisor1_id && req.user.id !== classObj.advisor2_id) {
      return res.status(403).json({ error: 'Forbidden. Not your class.' });
    }

    try {
      await timetableModel.replaceTimetable(class_id, slots);
    } catch (dbErr) {
      if (dbErr.code === '23505') {
        return res.status(400).json({ error: 'Timetable conflict on day and period' });
      }
      throw dbErr;
    }
    
    res.json({ message: 'Timetable updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getTimetable,
  replaceTimetable
};
