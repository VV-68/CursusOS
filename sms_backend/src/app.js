require("dotenv").config();
const express = require("express");
const cors = require("cors");

require("./db/connection");

const studentRoutes = require("./routes/studentRoutes");

const app = express();
app.use(cors());
app.use(express.json());

// Check UUID params
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
app.use((req, res, next) => {
  // If any route parameter matching _id or id is not a UUID, return 400
  // Note: we can't inspect req.params here easily because they are attached by routers.
  // We'll intercept it via app.param or generic regex on req.path
  next();
});

// UUID param validation across all routes
app.param('id', (req, res, next, id) => {
  if (!UUID_REGEX.test(id)) return res.status(400).json({ error: 'Invalid ID format' });
  next();
});
app.param('student_id', (req, res, next, id) => {
  if (!UUID_REGEX.test(id)) return res.status(400).json({ error: 'Invalid ID format' });
  next();
});
app.param('class_id', (req, res, next, id) => {
  if (!UUID_REGEX.test(id)) return res.status(400).json({ error: 'Invalid ID format' });
  next();
});
app.param('course_assignment_id', (req, res, next, id) => {
  if (!UUID_REGEX.test(id)) return res.status(400).json({ error: 'Invalid ID format' });
  next();
});
app.param('assignment_id', (req, res, next, id) => {
  if (!UUID_REGEX.test(id)) return res.status(400).json({ error: 'Invalid ID format' });
  next();
});
app.param('submission_id', (req, res, next, id) => {
  if (!UUID_REGEX.test(id)) return res.status(400).json({ error: 'Invalid ID format' });
  next();
});

const authRoutes = require("./routes/authRoutes");
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Student Management API is running");
});

// routes
const userRoutes = require("./routes/userRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const classRoutes = require("./routes/classRoutes");
const courseRoutes = require("./routes/courseRoutes");
const timetableRoutes = require("./routes/timetableRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const marksRoutes = require("./routes/marksRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const noticeRoutes = require("./routes/noticeRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const studyMaterialRoutes = require("./routes/studyMaterialRoutes");
const profileRoutes = require("./routes/profileRoutes");


app.use("/api/users", userRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/marks", marksRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/study-materials", studyMaterialRoutes);
app.use("/api/profile", profileRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.message === 'File type not allowed') {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
