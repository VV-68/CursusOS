const db = require("../db/connection");

const StudentModel = {
  addStudent: (student, callback) => {
    const { id, name, department, marks } = student;

    const sql = `
      INSERT INTO students (id, name, department, marks)
      VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [id, name, department, marks], callback);
    
  },
  getAllStudents: (page, limit, department, sort, callback) => {
  const offset = (page - 1) * limit;

  let sql = "SELECT * FROM students";
  const params = [];

  // Filter by department
  if (department) {
    sql += " WHERE department = ?";
    params.push(department);
  }

  // Sort by marks
  if (sort === "marks") {
    sql += " ORDER BY marks DESC";
  }

  // Pagination
  sql += " LIMIT ? OFFSET ?";
  params.push(limit, offset);

  db.query(sql, params, callback);
}

,
getStudentById: (id, callback) => {
  const sql = "SELECT * FROM students WHERE id = ?";
  db.query(sql, [id], callback);
}
,
deleteStudent: (id, callback) => {
  const sql = "DELETE FROM students WHERE id = ?";
  db.query(sql, [id], callback);
},
searchByName: (name, callback) => {
  const sql = "SELECT * FROM students WHERE name LIKE ?";
  db.query(sql, [`%${name}%`], callback);
}
,
updateStudent: (id, student, callback) => {
  const { name, department, marks } = student;

  const sql = `
    UPDATE students
    SET name = ?, department = ?, marks = ?
    WHERE id = ?
  `;

  db.query(sql, [name, department, marks, id], callback);
}


};

module.exports = StudentModel;
