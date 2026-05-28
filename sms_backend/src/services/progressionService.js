const pool = require('../db/connection');

/**
 * Service to handle academic progression and compatibility layer
 */

/**
 * Get the current active academic state for a student
 * Returns the latest active row from student_academic_history
 */
const getCurrentAcademicState = async (studentId) => {
  const query = `
    SELECT * FROM student_academic_history
    WHERE student_id = $1 AND is_active = true
    ORDER BY promoted_at DESC
    LIMIT 1;
  `;
  const result = await pool.query(query, [studentId]);
  
  if (result.rows.length === 0) {
    // Fallback for students missing history (just in case migration missed them)
    const fallbackQuery = `
      SELECT 
        c.id as class_id, 
        c.semester_id, 
        c.year as current_year, 
        c.advisor1_id, 
        c.advisor2_id
      FROM student_profiles sp
      JOIN classes c ON sp.class_id = c.id
      WHERE sp.user_id = $1;
    `;
    const fallback = await pool.query(fallbackQuery, [studentId]);
    return fallback.rows[0] || null;
  }
  return result.rows[0];
};

const getStudentCurrentSemester = async (studentId) => {
  const state = await getCurrentAcademicState(studentId);
  return state ? state.semester_id : null;
};

const getStudentCurrentAdvisor = async (studentId) => {
  const state = await getCurrentAcademicState(studentId);
  return state ? { advisor1: state.advisor1_id, advisor2: state.advisor2_id } : null;
};

const getStudentCurrentClass = async (studentId) => {
  const state = await getCurrentAcademicState(studentId);
  return state ? state.class_id : null;
};

/**
 * Promote a single student to a new semester/year
 */
const promoteStudent = async (studentId, newSemesterId, newYear, newSemesterNumber, newAdvisor1, newAdvisor2, remarks = 'Promoted') => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Deactivate current active histories
    await client.query(
      `UPDATE student_academic_history SET is_active = false WHERE student_id = $1`,
      [studentId]
    );

    // Get current class_id (permanent batch)
    const profile = await client.query(
      `SELECT class_id FROM student_profiles WHERE user_id = $1`,
      [studentId]
    );
    const classId = profile.rows[0]?.class_id;

    if (!classId) throw new Error('Student profile not found');

    // Insert new history
    const insertQuery = `
      INSERT INTO student_academic_history (
        student_id, class_id, semester_id, current_year, current_semester,
        advisor1_id, advisor2_id, is_active, remarks
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)
      RETURNING *;
    `;
    const result = await client.query(insertQuery, [
      studentId, classId, newSemesterId, newYear, newSemesterNumber,
      newAdvisor1, newAdvisor2, remarks
    ]);

    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Promote an entire class (batch) to a new semester
 */
const promoteClass = async (classId, newSemesterId, newYear, newSemesterNumber, newAdvisor1, newAdvisor2, remarks = 'Batch Promoted') => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get all students currently active in this class
    const studentsRes = await client.query(
      `SELECT student_id FROM student_academic_history WHERE class_id = $1 AND is_active = true`,
      [classId]
    );
    
    // Update the classes table batch info
    await client.query(
      `UPDATE classes SET current_year_number = $1, current_semester_number = $2 WHERE id = $3`,
      [newYear, newSemesterNumber, classId]
    );

    for (const row of studentsRes.rows) {
      // Deactivate old
      await client.query(
        `UPDATE student_academic_history SET is_active = false WHERE student_id = $1 AND class_id = $2`,
        [row.student_id, classId]
      );

      // Insert new
      await client.query(`
        INSERT INTO student_academic_history (
          student_id, class_id, semester_id, current_year, current_semester,
          advisor1_id, advisor2_id, is_active, remarks
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)
      `, [
        row.student_id, classId, newSemesterId, newYear, newSemesterNumber,
        newAdvisor1, newAdvisor2, remarks
      ]);
    }

    await client.query('COMMIT');
    return { success: true, count: studentsRes.rowCount };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  getCurrentAcademicState,
  getStudentCurrentSemester,
  getStudentCurrentAdvisor,
  getStudentCurrentClass,
  promoteStudent,
  promoteClass
};
