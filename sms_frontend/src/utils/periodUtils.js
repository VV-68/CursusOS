/** Semesters per academic year (semester_wise departments). */
export const SEMESTERS_PER_YEAR = 2;

/**
 * Period numbers that apply to a class year.
 * Year 1 → semesters 1,2 | Year 2 → 3,4 | year_wise → [year]
 */
export function resolveClassPeriods(departmentType, classYear, structureCount = 8) {
  const year = parseInt(classYear, 10) || 1;
  const max = parseInt(structureCount, 10) || 8;

  if (departmentType === 'year_wise') {
    return year <= max ? [year] : [];
  }

  const start = (year - 1) * SEMESTERS_PER_YEAR + 1;
  const periods = [];
  for (let i = 0; i < SEMESTERS_PER_YEAR; i++) {
    const p = start + i;
    if (p <= max) periods.push(p);
  }
  return periods;
}

export function periodLabel(departmentType) {
  return departmentType === 'year_wise' ? 'Year' : 'Semester';
}

/** Options for advisor/HOD: periods available for this class year */
export function periodOptionsForClass(departmentType, classYear, structureCount) {
  const label = periodLabel(departmentType);
  return resolveClassPeriods(departmentType, classYear, structureCount).map(p => ({
    period_number: p,
    label: `${label} ${p}`
  }));
}
