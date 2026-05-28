const pool = require('../db/connection');

// Fields visible to advisor/hod (no bank/sensitive data)
const ADVISOR_SAFE_FIELDS = `
  sp.id, sp.user_id, sp.class_id, sp.roll_no,
  sp.dob, sp.gender, sp.blood_group, sp.address,
  sp.guardian_name, sp.guardian_phone, sp.guardian_email,
  sp.isverified,
  u.full_name, u.email, u.phone,
  c.name AS class_name,
  sah.current_semester,
  sah.current_year,
  sem.name AS current_semester_name
`;

// Full fields including bank and sensitive data (student own view / admin)
const FULL_FIELDS = `
  ${ADVISOR_SAFE_FIELDS},
  sp.bank_name, sp.account_no, sp.ifsc_code
`;

// Get profile by user_id (student views own profile — full fields)
const getFullProfile = async (user_id) => {
  const { rows } = await pool.query(
    `SELECT ${FULL_FIELDS}
     FROM student_profiles sp
     JOIN users u ON u.id = sp.user_id
     JOIN classes c ON c.id = sp.class_id
     LEFT JOIN student_academic_history sah ON sah.student_id = u.id AND sah.is_active = true
     LEFT JOIN semesters sem ON sem.id = sah.semester_id
     WHERE sp.user_id = $1`,
    [user_id]
  );
  return rows[0];
};

// Get profile without bank/sensitive fields (advisor/hod view)
const getSafeProfile = async (user_id) => {
  const { rows } = await pool.query(
    `SELECT ${ADVISOR_SAFE_FIELDS}
     FROM student_profiles sp
     JOIN users u ON u.id = sp.user_id
     JOIN classes c ON c.id = sp.class_id
     LEFT JOIN student_academic_history sah ON sah.student_id = u.id AND sah.is_active = true
     LEFT JOIN semesters sem ON sem.id = sah.semester_id
     WHERE sp.user_id = $1`,
    [user_id]
  );
  return rows[0];
};

// Get all students in a class (advisor view — no bank fields)
const getStudentsByClass = async (class_id) => {
  const { rows } = await pool.query(
    `SELECT ${ADVISOR_SAFE_FIELDS}
     FROM student_profiles sp
     JOIN users u ON u.id = sp.user_id
     JOIN student_academic_history sah ON sah.student_id = u.id AND sah.is_active = true
     JOIN classes c ON c.id = sah.class_id
     LEFT JOIN semesters sem ON sem.id = sah.semester_id
     WHERE sah.class_id = $1 AND u.is_active = TRUE
     ORDER BY sp.roll_no ASC`,
    [class_id]
  );
  return rows;
};

const updateProfile = async (user_id, fields) => {
  const {
    dob, gender, blood_group, address,
    guardian_name, guardian_phone, guardian_email,
    bank_name, account_no, ifsc_code,
  } = fields;

  const { rows } = await pool.query(
    `UPDATE student_profiles SET
       dob = COALESCE($1, dob),
       gender = COALESCE($2, gender),
       blood_group = COALESCE($3, blood_group),
       address = COALESCE($4, address),
       guardian_name = COALESCE($5, guardian_name),
       guardian_phone = COALESCE($6, guardian_phone),
       guardian_email = COALESCE($7, guardian_email),
       bank_name = COALESCE($8, bank_name),
       account_no = COALESCE($9, account_no),
       ifsc_code = COALESCE($10, ifsc_code),
       updated_at = NOW()
     WHERE user_id = $11
     RETURNING *`,
    [
      dob || null, gender || null, blood_group || null, address || null,
      guardian_name || null, guardian_phone || null, guardian_email || null,
      bank_name || null, account_no || null, ifsc_code || null,
      user_id
    ]
  );
  return rows[0];
};

module.exports = { getFullProfile, getSafeProfile, getStudentsByClass, updateProfile };
