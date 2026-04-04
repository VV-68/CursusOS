const express = require("express");
const router = express.Router();

const StudentController = require("../controllers/studentController");
const verifyToken = require("../middleware/authMiddleware");

router.post("/", verifyToken, StudentController.addStudent);
router.get("/", StudentController.getAllStudents);
router.get("/search", StudentController.searchByName);
router.get("/:id", StudentController.getStudentById);
router.put("/:id", verifyToken, StudentController.updateStudent);
router.delete("/:id", verifyToken, StudentController.deleteStudent);

module.exports = router;
