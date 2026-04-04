const StudentModel = require("../models/studentModel");

const StudentController = {
addStudent: (req, res) => {
  const { id, name, department, marks } = req.body;

  if (!id || !name) {
    return res.status(400).json({
      message: "ID and name are required"
    });
  }

  StudentModel.addStudent(
    { id, name, department, marks },
    (err, result) => {
      if (err) {
        // MySQL duplicate key error
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({
            message: "Student with this ID already exists"
          });
        }

        return res.status(500).json({
          message: "Error adding student",
          error: err.message
        });
      }

      res.status(201).json({
        message: "Student added successfully"
      });
    }
  );
}
,
searchByName: (req, res) => {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({
      message: "Name query parameter is required"
    });
  }

  StudentModel.searchByName(name, (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Error searching students",
        error: err.message
      });
    }

    res.json(results);
  });
}
,
  getAllStudents: (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const department = req.query.department;
  const sort = req.query.sort;

  StudentModel.getAllStudents(
    page,
    limit,
    department,
    sort,
    (err, results) => {
      if (err) {
        return res.status(500).json({
          message: "Error fetching students",
          error: err.message
        });
      }

      res.json(results);
    }
  );
}

,
getStudentById: (req, res) => {
  const { id } = req.params;

  StudentModel.getStudentById(id, (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Error fetching student",
        error: err.message
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    res.json(results[0]);
  });
},
deleteStudent: (req, res) => {
  const { id } = req.params;

  StudentModel.deleteStudent(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Error deleting student",
        error: err.message
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    res.json({
      message: "Student deleted successfully"
    });
  });
},
updateStudent: (req, res) => {
  const { id } = req.params;
  const { name, department, marks } = req.body;

  StudentModel.updateStudent(
    id,
    { name, department, marks },
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Error updating student",
          error: err.message
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Student not found"
        });
      }

      res.json({
        message: "Student updated successfully"
      });
    }
  );
}


};

module.exports = StudentController;
