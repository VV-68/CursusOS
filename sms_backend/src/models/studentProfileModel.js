const pool = require('../db/connection');

// Fields visible to advisor/hod (no bank/sensitive data)
const ADVISOR_SAFE_FIELDS = `
  sp.id, sp.user_id, sp.class_id, sp.roll_no,
  sp.dob, sp.gender, sp.blood_group, sp.address,
  sp.guardian_name, sp.guardian_phone, sp.guardian_email,
  sp.mother_name, sp.mother_phone,
  sp.emergency_contact_name, sp.emergency_contact_phone,
  sp.nationality, sp.religion, sp.caste_category,
  sp.previous_school, sp.profile_completed,
  u.full_name, u.email, u.phone,
  c.name AS class_name
`;

// Full fields including bank and sensitive data (student own view / admin)
const FULL_FIELDS = `
  ${ADVISOR_SAFE_FIELDS},
  sp.bank_name, sp.account_no, sp.ifsc_code, sp.aadhar_no
`;

// Get profile by user_id (student views own profile — full fields)
const getFullProfile = async (user_id) => {
  const { rows } = await pool.query(
    `SELECT ${FULL_FIELDS}
     FROM student_profiles sp
     JOIN users u ON u.id = sp.user_id
     JOIN classes c ON c.id = sp.class_id
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
     JOIN classes c ON c.id = sp.class_id
     WHERE sp.class_id = $1 AND u.is_active = TRUE
     ORDER BY sp.roll_no ASC`,
    [class_id]
  );
  return rows;
};

// Student updates their own profile
const updateProfile = async (user_id, fields) => {
  const {
    dob, gender, blood_group, address,
    guardian_name, guardian_phone, guardian_email,
    mother_name, mother_phone,
    emergency_contact_name, emergency_contact_phone,
    nationality, religion, caste_category,
    previous_school, aadhar_no,
    bank_name, account_no, ifsc_code,
  } = fields;

  // Check if all required fields are filled for profile_completed
  const profile_completed = !!(dob && gender && guardian_name && guardian_phone && address);

  const { rows } = await pool.query(
    `UPDATE student_profiles SET
       dob = COALESCE($1, dob),
       gender = COALESCE($2, gender),
       blood_group = COALESCE($3, blood_group),
       address = COALESCE($4, address),
       guardian_name = COALESCE($5, guardian_name),
       guardian_phone = COALESCE($6, guardian_phone),
       guardian_email = COALESCE($7, guardian_email),
       mother_name = COALESCE($8, mother_name),
       mother_phone = COALESCE($9, mother_phone),
       emergency_contact_name = COALESCE($10, emergency_contact_name),
       emergency_contact_phone = COALESCE($11, emergency_contact_phone),
       nationality = COALESCE($12, nationality),
       religion = COALESCE($13, religion),
       caste_category = COALESCE($14, caste_category),
       previous_school = COALESCE($15, previous_school),
       aadhar_no = COALESCE($16, aadhar_no),
       bank_name = COALESCE($17, bank_name),
       account_no = COALESCE($18, account_no),
       ifsc_code = COALESCE($19, ifsc_code),
       profile_completed = $20,
       updated_at = NOW()
     WHERE user_id = $21
     RETURNING *`,
    [
      dob || null, gender || null, blood_group || null, address || null,
      guardian_name || null, guardian_phone || null, guardian_email || null,
      mother_name || null, mother_phone || null,
      emergency_contact_name || null, emergency_contact_phone || null,
      nationality || null, religion || null, caste_category || null,
      previous_school || null, aadhar_no || null,
      bank_name || null, account_no || null, ifsc_code || null,
      profile_completed, user_id
    ]
  );
  return rows[0];
};

module.exports = { getFullProfile, getSafeProfile, getStudentsByClass, updateProfile };
