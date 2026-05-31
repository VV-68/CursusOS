#!/bin/bash
echo "=== CRITICAL ==="
grep -rn "sah\.semester_id = ca\.semester_id" src/
echo "=== REFACTOR REQUIRED ==="
grep -rn "semester_id" src/models/studyMaterialModel.js src/models/assignmentModel.js src/models/marksModel.js src/models/attendanceModel.js src/models/timetableModel.js
echo "=== HISTORICAL / DB COMPAT ==="
grep -rn "INSERT INTO.*semester_id" src/
grep -rn "department_semester_courses" src/
grep -rn "semester_id" src/db/
grep -rn "semesters" src/db/
