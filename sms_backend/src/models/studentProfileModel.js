const pool = require('../db/connection');

// Fields visible to advisor/hod (no bank/sensitive data)
const ADVISOR_SAFE_FIELDS = `
  sp.id, sp.user_id, sp.class_id, sp.roll_no,
  sp.dob, sp.gender, sp.blood_group, sp.address,
  sp.guardian_name, sp.guardian_phone, sp.guardian_email,
  sp.admission_no, sp.admission_date, sp.aadhaar_no, sp.nationality, sp.religion, sp.caste_category,
  sp.father_name, sp.father_phone, sp.father_email,
  sp.mother_name, sp.mother_phone, sp.mother_email, sp.annual_income,
  sp.emergency_contact_name, sp.emergency_contact_phone,
  sp.previous_school,
  sp.medical_conditions, sp.allergies,
  sp.hostel_status, sp.transportation_mode,
  sp.isverified,
  u.full_name, u.email, u.phone,
  c.name AS class_name, c.dept_id,
  sah.current_semester,
  sah.current_year,
  ('Semester ' || sah.current_semester) AS current_semester_name,
  a1.full_name AS advisor1_name,
  a2.full_name AS advisor2_name,
  u.is_active
`;

// Full fields including bank and sensitive data (student own view / admin)
const FULL_FIELDS = `
  ${ADVISOR_SAFE_FIELDS},
  sp.bank_name, sp.branch_name, sp.account_no, sp.ifsc_code
`;

// Get profile by user_id (student views own profile — full fields)
const getFullProfile = async (user_id) => {
  const { rows } = await pool.query(
    `SELECT ${FULL_FIELDS}
     FROM student_profiles sp
     JOIN users u ON u.id = sp.user_id
     JOIN classes c ON c.id = sp.class_id
     LEFT JOIN student_academic_history sah ON sah.student_id = u.id AND sah.is_active = true
     LEFT JOIN users a1 ON a1.id = sah.advisor1_id
     LEFT JOIN users a2 ON a2.id = sah.advisor2_id
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
     LEFT JOIN users a1 ON a1.id = sah.advisor1_id
     LEFT JOIN users a2 ON a2.id = sah.advisor2_id
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
     LEFT JOIN users a1 ON a1.id = sah.advisor1_id
     LEFT JOIN users a2 ON a2.id = sah.advisor2_id
     WHERE sah.class_id = $1
     ORDER BY sp.roll_no ASC`,
    [class_id]
  );
  return rows;
};

const getPendingStudentsByClass = async (class_id) => {
  const { rows } = await pool.query(
    `SELECT sp.id, sp.user_id, sp.class_id, sp.roll_no,
            u.full_name, u.email, u.phone, u.created_at, u.is_active,
            c.name AS class_name
     FROM student_profiles sp
     JOIN users u ON u.id = sp.user_id
     JOIN classes c ON c.id = sp.class_id
     WHERE sp.class_id = $1 AND u.is_approved = FALSE
     ORDER BY sp.roll_no ASC`,
    [class_id]
  );
  return rows;
};

const updateProfile = async (user_id, fields) => {
  const {
    dob, gender, blood_group, address,
    guardian_name, guardian_phone, guardian_email,
    admission_no, admission_date, aadhaar_no, nationality, religion, caste_category,
    father_name, father_phone, father_email,
    mother_name, mother_phone, mother_email, annual_income,
    emergency_contact_name, emergency_contact_phone,
    previous_school,
    medical_conditions, allergies,
    hostel_status, transportation_mode,
    bank_name, branch_name, account_no, ifsc_code,
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
       
       admission_no = COALESCE($8, admission_no),
       admission_date = COALESCE($9, admission_date),
       aadhaar_no = COALESCE($10, aadhaar_no),
       nationality = COALESCE($11, nationality),
       religion = COALESCE($12, religion),
       caste_category = COALESCE($13, caste_category),
       
       father_name = COALESCE($14, father_name),
       father_phone = COALESCE($15, father_phone),
       father_email = COALESCE($16, father_email),
       
       mother_name = COALESCE($17, mother_name),
       mother_phone = COALESCE($18, mother_phone),
       mother_email = COALESCE($19, mother_email),
       annual_income = COALESCE($20, annual_income),
       
       emergency_contact_name = COALESCE($21, emergency_contact_name),
       emergency_contact_phone = COALESCE($22, emergency_contact_phone),
       
       previous_school = COALESCE($23, previous_school),
       
       medical_conditions = COALESCE($24, medical_conditions),
       allergies = COALESCE($25, allergies),
       
       hostel_status = COALESCE($26, hostel_status),
       transportation_mode = COALESCE($27, transportation_mode),
       
       bank_name = COALESCE($28, bank_name),
       branch_name = COALESCE($29, branch_name),
       account_no = COALESCE($30, account_no),
       ifsc_code = COALESCE($31, ifsc_code),
       
       updated_at = NOW()
     WHERE user_id = $32
     RETURNING *`,
    [
      dob || null, gender || null, blood_group || null, address || null,
      guardian_name || null, guardian_phone || null, guardian_email || null,
      admission_no || null, admission_date || null, aadhaar_no || null, nationality || null, religion || null, caste_category || null,
      father_name || null, father_phone || null, father_email || null,
      mother_name || null, mother_phone || null, mother_email || null, annual_income || null,
      emergency_contact_name || null, emergency_contact_phone || null,
      previous_school || null,
      medical_conditions || null, allergies || null,
      hostel_status || null, transportation_mode || null,
      bank_name || null, branch_name || null, account_no || null, ifsc_code || null,
      user_id
    ]
  );
  return rows[0];
};

const updateVerificationStatus = async (user_id, status) => {
    const { rows } = await pool.query(
        `UPDATE student_profiles SET isverified = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *`,
        [status, user_id]
    );
    return rows[0];
};

module.exports = { getFullProfile, getSafeProfile, getStudentsByClass, getPendingStudentsByClass, updateProfile, updateVerificationStatus };
