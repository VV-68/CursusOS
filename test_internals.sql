SELECT im.course_assignment_id, c.code, dc.period_number
FROM internal_marks im
JOIN course_assignments ca ON im.course_assignment_id = ca.id
JOIN courses c ON ca.course_id = c.id
LEFT JOIN department_courses dc ON dc.course_code = c.code 
LIMIT 5;
