const pool = require('../db/connection');

const StudentModel = {
  getAllStudents: async (class_id = null) => {
    let query = `
      SELECT u.id, u.username, u.full_name, u.email, u.phone, u.is_active,
             p.roll_no, p.class_id, p.dob, p.gender, p.blood_group, p.address,
             p.guardian_name, p.guardian_phone, p.isverified
      FROM users u
      JOIN student_profiles p ON p.user_id = u.id
      WHERE u.role = 'student' AND u.is_active = true
    `;
    const params = [];
    if (class_id) {
      params.push(class_id);
      query += ` AND p.class_id = $${params.length}`;
    }
    query += ' ORDER BY p.roll_no ASC';

    const { rows } = await pool.query(query, params);
    return rows;
  },

  getStudentById: async (id) => {
    const { rows } = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.email, u.phone, u.must_change_password,
              p.roll_no, p.class_id, p.dob, p.gender, p.blood_group, p.address,
              p.guardian_name, p.guardian_phone, p.guardian_email, p.isverified
       FROM users u
       JOIN student_profiles p ON p.user_id = u.id
       WHERE u.id = $1 AND u.role = 'student'`,
      [id]
    );
    return rows[0];
  },

  updateStudentProfile: async (user_id, profileData) => {
    const { roll_no, class_id, dob, gender, blood_group, address,
            guardian_name, guardian_phone, guardian_email,
            bank_name, account_no, ifsc_code } = profileData;

    const { rows } = await pool.query(
      `UPDATE student_profiles
       SET roll_no = COALESCE($2, roll_no),
           class_id = COALESCE($3, class_id),
           dob = COALESCE($4, dob),
           gender = COALESCE($5, gender),
           blood_group = COALESCE($6, blood_group),
           address = COALESCE($7, address),
           guardian_name = COALESCE($8, guardian_name),
           guardian_phone = COALESCE($9, guardian_phone),
           guardian_email = COALESCE($10, guardian_email),
           bank_name = COALESCE($11, bank_name),
           account_no = COALESCE($12, account_no),
           ifsc_code = COALESCE($13, ifsc_code),
           updated_at = NOW()
       WHERE user_id = $1 RETURNING *`,
      [user_id, roll_no, class_id, dob, gender, blood_group, address,
       guardian_name, guardian_phone, guardian_email,
       bank_name, account_no, ifsc_code]
    );
    return rows[0];
  },

  createStudentProfile: async (user_id, class_id, roll_no) => {
    const { rows } = await pool.query(
      `INSERT INTO student_profiles (user_id, class_id, roll_no)
       VALUES ($1, $2, $3) RETURNING *`,
      [user_id, class_id, roll_no]
    );
    return rows[0];
  },

  verifyStudent: async (user_id) => {
    const { rows } = await pool.query(
      `UPDATE student_profiles SET isverified = 1, updated_at = NOW() WHERE user_id = $1 RETURNING *`,
      [user_id]
    );
    return rows[0];
  },

  addToAcademicHistory: async (student_id, class_id) => {
    const classData = await pool.query('SELECT semester_id, current_year_number, current_semester_number, advisor1_id, advisor2_id FROM classes WHERE id = $1', [class_id]);
    if (classData.rows.length > 0) {
       const cls = classData.rows[0];
       await pool.query(`
         INSERT INTO student_academic_history (student_id, class_id, semester_id, current_year, current_semester, advisor1_id, advisor2_id, remarks)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'Initial Admission')
       `, [student_id, class_id, cls.semester_id, cls.current_year_number, cls.current_semester_number, cls.advisor1_id, cls.advisor2_id]);
    }
  }
};

module.exports = StudentModel;
