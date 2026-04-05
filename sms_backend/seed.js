require('dotenv').config();
const pool = require('./src/db/connection');
const { hashDefault, hashPassword } = require('./src/utils/passwordUtils');

(async () => {
  try {
    const defaultHash = await hashDefault();
    const adminHash = await hashPassword('Admin@123'); // Admin gets ready-to-use password
    console.log('Generated bcrypt hashes.');

    // STEP 1: Create test semester
    console.log('1. Creating test semester...');
    await pool.query(`
      INSERT INTO semesters (name, academic_year, start_date, end_date, is_active)
      VALUES ('Odd 2024-25', '2024-25', '2024-07-01', '2024-11-30', TRUE)
      ON CONFLICT DO NOTHING
    `);

    // STEP 2: Create test department
    console.log('2. Creating test department...');
    await pool.query(`
      INSERT INTO departments (name, code)
      VALUES ('Computer Science and Engineering', 'CSE')
      ON CONFLICT (code) DO NOTHING
    `);

    // STEP 3: Create test users
    console.log('3. Creating test users...');

    // Admin (no dept, must_change_password = FALSE)
    await pool.query(`
      INSERT INTO users (username, password_hash, role, full_name, email, must_change_password, is_active)
      VALUES ('admin', $1, 'admin', 'System Administrator', 'admin@college.edu', FALSE, TRUE)
      ON CONFLICT (username) DO UPDATE SET password_hash = $1, must_change_password = FALSE
    `, [adminHash]);

    // HOD
    await pool.query(`
      INSERT INTO users (username, password_hash, role, full_name, email, dept_id, must_change_password, is_active)
      VALUES (
        'hod.cse', $1, 'hod', 'Dr. Ramesh Kumar', 'hod.cse@college.edu',
        (SELECT id FROM departments WHERE code = 'CSE'),
        TRUE, TRUE
      )
      ON CONFLICT (username) DO UPDATE SET password_hash = $1, must_change_password = TRUE
    `, [defaultHash]);

    // Update department to set this HOD
    await pool.query(`
      UPDATE departments SET hod_id = (SELECT id FROM users WHERE username = 'hod.cse')
      WHERE code = 'CSE'
    `);

    // Advisor
    await pool.query(`
      INSERT INTO users (username, password_hash, role, full_name, email, dept_id, must_change_password, is_active)
      VALUES (
        'advisor.cse', $1, 'advisor', 'Mrs. Priya Sharma', 'advisor.cse@college.edu',
        (SELECT id FROM departments WHERE code = 'CSE'),
        TRUE, TRUE
      )
      ON CONFLICT (username) DO UPDATE SET password_hash = $1, must_change_password = TRUE
    `, [defaultHash]);

    // Faculty
    await pool.query(`
      INSERT INTO users (username, password_hash, role, full_name, email, dept_id, must_change_password, is_active)
      VALUES (
        'faculty.cse', $1, 'faculty', 'Mr. Arun Nair', 'faculty.cse@college.edu',
        (SELECT id FROM departments WHERE code = 'CSE'),
        TRUE, TRUE
      )
      ON CONFLICT (username) DO UPDATE SET password_hash = $1, must_change_password = TRUE
    `, [defaultHash]);

    // Student
    await pool.query(`
      INSERT INTO users (username, password_hash, role, full_name, email, dept_id, must_change_password, is_active)
      VALUES (
        'student.cse', $1, 'student', 'Anjali Menon', 'student.cse@college.edu',
        (SELECT id FROM departments WHERE code = 'CSE'),
        TRUE, TRUE
      )
      ON CONFLICT (username) DO UPDATE SET password_hash = $1, must_change_password = TRUE
    `, [defaultHash]);

    // STEP 4: Create test class and link student
    console.log('4. Creating test class...');
    await pool.query(`
      INSERT INTO classes (name, year, section, dept_id, advisor1_id, semester_id)
      SELECT 'CSE-A 2nd Year', 2, 'A',
        (SELECT id FROM departments WHERE code = 'CSE'),
        (SELECT id FROM users WHERE username = 'advisor.cse'),
        (SELECT id FROM semesters WHERE is_active = TRUE LIMIT 1)
      WHERE NOT EXISTS (SELECT 1 FROM classes WHERE name = 'CSE-A 2nd Year')
    `);

    // Create student profile
    console.log('5. Creating student profile...');
    await pool.query(`
      INSERT INTO student_profiles (user_id, class_id, roll_no, gender)
      SELECT
        (SELECT id FROM users WHERE username = 'student.cse'),
        (SELECT id FROM classes WHERE name = 'CSE-A 2nd Year'),
        'CSE2024001',
        'Female'
      WHERE NOT EXISTS (
        SELECT 1 FROM student_profiles WHERE user_id = (SELECT id FROM users WHERE username = 'student.cse')
      )
    `);

    console.log('\n✅ Seed data created successfully!\n');
    console.log('Test Credentials:');
    console.log('─────────────────────────────────────────────');
    console.log('| Role     | Username      | Password      |');
    console.log('─────────────────────────────────────────────');
    console.log('| Admin    | admin         | Admin@123     |');
    console.log('| HOD      | hod.cse       | Welcome@123   |');
    console.log('| Advisor  | advisor.cse   | Welcome@123   |');
    console.log('| Faculty  | faculty.cse   | Welcome@123   |');
    console.log('| Student  | student.cse   | Welcome@123   |');
    console.log('─────────────────────────────────────────────');
    console.log('\nAdmin can login directly. All others must change password on first login.');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
})();
