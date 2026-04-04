const express = require("express");
const cors = require("cors");

require("./db/connection");

const studentRoutes = require("./routes/studentRoutes");

const app = express();
app.use(cors());
app.use(express.json());

const authRoutes = require("./routes/authRoutes");
app.use("/auth", authRoutes);


app.get("/", (req, res) => {
  res.send("Student Management API is running");
});

// students API
app.use("/students", studentRoutes);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
