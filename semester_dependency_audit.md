# Codebase Audit: Deprecated Semester Architecture Dependencies

This report identifies every remaining dependency on the deprecated `semesters` table and legacy semester-based architecture. It is ordered by Risk Level.

## ⚠️ Critical dependency (11 occurrences)

### `sms_backend/src/controllers/departmentController.js`
- **Line 159**: `'SELECT id FROM semesters WHERE id = $1', [semester_id]`
  - **Dependency Type**: Direct
  - **Why**: Queries the deprecated semesters table directly for academic structure.
  - **Recommendation**: Use classes.current_semester_number and batch-based progression architecture.

- **Line 184**: ``INSERT INTO department_semester_courses (dept_id, semester_id, course_id, added_by)`
  - **Dependency Type**: Direct
  - **Why**: Relies on the old mapping table that ties courses to a specific semester row.
  - **Recommendation**: Refactor to map courses to department and year/semester parity (or a new curriculum model).

- **Line 196**: ``UPDATE department_semester_courses`
  - **Dependency Type**: Direct
  - **Why**: Relies on the old mapping table that ties courses to a specific semester row.
  - **Recommendation**: Refactor to map courses to department and year/semester parity (or a new curriculum model).

- **Line 221**: `FROM department_semester_courses dsc`
  - **Dependency Type**: Direct
  - **Why**: Relies on the old mapping table that ties courses to a specific semester row.
  - **Recommendation**: Refactor to map courses to department and year/semester parity (or a new curriculum model).

### `sms_backend/src/controllers/timetableController.js`
- **Line 12**: `const { rows } = await pool.query(`SELECT id FROM semesters WHERE is_active = TRUE LIMIT 1`);`
  - **Dependency Type**: Direct
  - **Why**: Queries the deprecated semesters table directly for academic structure.
  - **Recommendation**: Use classes.current_semester_number and batch-based progression architecture.

### `sms_backend/src/models/departmentCreationModel.js`
- **Line 123**: `// 2. Delete existing courses and recreate them (Simplest for full replacement, but let's be careful about cascading constraints. If courses are linked in department_semester_courses... wait, we have `courses` and `department_courses`.)`
  - **Dependency Type**: Direct
  - **Why**: Relies on the old mapping table that ties courses to a specific semester row.
  - **Recommendation**: Refactor to map courses to department and year/semester parity (or a new curriculum model).

- **Line 392**: `console.log('[assignFacultyToDeptCourse] before INSERT department_semester_courses');`
  - **Dependency Type**: Direct
  - **Why**: Relies on the old mapping table that ties courses to a specific semester row.
  - **Recommendation**: Refactor to map courses to department and year/semester parity (or a new curriculum model).

- **Line 394**: ``INSERT INTO department_semester_courses (dept_id, semester_id, course_id, added_by)`
  - **Dependency Type**: Direct
  - **Why**: Relies on the old mapping table that ties courses to a specific semester row.
  - **Recommendation**: Refactor to map courses to department and year/semester parity (or a new curriculum model).

- **Line 399**: `console.log('[assignFacultyToDeptCourse] after INSERT department_semester_courses');`
  - **Dependency Type**: Direct
  - **Why**: Relies on the old mapping table that ties courses to a specific semester row.
  - **Recommendation**: Refactor to map courses to department and year/semester parity (or a new curriculum model).

### `sms_backend/src/services/academicStateService.js`
- **Line 79**: ``SELECT id FROM semesters WHERE number = $1 ORDER BY created_at DESC NULLS LAST LIMIT 1`,`
  - **Dependency Type**: Direct
  - **Why**: Queries the deprecated semesters table directly for academic structure.
  - **Recommendation**: Use classes.current_semester_number and batch-based progression architecture.

- **Line 85**: ``SELECT id FROM semesters`
  - **Dependency Type**: Direct
  - **Why**: Queries the deprecated semesters table directly for academic structure.
  - **Recommendation**: Use classes.current_semester_number and batch-based progression architecture.

## ⚠️ Requires refactor (179 occurrences)

### `sms_backend/src/app.js`
- **Line 93**: `app.use("/api/semesters", semesterRoutes);`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_backend/src/controllers/classController.js`
- **Line 37**: `const { name, year, section, dept_id, semester_id, batch_year, max_semesters } = req.body;`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 44**: `const newClass = await classModel.createClass({ name, year, section, dept_id, semester_id, batch_year, max_semesters });`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 111**: `const { name, year, section, semester_id, batch_year, current_semester_number, current_year_number, is_active } = req.body;`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 121**: `const updatedClass = await classModel.updateClass(id, { name, year, section, semester_id, batch_year, current_semester_number, current_year_number, is_active });`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_backend/src/controllers/courseController.js`
- **Line 47**: `const { faculty1_id, faculty2_id, course_id, class_id, semester_id } = req.body;`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 79**: `semester_id ||`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 81**: `classObj.semester_id;`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 84**: `faculty1_id, faculty2_id, course_id, class_id, semester_id: resolvedSemesterId`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 116**: `const { semester_id } = req.query;`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 117**: `let semId = semester_id || null;`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 132**: `JOIN semesters   s  ON s.id  = ca.semester_id`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 134**: `AND ($2::uuid IS NULL OR ca.semester_id = $2)`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_backend/src/controllers/departmentController.js`
- **Line 152**: `const { semester_id, courses } = payload;`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 153**: `if (!semester_id || !Array.isArray(courses) || courses.length === 0) {`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 154**: `return res.status(400).json({ error: 'semester_id and courses array are required' });`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 186**: `ON CONFLICT (dept_id, semester_id, course_id) DO UPDATE SET is_active = TRUE`,`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 187**: `[dept_id, semester_id, savedCourse.id, req.user.id]`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 198**: `WHERE dept_id = $1 AND semester_id = $2`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 200**: `[dept_id, semester_id, uploadedIds]`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 204**: `{ semester_id, count: results.length }`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 216**: `const { semester_id } = req.query;`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 217**: `if (!semester_id) return res.status(400).json({ error: 'semester_id query param required' });`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 223**: `WHERE dsc.dept_id = $1 AND dsc.semester_id = $2 AND dsc.is_active = TRUE`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 225**: `[req.params.id, semester_id]`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_backend/src/controllers/departmentCreationController.js`
- **Line 21**: `errors.push('Number of semesters/years must be between 1 and 20');`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 126**: `errors.push('Number of semesters/years must be between 1 and 20');`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 299**: `const { class_id, semester_id } = req.query;`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 305**: `semester_id`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 329**: `const { department_course_id, faculty1_id, faculty2_id, class_id, semester_id } = req.body;`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 330**: `if (!department_course_id || (!faculty1_id && !faculty2_id) || !class_id || !semester_id) {`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 331**: `return res.status(400).json({ error: 'department_course_id, at least one faculty_id, class_id, and semester_id are required' });`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 335**: `{ department_course_id, faculty1_id, faculty2_id, class_id, semester_id },`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_backend/src/controllers/semesterController.js`
- **Line 3**: `const getAllSemesters = async (req, res) => {`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 5**: `const semesters = await semesterModel.getAllSemesters();`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 6**: `res.json(semesters);`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 8**: `console.error('getAllSemesters error:', err);`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 13**: `module.exports = { getAllSemesters };`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_backend/src/controllers/studentProfileController.js`
- **Line 191**: `JOIN semesters s ON s.id = ca.semester_id`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_backend/src/controllers/timetableController.js`
- **Line 9**: `let { semester_id } = req.query;`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 11**: `if (!semester_id) {`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 14**: `semester_id = rows[0].id;`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 18**: `const timetable = await timetableModel.getTimetable(class_id, semester_id || null);`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 28**: `const { class_id, semester_id, slots } = req.body;`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 29**: `if (!semester_id) {`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 30**: `return res.status(400).json({ error: 'semester_id is required' });`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 41**: `await timetableModel.replaceTimetable(class_id, semester_id, slots);`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 59**: `const { semester_id, period_number } = req.query;`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 62**: ``SELECT c.id, c.dept_id, c.year, c.semester_id, c.name AS class_name, c.section,`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 98**: `const semId = semester_id || cls.semester_id;`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 100**: `return res.status(400).json({ error: 'semester_id is required' });`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 118**: `ON ca.course_id = c.id AND ca.class_id = $1 AND ca.semester_id = $2`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 136**: `semester_id: semId,`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_backend/src/db/migrate_academic_progression.js`
- **Line 6**: `* - semesters.is_active globally toggles the current term`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 14**: `* - Keep old columns in `classes` (e.g. semester_id, advisor1_id)`
  - **Dependency Type**: Direct
  - **Why**: Uses legacy semester_id foreign key inside the classes table.
  - **Recommendation**: Rely solely on classes.current_semester_number and current_year_number.

- **Line 41**: `semester_id uuid REFERENCES semesters(id),`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 60**: `semester_id,`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 70**: `c.semester_id,`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_backend/src/db/migrate_batch_lifecycle_safe.sql`
- **Line 18**: `ADD COLUMN IF NOT EXISTS max_semesters smallint DEFAULT 8,`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 85**: `max_semesters = COALESCE(c.max_semesters, 8);`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 91**: `semester_id,`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 103**: `c.semester_id,`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_backend/src/db/migrate_department_creation.js`
- **Line 5**: `* Creates department_courses table for courses linked to specific semesters/years within a department.`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_backend/src/db/migrate_timetable_dept_courses.js`
- **Line 16**: `ADD COLUMN IF NOT EXISTS semester_id UUID REFERENCES semesters(id) ON DELETE CASCADE`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 26**: `ON timetable_slots(class_id, semester_id)`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_backend/src/models/classModel.js`
- **Line 23**: `const { name, year, section, dept_id, semester_id, batch_year, max_semesters } = classData;`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 27**: `const maxSems = max_semesters || 8;`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 31**: `name, year, section, dept_id, semester_id,`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 32**: `batch_year, current_year_number, current_semester_number, is_active, max_semesters`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 35**: `[name, year, section, dept_id, semester_id, batchYear, currentYear, currentSem, maxSems]`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 99**: `const { name, year, section, semester_id, batch_year, current_semester_number, current_year_number, is_active } = classData;`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 102**: `SET name = $1, year = $2, section = $3, semester_id = $4,`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 109**: `[name, year, section, semester_id, classId, batch_year || null, current_semester_number || null, current_year_number || null, is_active]`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_backend/src/models/courseModel.js`
- **Line 29**: `const { faculty1_id, faculty2_id, course_id, class_id, semester_id } = assignmentData;`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 31**: `'INSERT INTO course_assignments (faculty1_id, faculty2_id, course_id, class_id, semester_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 32**: `[faculty1_id || null, faculty2_id || null, course_id, class_id, semester_id]`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_backend/src/models/departmentCreationModel.js`
- **Line 10**: `* @param {number} departmentData.structure_count   – number of semesters or years`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 265**: `const { class_id, semester_id } = filters;`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 314**: `if (class_id && semester_id && courses.length) {`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 323**: `WHERE ca.class_id = $1 AND ca.semester_id = $2 AND c.dept_id = $3`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 325**: `[class_id, semester_id, deptId, codes]`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 359**: `const { department_course_id, faculty1_id, faculty2_id, class_id, semester_id } = data;`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 360**: `console.log('[assignFacultyToDeptCourse] start', { deptId, department_course_id, faculty1_id, faculty2_id, class_id, semester_id, userId });`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 396**: `ON CONFLICT (dept_id, semester_id, course_id) DO UPDATE SET is_active = TRUE`,`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 397**: `[deptId, semester_id, course.id, userId]`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 404**: `WHERE course_id = $1 AND class_id = $2 AND semester_id = $3`,`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 405**: `[course.id, class_id, semester_id]`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 421**: ``INSERT INTO course_assignments (faculty1_id, faculty2_id, course_id, class_id, semester_id)`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 423**: `[faculty1_id || null, faculty2_id || null, course.id, class_id, semester_id]`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 447**: `const SEMESTERS_PER_YEAR = 2;`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 458**: `const start = (year - 1) * SEMESTERS_PER_YEAR + 1;`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 460**: `for (let i = 0; i < SEMESTERS_PER_YEAR; i++) {`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_backend/src/models/internalMarksModel.js`
- **Line 54**: `c.name as course_name, c.code as course_code, sem.name as semester_name, sem.id as semester_id`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 58**: `JOIN semesters sem ON ca.semester_id = sem.id`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 103**: `JOIN semesters sem ON ca.semester_id = sem.id`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_backend/src/models/semesterModel.js`
- **Line 3**: `const getAllSemesters = async () => {`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 6**: `FROM semesters`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 12**: `module.exports = { getAllSemesters };`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_backend/src/models/studentModel.js`
- **Line 83**: `const classData = await pool.query('SELECT semester_id, current_year_number, current_semester_number, advisor1_id, advisor2_id FROM classes WHERE id = $1', [class_id]);`
  - **Dependency Type**: Direct
  - **Why**: Uses legacy semester_id foreign key inside the classes table.
  - **Recommendation**: Rely solely on classes.current_semester_number and current_year_number.

- **Line 89**: ``, [student_id, class_id, cls.semester_id, cls.current_year_number, cls.current_semester_number, cls.advisor1_id, cls.advisor2_id]);`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_backend/src/models/studentProfileModel.js`
- **Line 39**: `LEFT JOIN semesters sem ON sem.id = sah.semester_id`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 56**: `LEFT JOIN semesters sem ON sem.id = sah.semester_id`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 73**: `LEFT JOIN semesters sem ON sem.id = sah.semester_id`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_backend/src/models/timetableModel.js`
- **Line 3**: `const getTimetable = async (class_id, semester_id = null) => {`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 26**: `if (semester_id) {`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 27**: `params.push(semester_id);`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 28**: `query += ` AND ts.semester_id = $${params.length}`;`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 35**: `const replaceTimetable = async (class_id, semester_id, slots) => {`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 64**: `if (semester_id) {`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 65**: `deleteParams.push(semester_id);`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 66**: `deleteQuery += ` AND ts.semester_id = $${deleteParams.length}`;`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 93**: `class_id, semester_id, course_assignment_id, department_course_id,`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 98**: `semester_id || slot.semester_id || null,`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_backend/src/routes/semesterRoutes.js`
- **Line 6**: `router.get('/', authMiddleware, ctrl.getAllSemesters);`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_backend/src/services/academicStateService.js`
- **Line 11**: `c.semester_id AS legacy_semester_id,`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 16**: `c.max_semesters,`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 57**: `c.semester_id,`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_backend/src/services/progressionService.js`
- **Line 11**: `const getStudentCurrentSemester = async (studentId) => (await getCurrentAcademicState(studentId))?.semester_id || null;`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 19**: `throw new Error('Promotion requests are allowed only from even semesters (Year progression)');`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 26**: ``INSERT INTO course_assignments (faculty1_id, faculty2_id, course_id, class_id, semester_id)`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 29**: `WHERE ca.class_id = $1 AND ca.semester_id = $3`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 118**: `student_id, class_id, semester_id, current_year, current_semester,`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 139**: `semester_id = COALESCE($3, semester_id),`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 146**: `await copyCourseAssignmentsToNewSemester(client, req.batch_id, batch.semester_id, targetSemesterId);`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 176**: `throw new Error('Direct promotion is only allowed from odd to even semesters (within year). For year progression, please use request promotion.');`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 209**: `student_id, class_id, semester_id, current_year, current_semester,`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 229**: `semester_id = COALESCE($3, semester_id),`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 236**: `await copyCourseAssignmentsToNewSemester(client, batchId, batch.semester_id, targetSemesterId);`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_backend/src/utils/authorizationHelpers.js`
- **Line 33**: `JOIN course_assignments ca ON ca.class_id = sah.class_id AND ca.semester_id = sah.semester_id`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 77**: `JOIN semesters s  ON s.id  = ca.semester_id`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_frontend/src/components/CourseSemesterSelector.jsx`
- **Line 4**: `const CourseSemesterSelector = ({ onSelect, initialValue }) => {`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 169**: `export default CourseSemesterSelector;`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_frontend/src/pages/admin/CreateDepartment.jsx`
- **Line 291**: `<div className="dept-radio__desc">Courses organized by semesters</div>`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_frontend/src/pages/advisor/StudentProfile.jsx`
- **Line 124**: `{renderField('Current Semester', profile?.current_semester_name || profile?.current_semester)}`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_frontend/src/pages/advisor/Timetable.jsx`
- **Line 63**: `const [semesters, setSemesters] = useState([]);`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 78**: `setSemesters(semData);`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 95**: `semester_id: selectedSemester,`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 112**: `timetableAPI.getAvailableCourses(selectedClass, { semester_id: selectedSemester, period_number: period })`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 148**: `await timetableAPI.upload({ class_id: selectedClass, semester_id: selectedSemester, slots: payloadSlots });`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 159**: `const sem = semesters.find(s => s.id === selectedSemester);`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_frontend/src/pages/faculty/Assignments.jsx`
- **Line 4**: `import CourseSemesterSelector from '../../components/CourseSemesterSelector';`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 117**: `<CourseSemesterSelector onSelect={setSelectedCA} initialValue={initial_ca} />`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_frontend/src/pages/faculty/InternalMarks.jsx`
- **Line 63**: `// Get department active term`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_frontend/src/pages/faculty/MarkAttendance.jsx`
- **Line 76**: `// Get department active term`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_frontend/src/pages/faculty/StudyMaterials.jsx`
- **Line 5**: `import CourseSemesterSelector from '../../components/CourseSemesterSelector';`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 130**: `<CourseSemesterSelector onSelect={setSelectedCA} initialValue={initial_ca} />`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_frontend/src/pages/hod/AssignCourse.jsx`
- **Line 77**: `{/* Temporary hardcoded input for semester_id until Semesters feature is built */}`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 78**: `<input name="semester_id" placeholder="Semester ID (UUID)" value={formData.semester_id} onChange={handleChange} required />`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_frontend/src/pages/hod/BatchProgression.jsx`
- **Line 118**: `const maxSemesters = Number(b.max_semesters || 8);`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 119**: `const isCourseCompleted = semester >= maxSemesters || b.course_completed;`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_frontend/src/pages/hod/ClassTimetableView.jsx`
- **Line 12**: `const [semesters, setSemesters] = useState([]);`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 26**: `setSemesters(semData);`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 53**: `const sem = semesters.find(s => s.id === selectedSemester);`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 80**: `<strong>Term:</strong> {semesters.find(s => s.id === selectedSemester)?.name} {semesters.find(s => s.id === selectedSemester)?.is_active ? '(Active)' : ''}`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_frontend/src/pages/hod/Classes.jsx`
- **Line 12**: `const [semesters, setSemesters] = useState([]);`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 18**: `const [formData, setFormData] = useState({ name: '', year: '', section: '', dept_id: '', semester_id: '' });`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 36**: `setSemesters(sems);`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 77**: `semester_id: formData.semester_id || null`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 79**: `setFormData(f => ({ name: '', year: '', section: '', dept_id: deptId || '', semester_id: '' }));`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 238**: `{semesters.length > 0 && (`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 242**: `value={formData.semester_id}`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 243**: `onChange={e => setFormData(f => ({ ...f, semester_id: e.target.value }))}`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 248**: `{semesters.map(s => (`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_frontend/src/pages/hod/Courses.jsx`
- **Line 31**: `const [semesters, setSemesters] = useState([]);`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 51**: `setSemesters(semData);`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 73**: `semester_id: selectedSemester`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 111**: `semester_id: selectedSemester`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 183**: `{semesters.map(s => (`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_frontend/src/pages/shared/EditDepartment.jsx`
- **Line 565**: `<div className="dept-radio__desc">Courses organized by semesters</div>`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_frontend/src/pages/student/MyInternals.jsx`
- **Line 23**: `grouped[row.semester_name] = { semester_id: row.semester_id, courses: {} };`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_frontend/src/services/api.js`
- **Line 130**: `getCourses: (id, semester_id) => fetch(`${BASE_URL}/api/departments/${id}/courses?semester_id=${semester_id}`, { headers: getHeaders(true) }).then(handleResponse),`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 133**: `// ─── Semesters ─────────────────────────────────────────────────`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 136**: `getAll: () => fetch(`${BASE_URL}/api/semesters`, { headers: getHeaders(true) }).then(handleResponse),`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 168**: `const qs = semesterId ? `?semester_id=${semesterId}` : '';`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

### `sms_frontend/src/utils/periodUtils.js`
- **Line 1**: `/** Semesters per academic year (semester_wise departments). */`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 2**: `export const SEMESTERS_PER_YEAR = 2;`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 6**: `* Year 1 → semesters 1,2 | Year 2 → 3,4 | year_wise → [year]`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 16**: `const start = (year - 1) * SEMESTERS_PER_YEAR + 1;`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

- **Line 18**: `for (let i = 0; i < SEMESTERS_PER_YEAR; i++) {`
  - **Dependency Type**: Indirect
  - **Why**: References legacy semester terminology or ID variables.
  - **Recommendation**: Transition to batch-based progression architecture using classes.current_semester_number.

## ⚠️ Safe to remove (3 occurrences)

### `sms_backend/src/utils/authorizationHelpers.js`
- **Line 64**: `* Get all course_assignments for a faculty member (active semester).`
  - **Dependency Type**: Indirect
  - **Why**: Assumes a global "active semester" which contradicts batch-based progression.
  - **Recommendation**: Batch progression handles active state independently per batch.

### `sms_frontend/src/pages/faculty/MyTimetable.jsx`
- **Line 23**: `setDebug('You have no course assignments for the active semester.');`
  - **Dependency Type**: Indirect
  - **Why**: Assumes a global "active semester" which contradicts batch-based progression.
  - **Recommendation**: Batch progression handles active state independently per batch.

### `sms_frontend/src/pages/hod/AssignCourse.jsx`
- **Line 16**: `semester_id: '' // Actually needs to be an active semester ID ideally, prompt implies providing it`
  - **Dependency Type**: Indirect
  - **Why**: Assumes a global "active semester" which contradicts batch-based progression.
  - **Recommendation**: Batch progression handles active state independently per batch.

## ⚠️ Legacy compatibility code (9 occurrences)

### `sms_backend/src/controllers/studentProfileController.js`
- **Line 189**: `JOIN student_academic_history sah ON sah.class_id = ca.class_id AND sah.semester_id = ca.semester_id AND sah.student_id = $1`
  - **Dependency Type**: Indirect
  - **Why**: Tracks historical semester_id for data integrity during migration.
  - **Recommendation**: Use student_academic_history.current_semester for future-proof logic.

### `sms_backend/src/models/assignmentModel.js`
- **Line 126**: `JOIN student_academic_history sah ON sah.class_id = ca.class_id AND sah.semester_id = ca.semester_id AND sah.student_id = $1`
  - **Dependency Type**: Indirect
  - **Why**: Tracks historical semester_id for data integrity during migration.
  - **Recommendation**: Use student_academic_history.current_semester for future-proof logic.

### `sms_backend/src/models/attendanceModel.js`
- **Line 7**: `JOIN student_academic_history sah ON sah.class_id = ca.class_id AND sah.semester_id = ca.semester_id`
  - **Dependency Type**: Indirect
  - **Why**: Tracks historical semester_id for data integrity during migration.
  - **Recommendation**: Use student_academic_history.current_semester for future-proof logic.

### `sms_backend/src/models/internalMarksModel.js`
- **Line 8**: `JOIN student_academic_history sah ON sah.class_id = ca.class_id AND sah.semester_id = ca.semester_id`
  - **Dependency Type**: Indirect
  - **Why**: Tracks historical semester_id for data integrity during migration.
  - **Recommendation**: Use student_academic_history.current_semester for future-proof logic.

- **Line 82**: `JOIN student_academic_history sah ON sah.student_id = u.id AND sah.class_id = cls.id AND sah.semester_id = ca.semester_id`
  - **Dependency Type**: Indirect
  - **Why**: Tracks historical semester_id for data integrity during migration.
  - **Recommendation**: Use student_academic_history.current_semester for future-proof logic.

- **Line 101**: `JOIN student_academic_history sah ON sah.student_id = u.id AND sah.class_id = cls.id AND sah.semester_id = ca.semester_id`
  - **Dependency Type**: Indirect
  - **Why**: Tracks historical semester_id for data integrity during migration.
  - **Recommendation**: Use student_academic_history.current_semester for future-proof logic.

### `sms_backend/src/models/marksModel.js`
- **Line 6**: `JOIN student_academic_history sah ON sah.class_id = ca.class_id AND sah.semester_id = ca.semester_id`
  - **Dependency Type**: Indirect
  - **Why**: Tracks historical semester_id for data integrity during migration.
  - **Recommendation**: Use student_academic_history.current_semester for future-proof logic.

### `sms_backend/src/models/studentModel.js`
- **Line 87**: `INSERT INTO student_academic_history (student_id, class_id, semester_id, current_year, current_semester, advisor1_id, advisor2_id, remarks)`
  - **Dependency Type**: Indirect
  - **Why**: Tracks historical semester_id for data integrity during migration.
  - **Recommendation**: Use student_academic_history.current_semester for future-proof logic.

### `sms_backend/src/models/studyMaterialModel.js`
- **Line 106**: `JOIN student_academic_history sah ON sah.class_id = ca.class_id AND sah.semester_id = ca.semester_id AND sah.student_id = $1`
  - **Dependency Type**: Indirect
  - **Why**: Tracks historical semester_id for data integrity during migration.
  - **Recommendation**: Use student_academic_history.current_semester for future-proof logic.

