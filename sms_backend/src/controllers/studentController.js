const StudentModel = require("../models/studentModel");

const StudentController = {
  getAllStudents: async (req, res) => {
    try {
      const class_id = req.query.class_id || null;
      const students = await StudentModel.getAllStudents(class_id);
      res.json(students);
    } catch (err) {
      res.status(500).json({ message: "Error fetching students", error: err.message });
    }
  },

  getStudentById: async (req, res) => {
    try {
      const student = await StudentModel.getStudentById(req.params.id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (err) {
      res.status(500).json({ message: "Error fetching student", error: err.message });
    }
  },

  updateStudentProfile: async (req, res) => {
    try {
      const updated = await StudentModel.updateStudentProfile(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Student profile not found" });
      }
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Error updating student", error: err.message });
    }
  },

  createStudentProfile: async (req, res) => {
    try {
      const { user_id, class_id, roll_no } = req.body;
      if (!user_id || !class_id || !roll_no) {
        return res.status(400).json({ message: "user_id, class_id, and roll_no are required" });
      }
      const profile = await StudentModel.createStudentProfile(user_id, class_id, roll_no);
      res.status(201).json(profile);
    } catch (err) {
      if (err.code === '23505') {
        return res.status(400).json({ message: "Duplicate entry: user already has a profile or roll_no already exists" });
      }
      res.status(500).json({ message: "Error creating student profile", error: err.message });
    }
  }
};

module.exports = StudentController;
