const express = require("express");
const router = express.Router();

const StudentController = require("../controllers/studentController");
const authMiddleware = require("../middleware/authMiddleware");
const roleGuard = require("../middleware/roleGuard");

// GET /api/students?class_id=xxx
router.get("/", authMiddleware, StudentController.getAllStudents);

// GET /api/students/:id
router.get("/:id", authMiddleware, StudentController.getStudentById);

// POST /api/students/profile — create student profile (admin only)
router.post("/profile", authMiddleware, roleGuard('admin'), StudentController.createStudentProfile);

// PUT /api/students/:id/profile — update student profile
router.put("/:id/profile", authMiddleware, StudentController.updateStudentProfile);

module.exports = router;
