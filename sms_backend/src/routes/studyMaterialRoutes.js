const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard     = require('../middleware/roleGuard');
const ctrl          = require('../controllers/studyMaterialController');

router.post('/',                           authMiddleware, roleGuard('faculty','advisor','hod'), ctrl.create);
router.get('/course/:course_assignment_id',authMiddleware, ctrl.list);
router.delete('/:id',                      authMiddleware, ctrl.remove);

module.exports = router;
