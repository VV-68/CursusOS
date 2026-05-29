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
      classId, newSemesterId, newYear, newSemesterNumber, newAdvisor1, newAdvisor2, remarks, req.user?.id
    );
    
    res.status(200).json({ message: 'Class promoted successfully', data: result });
  } catch (err) {
    console.error('Error promoting class:', err);
    res.status(500).json({ error: 'Failed to promote class' });
  }
};

const requestBatchPromotion = async (req, res) => {
  try {
    const { batchId, remarks } = req.body;
    const result = await progressionService.createBatchPromotionRequest({
      batchId,
      requestedBy: req.user.id,
      remarks,
    });
    res.status(201).json({ message: 'Batch promotion request created', data: result });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to create promotion request' });
  }
};

const directPromoteBatch = async (req, res) => {
  try {
    const { batchId } = req.body;
    const result = await progressionService.directPromoteOddToEven(batchId, req.user.id);
    res.status(200).json({ message: 'Batch promoted to even semester directly', data: result });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to promote batch' });
  }
};

const reviewBatchPromotion = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { approve, remarks } = req.body;
    const result = await progressionService.applyPromotion(requestId, req.user.id, !!approve, remarks);
    res.status(200).json({ message: `Promotion request ${approve ? 'approved' : 'rejected'}`, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to review promotion request' });
  }
};

const listBatchPromotionRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const result = await progressionService.listPromotionRequests(status || null);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list promotion requests' });
  }
};

const requestBatchDeactivation = async (req, res) => {
  try {
    const { batchId, reason } = req.body;
    const result = await progressionService.createBatchDeactivationRequest({
      batchId,
      requestedBy: req.user.id,
      reason,
    });
    res.status(201).json({ message: 'Batch deactivation request created', data: result });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to create deactivation request' });
  }
};

const reviewBatchDeactivation = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { approve } = req.body;
    const result = await progressionService.reviewBatchDeactivationRequest({
      requestId,
      reviewerId: req.user.id,
      approve: !!approve,
    });
    res.status(200).json({ message: `Deactivation request ${approve ? 'approved' : 'rejected'}`, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to review deactivation request' });
  }
};

const listBatchDeactivationRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const result = await progressionService.listDeactivationRequests(status || null);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list deactivation requests' });
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

const requestBatchReactivation = async (req, res) => {
  try {
    const { batchId, reason } = req.body;
    if (!batchId) {
      return res.status(400).json({ error: 'batchId is required' });
    }
    const result = await progressionService.createBatchReactivationRequest({
      batchId,
      requestedBy: req.user.id,
      reason,
    });
    res.status(201).json({ message: 'Batch reactivation request created successfully', data: result });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to create batch reactivation request' });
  }
};

const reviewBatchReactivation = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { approve } = req.body;
    const result = await progressionService.reviewBatchReactivationRequest({
      requestId,
      reviewerId: req.user.id,
      approve: !!approve,
    });
    res.status(200).json({ message: `Reactivation request ${approve ? 'approved' : 'rejected'}`, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to review reactivation request' });
  }
};

const listBatchReactivationRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const result = await progressionService.listReactivationRequests(status || null);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list reactivation requests' });
  }
};

module.exports = {
  promoteStudent,
  promoteClass,
  getStudentAcademicState,
  requestBatchPromotion,
  directPromoteBatch,
  reviewBatchPromotion,
  listBatchPromotionRequests,
  requestBatchDeactivation,
  reviewBatchDeactivation,
  listBatchDeactivationRequests,
  requestBatchReactivation,
  reviewBatchReactivation,
  listBatchReactivationRequests,
};

