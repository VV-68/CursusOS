const express = require("express");
const router = express.Router();

const StudentController = require("../controllers/studentController");
const authMiddleware = require("../middleware/authMiddleware");
const roleGuard = require("../middleware/roleGuard");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

// GET /api/students?class_id=xxx
router.get("/", authMiddleware, StudentController.getAllStudents);

// GET /api/students/:id
router.get("/:id", authMiddleware, StudentController.getStudentById);

// POST /api/students/profile — create student profile manually
router.post("/profile", authMiddleware, roleGuard('admin', 'advisor', 'hod'), StudentController.createStudentProfile);

// POST /api/students/bulk-upload
router.post("/bulk-upload", authMiddleware, roleGuard('admin', 'advisor', 'hod'), upload.single('file'), StudentController.bulkUploadStudents);

// PUT /api/students/:id/profile — update student profile
router.put("/:id/profile", authMiddleware, StudentController.updateStudentProfile);

// POST /api/students/:id/verify
router.post("/:id/verify", authMiddleware, roleGuard('admin', 'advisor', 'hod'), StudentController.verifyStudent);

// POST /api/students/complete-profile
router.post("/complete-profile", authMiddleware, roleGuard('student'), StudentController.completeProfile);

module.exports = router;
