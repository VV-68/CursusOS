import { useState } from 'react';

/**
 * Collapsible card for a single Semester/Year period with dynamic course inputs.
 */
export default function PeriodCard({ period, periodIndex, label, onUpdate, onCopyPrevious, hasPrevious }) {
  const [open, setOpen] = useState(true);

  const courses = period.courses || [];
  const totalCredits = courses.reduce((s, c) => s + (parseFloat(c.credits) || 0), 0);

  const updateCourse = (ci, field, value) => {
    const updated = [...courses];
    updated[ci] = { ...updated[ci], [field]: value };
    onUpdate({ ...period, courses: updated });
  };

  const addCourse = () => {
    onUpdate({
      ...period,
      courses: [...courses, { course_name: '', course_code: '', credits: '', is_elective: false }]
    });
  };

  const removeCourse = (ci) => {
    if (courses.length <= 1) return;
    onUpdate({ ...period, courses: courses.filter((_, i) => i !== ci) });
  };

  return (
    <div className="period-card">
      <div className="period-header" onClick={() => setOpen(!open)}>
        <div className="period-header__left">
          <div className="period-header__badge">{period.period_number}</div>
          <div className="period-header__info">
            <h3>{label} {period.period_number}</h3>
            <span>{courses.length} course{courses.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="period-header__right">
          <span className="period-header__credits">
            {totalCredits} credits
          </span>
          <span className={`period-header__chevron ${open ? 'open' : ''}`}>▼</span>
        </div>
      </div>

      {open && (
        <div className="period-body">
          {/* Column headers - desktop only */}
          <div className="course-row" style={{ background: 'none', padding: '.25rem .75rem', marginBottom: 0 }}>
            <span style={{ fontSize: '.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Course Name *</span>
            <span style={{ fontSize: '.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Code *</span>
            <span style={{ fontSize: '.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Credits *</span>
            <span style={{ fontSize: '.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Elective</span>
            <span></span>
          </div>

          {courses.map((course, ci) => (
            <div className="course-row" key={ci}>
              <div className="dept-field">
                <input
                  type="text"
                  placeholder="e.g. Data Structures"
                  value={course.course_name}
                  onChange={e => updateCourse(ci, 'course_name', e.target.value)}
                />
              </div>
              <div className="dept-field">
                <input
                  type="text"
                  placeholder="e.g. CS201"
                  value={course.course_code}
                  onChange={e => updateCourse(ci, 'course_code', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  maxLength={20}
                />
              </div>
              <div className="dept-field">
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  max="20"
                  step="0.5"
                  value={course.credits}
                  onChange={e => updateCourse(ci, 'credits', e.target.value)}
                />
              </div>
              <div className="course-toggle">
                <div
                  className={`course-toggle__switch ${course.is_elective ? 'on' : ''}`}
                  onClick={() => updateCourse(ci, 'is_elective', !course.is_elective)}
                  role="switch"
                  aria-checked={course.is_elective}
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && updateCourse(ci, 'is_elective', !course.is_elective)}
                />
                <span className="course-toggle__label">
                  {course.is_elective ? 'Elective' : 'Compulsory'}
                </span>
              </div>
              <button
                className="course-remove"
                onClick={() => removeCourse(ci)}
                disabled={courses.length <= 1}
                title="Remove course"
              >
                ✕
              </button>
            </div>
          ))}

          <div className="period-actions">
            <button className="dept-btn dept-btn--ghost dept-btn--sm" onClick={addCourse}>
              ＋ Add Course
            </button>
            {hasPrevious && (
              <button className="dept-btn dept-btn--secondary dept-btn--sm" onClick={() => onCopyPrevious(periodIndex)}>
                📋 Copy from {label} {period.period_number - 1}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
