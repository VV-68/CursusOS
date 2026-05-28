const progressionService = require('../services/progressionService');

const promoteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { newSemesterId, newYear, newSemesterNumber, newAdvisor1, newAdvisor2, remarks } = req.body;
    
    const result = await progressionService.promoteStudent(
      studentId, newSemesterId, newYear, newSemesterNumber, newAdvisor1, newAdvisor2, remarks
    );
    
    res.status(200).json({ message: 'Student promoted successfully', data: result });
  } catch (err) {
    console.error('Error promoting student:', err);
    res.status(500).json({ error: 'Failed to promote student' });
  }
};

const promoteClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { newSemesterId, newYear, newSemesterNumber, newAdvisor1, newAdvisor2, remarks } = req.body;
    
    const result = await progressionService.promoteClass(
      classId, newSemesterId, newYear, newSemesterNumber, newAdvisor1, newAdvisor2, remarks
    );
    
    res.status(200).json({ message: 'Class promoted successfully', data: result });
  } catch (err) {
    console.error('Error promoting class:', err);
    res.status(500).json({ error: 'Failed to promote class' });
  }
};

const getStudentAcademicState = async (req, res) => {
  try {
    const { studentId } = req.params;
    const state = await progressionService.getCurrentAcademicState(studentId);
    if (!state) {
      return res.status(404).json({ error: 'Academic state not found' });
    }
    res.status(200).json({ data: state });
  } catch (err) {
    console.error('Error fetching academic state:', err);
    res.status(500).json({ error: 'Failed to fetch academic state' });
  }
};

module.exports = {
  promoteStudent,
  promoteClass,
  getStudentAcademicState
};
