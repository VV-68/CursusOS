/**
 * Live preview summary panel shown before final submission.
 */
export default function PreviewPanel({ formData }) {
  const { name, code, department_type, structure_count, description, periods } = formData;
  const label = department_type === 'semester_wise' ? 'Semester' : 'Year';

  const allCourses = (periods || []).flatMap(p => p.courses || []);
  const totalCredits = allCourses.reduce((s, c) => s + (parseFloat(c.credits) || 0), 0);
  const electives = allCourses.filter(c => c.is_elective).length;

  return (
    <div className="dept-preview">
      <h2>📋 Submission Preview</h2>

      <div className="dept-preview__grid">
        <div className="dept-preview__item">
          <label>Department</label>
          <span>{name || '—'}</span>
        </div>
        <div className="dept-preview__item">
          <label>Code</label>
          <span>{code || '—'}</span>
        </div>
        <div className="dept-preview__item">
          <label>Type</label>
          <span>{department_type === 'semester_wise' ? 'Semester Wise' : 'Year Wise'}</span>
        </div>
        <div className="dept-preview__item">
          <label>{label}s</label>
          <span>{structure_count}</span>
        </div>
        {description && (
          <div className="dept-preview__item" style={{ gridColumn: '1 / -1' }}>
            <label>Description</label>
            <span style={{ fontWeight: 400, fontSize: '.88rem' }}>{description}</span>
          </div>
        )}
      </div>

      {(periods || []).map((p, i) => (
        <div className="dept-preview__period" key={i}>
          <h4>
            <span>{label} {p.period_number}</span>
            <span style={{ fontSize: '.78rem', fontWeight: 500 }}>
              {(p.courses || []).reduce((s, c) => s + (parseFloat(c.credits) || 0), 0)} credits
            </span>
          </h4>
          {(p.courses || []).map((c, ci) => (
            <div className="dept-preview__course" key={ci}>
              <span className="dept-preview__course-name">
                {c.course_name || 'Unnamed'}{' '}
                {c.is_elective && <span style={{ fontSize: '.7rem', background: 'rgba(139,92,246,.3)', padding: '1px 6px', borderRadius: 4 }}>Elective</span>}
              </span>
              <span className="dept-preview__course-meta">
                {c.course_code} · {c.credits || 0} cr
              </span>
            </div>
          ))}
        </div>
      ))}

      <div className="dept-preview__total">
        <div className="dept-preview__total-item">
          <span>{allCourses.length}</span>
          <label>Total Courses</label>
        </div>
        <div className="dept-preview__total-item">
          <span>{totalCredits}</span>
          <label>Total Credits</label>
        </div>
        <div className="dept-preview__total-item">
          <span>{electives}</span>
          <label>Electives</label>
        </div>
        <div className="dept-preview__total-item">
          <span>{structure_count}</span>
          <label>{label}s</label>
        </div>
      </div>
    </div>
  );
}
