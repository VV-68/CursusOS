const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "sms_user",
  password: "Visakh@2026",
  database: "student_db"
});

db.connect((err) => {
  if (err) {
    console.log("MySQL connection error:", err);
  } else {
    console.log("Connected to MySQL");
  }
});

module.exports = db;
