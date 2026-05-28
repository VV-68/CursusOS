require('dotenv').config({ path: '.env' });
const pool = require('./src/db/connection');

async function test() {
  try {
    // 1. Get a student
    const { rows: students } = await pool.query("SELECT u.id, u.email, u.role FROM users u WHERE u.role = 'student' LIMIT 1");
    if (!students.length) return console.log("No students");
    const student = students[0];
    console.log("Student:", student.id, student.email);

    // 2. Check student_academic_history for this student
    const { rows: sahRows } = await pool.query(
      "SELECT sah.*, c.name AS class_name FROM student_academic_history sah JOIN classes c ON c.id = sah.class_id WHERE sah.student_id = $1",
      [student.id]
    );
    console.log("\nStudent academic history records:", sahRows.length);
    sahRows.forEach(r => console.log(`  class: ${r.class_name}, is_active: ${r.is_active}, semester_id: ${r.semester_id}`));

    // 3. Check which course_assignments match
    const { rows: matchingCA } = await pool.query(`
      SELECT ca.id, c.name AS course_name, c.code, ca.class_id, ca.semester_id, sah.is_active
      FROM course_assignments ca
      JOIN courses c ON c.id = ca.course_id
      JOIN student_academic_history sah ON sah.class_id = ca.class_id AND sah.student_id = $1
      WHERE sah.student_id = $1
    `, [student.id]);
    console.log("\nMatching CAs (class_id only):", matchingCA.length);
    matchingCA.forEach(r => console.log(`  ${r.course_name} (${r.code}): ca.semester=${r.semester_id}, is_active=${r.is_active}`));

    // 4. Check with semester_id join too
    const { rows: matchingCA2 } = await pool.query(`
      SELECT ca.id, c.name AS course_name, c.code, ca.class_id, ca.semester_id, sah.semester_id AS sah_semester_id, sah.is_active
      FROM course_assignments ca
      JOIN courses c ON c.id = ca.course_id
      JOIN student_academic_history sah ON sah.class_id = ca.class_id AND sah.semester_id = ca.semester_id AND sah.student_id = $1
      WHERE sah.student_id = $1
    `, [student.id]);
    console.log("\nMatching CAs (class_id + semester_id):", matchingCA2.length);
    matchingCA2.forEach(r => console.log(`  ${r.course_name} (${r.code}): ca.semester=${r.semester_id}, sah.semester=${r.sah_semester_id}, is_active=${r.is_active}`));

    // 5. Check all course_assignments  
    const { rows: allCA } = await pool.query("SELECT ca.*, c.name FROM course_assignments ca JOIN courses c ON c.id = ca.course_id");
    console.log("\nAll course_assignments:", allCA.length);
    allCA.forEach(r => console.log(`  ${r.name}: class=${r.class_id}, semester=${r.semester_id}`));

    // 6. Check student profile
    const { rows: sp } = await pool.query("SELECT * FROM student_profiles WHERE user_id = $1", [student.id]);
    console.log("\nStudent profile:", sp[0] ? { class_id: sp[0].class_id } : "NOT FOUND");

    // 7. Test getMyCourses query (the one used by profileAPI.getMyCourses)
    const { rows: myCourses } = await pool.query(`
      SELECT c.name, c.code, ca.id AS course_assignment_id
      FROM course_assignments ca
      JOIN courses c ON c.id = ca.course_id
      JOIN student_academic_history sah ON sah.class_id = ca.class_id AND sah.semester_id = ca.semester_id AND sah.student_id = $1 AND sah.is_active = true
      JOIN student_profiles sp ON sp.user_id = sah.student_id
      JOIN departments d ON d.id = c.dept_id
      LEFT JOIN department_courses dc ON dc.course_code = c.code AND dc.dept_id = c.dept_id
      WHERE d.department_type != 'semester_wise' 
        OR d.active_term = 'all' 
        OR (d.active_term = 'even' AND dc.period_number % 2 = 0)
        OR (d.active_term = 'odd' AND dc.period_number % 2 != 0)
      ORDER BY c.code
    `, [student.id]);
    console.log("\ngetMyCourses result:", myCourses.length);
    myCourses.forEach(r => console.log(`  ${r.name} (${r.code}): ca_id=${r.course_assignment_id}`));

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
test();
