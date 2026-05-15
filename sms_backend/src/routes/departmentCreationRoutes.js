const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/departmentCreationController');
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');

// Role middleware (dynamic)
router.use(authMiddleware);

// Draft management (must be before /:id to avoid route clash)
router.get('/draft', roleGuard('admin', 'hod'), ctrl.getDraft);
router.post('/draft', roleGuard('admin', 'hod'), ctrl.saveDraft);
router.delete('/draft', roleGuard('admin', 'hod'), ctrl.deleteDraft);

// Code validation
router.post('/validate-code', roleGuard('admin'), ctrl.validateCode);

// Full department creation
router.post('/', roleGuard('admin'), ctrl.createFullDepartment);

// Manage courses & faculty assignment (before /:id generic)
router.get('/:id/manage-courses', roleGuard('admin', 'hod'), ctrl.getManageCourses);
router.post('/:id/assign-faculty', roleGuard('hod'), ctrl.assignFaculty);

// Get full department details
router.get('/:id', roleGuard('admin', 'hod'), ctrl.getFullDepartment);

// Update full department details
router.put('/:id', roleGuard('admin', 'hod'), ctrl.updateFullDepartment);

// Delete department
router.delete('/:id', roleGuard('admin'), ctrl.deleteDepartment);

module.exports = router;
