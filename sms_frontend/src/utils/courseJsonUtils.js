export const EMPTY_COURSE = { course_name: '', course_code: '', credits: '', is_elective: false };

export function defaultCourseCode(periodNumber, courseIndex) {
  const p = String(periodNumber).padStart(2, '0');
  const c = String(courseIndex).padStart(2, '0');
  return `${p}${c}`;
}

export function normalizeJsonCourse(course, periodNumber, courseIndex) {
  const code = defaultCourseCode(periodNumber, courseIndex);
  const course_code = (course.course_code && String(course.course_code).trim())
    ? String(course.course_code).trim().toUpperCase()
    : code;
  const course_name = (course.course_name && String(course.course_name).trim())
    ? String(course.course_name).trim()
    : `course${code}`;
  let credits = 0;
  if (course.credits !== undefined && course.credits !== null && course.credits !== '') {
    const n = Number(course.credits);
    if (!isNaN(n) && n >= 0) credits = n;
  }
  return {
    course_name,
    course_code,
    credits,
    is_elective: !!course.is_elective
  };
}

export function normalizeJsonPeriods(periods) {
  return periods.map(p => ({
    period_number: p.period_number,
    courses: (p.courses || []).map((c, ci) => normalizeJsonCourse(c, p.period_number, ci + 1))
  }));
}

export function buildSampleJSON(label, count) {
  const periods = [];
  const maxShow = count > 0 ? Math.min(count, 4) : 2;
  for (let i = 1; i <= maxShow; i++) {
    periods.push({
      period_number: i,
      courses: [
        {
          course_name: i === 1 ? 'Data Structures' : 'Database Management Systems',
          course_code: i === 1 ? 'CS201' : 'CS301',
          credits: i === 1 ? 4 : 3,
          is_elective: false
        },
        {
          course_name: i === 1 ? 'Discrete Mathematics' : 'Computer Networks',
          course_code: i === 1 ? 'MA202' : 'CS302',
          credits: 3,
          is_elective: false
        }
      ]
    });
  }
  return { periods };
}

export function normalizePeriodsFromDept(dept) {
  const count = parseInt(dept.structure_count, 10) || 0;
  const existing = dept.periods || [];
  if (!count) {
    return existing.map(p => ({
      period_number: p.period_number,
      courses: (p.courses || []).map(c => ({
        course_name: c.course_name || '',
        course_code: c.course_code || '',
        credits: c.credits ?? '',
        is_elective: !!c.is_elective
      }))
    }));
  }
  const periods = [];
  for (let i = 1; i <= count; i++) {
    const prev = existing.find(p => p.period_number === i);
    periods.push(prev ? {
      period_number: i,
      courses: (prev.courses || []).length
        ? prev.courses.map(c => ({
            course_name: c.course_name || '',
            course_code: c.course_code || '',
            credits: c.credits ?? '',
            is_elective: !!c.is_elective
          }))
        : [{ ...EMPTY_COURSE }]
    } : { period_number: i, courses: [{ ...EMPTY_COURSE }] });
  }
  return periods;
}

export function applyJsonImportToForm(jsonData, currentForm) {
  const importedPeriods = jsonData.periods;
  const count = Math.max(parseInt(currentForm.structure_count, 10) || 0, ...importedPeriods.map(p => p.period_number));
  const periods = [];
  for (let i = 1; i <= count; i++) {
    const imported = importedPeriods.find(p => p.period_number === i);
    const existing = currentForm.periods.find(p => p.period_number === i);
    if (imported) {
      const courses = imported.courses.map((c, ci) => {
        const normalized = normalizeJsonCourse(c, i, ci + 1);
        return {
          course_name: normalized.course_name,
          course_code: normalized.course_code,
          credits: normalized.credits,
          is_elective: normalized.is_elective
        };
      });
      periods.push({ period_number: i, courses });
    } else if (existing) {
      periods.push(existing);
    } else {
      periods.push({ period_number: i, courses: [{ ...EMPTY_COURSE }] });
    }
  }
  return { ...currentForm, structure_count: String(count), periods };
}
