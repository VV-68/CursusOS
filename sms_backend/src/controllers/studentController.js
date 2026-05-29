const StudentModel = require("../models/studentModel");
const userModel = require("../models/userModel");
const { hashPassword, generateDefaultStudentPassword } = require("../utils/passwordUtils");
const pool = require("../db/connection");
const { parse } = require('csv-parse/sync');
const xlsx = require('xlsx');

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
      const { full_name, email, class_id, roll_no, phone } = req.body;

      if (!full_name || !email || !class_id || !roll_no) {
        return res.status(400).json({ message: "full_name, email, class_id, and roll_no are required" });
      }

      if (req.user.role === 'advisor') {
         const { rows } = await pool.query('SELECT 1 FROM classes WHERE id = $1 AND (advisor1_id = $2 OR advisor2_id = $2)', [class_id, req.user.id]);
         if (rows.length === 0) return res.status(403).json({ message: 'Not authorized for this class' });
      }

      const emailLower = email.trim().toLowerCase();
      
      const defaultPassword = generateDefaultStudentPassword(full_name);
      const password_hash = await hashPassword(defaultPassword);

      const { rows: classRows } = await pool.query('SELECT dept_id FROM classes WHERE id = $1', [class_id]);
      if (classRows.length === 0) return res.status(404).json({ message: "Class not found" });
      const dept_id = classRows[0].dept_id;

      let authUser;
      try {
        authUser = await userModel.createUser({
          username: emailLower,
          full_name: full_name.trim(),
          role: 'student',
          dept_id: dept_id,
          email: emailLower,
          phone: phone || null,
          password_hash,
          is_approved: req.user.role !== 'advisor'
        });
      } catch (err) {
         if (err.code === '23505') {
            return res.status(400).json({ message: "Duplicate entry: email already exists in system" });
         }
         throw err;
      }

      const profile = await StudentModel.createStudentProfile(authUser.id, class_id, roll_no.trim());

      res.status(201).json({ message: 'Student created successfully', user: authUser, profile });
    } catch (err) {
      if (err.code === '23505') {
        return res.status(400).json({ message: "Duplicate entry: roll_no already exists" });
      }
      res.status(500).json({ message: "Error creating student profile", error: err.message });
    }
  },
  
  verifyStudent: async (req, res) => {
    try {
      const student_id = req.params.id;

      if (req.user.role === 'advisor') {
         const { rows } = await pool.query(`
           SELECT 1 FROM student_profiles sp
           JOIN classes c ON sp.class_id = c.id
           WHERE sp.user_id = $1 AND (c.advisor1_id = $2 OR c.advisor2_id = $2)
         `, [student_id, req.user.id]);
         if (rows.length === 0) return res.status(403).json({ message: 'Not authorized to verify this student' });
      }

      const profile = await StudentModel.verifyStudent(student_id);
      if (!profile) return res.status(404).json({ message: "Profile not found" });

      res.json({ message: "Student verified successfully", profile });
    } catch (err) {
      res.status(500).json({ message: "Error verifying student", error: err.message });
    }
  },

  completeProfile: async (req, res) => {
    try {
      if (req.user.role !== 'student') {
        return res.status(403).json({ message: "Only students can complete profile" });
      }

      const { new_password, phone, dob, gender, blood_group, address, guardian_name, guardian_phone, bank_name, account_no, ifsc_code } = req.body;

      if (!new_password) {
        return res.status(400).json({ message: "New password is required" });
      }

      if (new_password.length < 8 || !/[A-Z]/.test(new_password) || !/[0-9]/.test(new_password)) {
        return res.status(400).json({ message: "Password must be at least 8 chars, contain 1 uppercase and 1 number" });
      }

      const hash = await hashPassword(new_password);
      await userModel.changePassword(req.user.id, hash);

      if (phone) {
        await pool.query('UPDATE users SET phone = $1 WHERE id = $2', [phone, req.user.id]);
      }

      await StudentModel.updateStudentProfile(req.user.id, {
        dob, gender, blood_group, address, guardian_name, guardian_phone, bank_name, account_no, ifsc_code
      });

      res.json({ message: "Profile completed successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error completing profile", error: err.message });
    }
  },

  bulkUploadStudents: async (req, res) => {
    try {
      const { class_id } = req.body;
      if (!class_id) return res.status(400).json({ message: "class_id is required" });

      if (req.user.role === 'advisor') {
         const { rows } = await pool.query('SELECT 1 FROM classes WHERE id = $1 AND (advisor1_id = $2 OR advisor2_id = $2)', [class_id, req.user.id]);
         if (rows.length === 0) return res.status(403).json({ message: 'Not authorized for this class' });
      }

      if (!req.file) return res.status(400).json({ message: "No file uploaded" });

      const { rows: classRows } = await pool.query('SELECT dept_id FROM classes WHERE id = $1', [class_id]);
      if (classRows.length === 0) return res.status(404).json({ message: "Class not found" });
      const dept_id = classRows[0].dept_id;

      let records = [];
      const mimetype = req.file.mimetype;
      const buffer = req.file.buffer;

      if (mimetype === 'text/csv' || req.file.originalname.endsWith('.csv')) {
        records = parse(buffer, { columns: true, skip_empty_lines: true });
      } else if (mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || req.file.originalname.endsWith('.xlsx')) {
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        records = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
      } else {
        return res.status(400).json({ message: "Invalid file format. Use CSV or XLSX" });
      }

      let created = 0;
      let skipped = 0;
      let errors = [];

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        
        const row = {};
        for(const k in record) {
          row[k.trim().toLowerCase()] = typeof record[k] === 'string' ? record[k].trim() : record[k];
        }

        const name = row['name'] || row['full name'] || row['student name'];
        const email = row['email'];
        const roll_no = row['roll no'] || row['rollno'] || row['roll_no'];

        if (!name || !email || !roll_no) {
          skipped++;
          errors.push(`Row ${i+2}: Missing required fields (Name, Email, Roll No)`);
          continue;
        }

        const emailLower = email.toLowerCase();
        const defaultPassword = generateDefaultStudentPassword(name);
        const password_hash = await hashPassword(defaultPassword);

        try {
          const authUser = await userModel.createUser({
            username: emailLower,
            full_name: name,
            role: 'student',
            dept_id: dept_id,
            email: emailLower,
            phone: row['phone'] || null,
            password_hash,
            is_approved: req.user.role !== 'advisor'
          });

          await StudentModel.createStudentProfile(authUser.id, class_id, roll_no.toString());
          created++;
        } catch(err) {
          skipped++;
          errors.push(`Row ${i+2} (${email}, ${roll_no}): Duplicate email or roll no.`);
        }
      }

      res.json({ total: records.length, created, skipped, errors });
    } catch(err) {
      console.error(err);
      res.status(500).json({ message: "Error parsing bulk upload", error: err.message });
    }
  }
};

module.exports = StudentController;
