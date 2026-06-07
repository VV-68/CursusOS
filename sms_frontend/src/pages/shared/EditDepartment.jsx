import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { departmentCreationAPI, departmentAPI, getMe, syllabusAPI } from '../../services/api';
import PeriodCard from '../admin/PeriodCard';
import PreviewPanel from '../admin/PreviewPanel';
import '../admin/CreateDepartment.css';

const STEPS = ['Department Info', 'Structure', 'Courses', 'Review & Submit'];
const EMPTY_COURSE = { course_name: '', course_code: '', credits: '', is_elective: false };

/** Default code for period N, course index M — e.g. semester 1 course 1 → "0101" */
function defaultCourseCode(periodNumber, courseIndex) {
  const p = String(periodNumber).padStart(2, '0');
  const c = String(courseIndex).padStart(2, '0');
  return `${p}${c}`;
}

/** Fill missing JSON course fields so incomplete uploads still work */
function normalizeJsonCourse(course, periodNumber, courseIndex) {
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

function normalizeJsonPeriods(periods) {
  return periods.map(p => ({
    period_number: p.period_number,
    courses: (p.courses || []).map((c, ci) => normalizeJsonCourse(c, p.period_number, ci + 1))
  }));
}

// ── Normalize periods from API (fill gaps for each semester/year) ──
function normalizePeriods(dept) {
  const count = parseInt(dept.structure_count, 10) || 0;
  const existing = dept.periods || [];
  if (!count) return existing.map(p => ({
    period_number: p.period_number,
    courses: (p.courses || []).map(c => ({
      course_name: c.course_name || '',
      course_code: c.course_code || '',
      credits: c.credits ?? '',
      is_elective: !!c.is_elective,
      is_approved: c.is_approved
    }))
  }));
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
            is_elective: !!c.is_elective,
            is_approved: c.is_approved
          }))
        : [{ ...EMPTY_COURSE }]
    } : { period_number: i, courses: [{ ...EMPTY_COURSE }] });
  }
  return periods;
}

// ── Sample JSON generator ──────────────────────────────────
function buildSampleJSON(label, count) {
  const periods = [];
  const maxShow = count > 0 ? Math.min(count, 4) : 2;
  for (let i = 1; i <= maxShow; i++) {
    periods.push({
      period_number: i,
      courses: [
        {
          course_name: i === 1 ? "Data Structures" : "Database Management Systems",
          course_code: i === 1 ? "CS201" : "CS301",
          credits: i === 1 ? 4 : 3,
          is_elective: false
        },
        {
          course_name: i === 1 ? "Discrete Mathematics" : "Computer Networks",
          course_code: i === 1 ? "MA202" : "CS302",
          credits: 3,
          is_elective: false
        },
        {
          course_name: i === 1 ? "Environmental Science" : "Open Elective II",
          course_code: i === 1 ? "GE201" : "OE302",
          credits: 2,
          is_elective: true
        }
      ]
    });
  }
  return { periods };
}

// ── JSON Upload Modal Component ────────────────────────────
function JsonUploadModal({ label, structureCount, onImport, onClose }) {
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  const sample = buildSampleJSON(label, structureCount);
  const sampleStr = JSON.stringify(sample, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleStr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const processFile = (f) => {
    setFile(f);
    setError('');
    setParsed(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        if (!json.periods || !Array.isArray(json.periods)) {
          setError('Invalid format: JSON must have a "periods" array. See the sample above.');
          return;
        }
        for (const p of json.periods) {
          if (!p.period_number || !Array.isArray(p.courses)) {
            setError(`Each period must have "period_number" (integer) and "courses" (array).`);
            return;
          }
        }
        setParsed({ periods: normalizeJsonPeriods(json.periods) });
      } catch {
        setError('Failed to parse JSON. Please check the file format.');
      }
    };
    reader.readAsText(f);
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) processFile(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };

  const allCourses = parsed ? parsed.periods.flatMap(p => p.courses.map(c => ({ ...c, period_number: p.period_number }))) : [];
  const totalCredits = allCourses.reduce((s, c) => s + (parseFloat(c.credits) || 0), 0);

  return (
    <div className="json-upload-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="json-upload-modal">
        <div className="json-upload-modal__header">
          <h2>📤 Import Courses from JSON</h2>
          <button className="json-upload-modal__close" onClick={onClose}>×</button>
        </div>

        <div className="json-upload-modal__body">
          {/* Sample JSON */}
          <div className="json-sample-section">
            <h3>📋 Sample JSON Structure</h3>
            <p>
              Your JSON file must follow this structure. Each <strong>period</strong> maps to a {label.toLowerCase()} (<code>period_number</code> = 1, 2, 3…)
              and contains an array of <strong>courses</strong> with name, code, credits, and elective flag.
              Copy the sample below, fill in your data, and save as a <code>.json</code> file.
            </p>
            <ul className="json-field-legend">
              <li><code>period_number</code> — {label} number (integer, required)</li>
              <li><code>course_name</code> — optional (default: <code>course0101</code> for 1st course in {label} 1)</li>
              <li><code>course_code</code> — optional (default: <code>0101</code> = period + course index)</li>
              <li><code>credits</code> — optional (default: <code>0</code>)</li>
              <li><code>is_elective</code> — optional (default: <code>false</code>)</li>
            </ul>
            {structureCount > 4 && (
              <p className="json-sample-note">
                Sample shows 4 of {structureCount} {label.toLowerCase()}s. Add more <code>periods</code> entries up to period_number {structureCount}.
              </p>
            )}
            <div className="json-sample-block">
              <div className="json-sample-block__header">
                <span>courses.json</span>
                <button className={`json-sample-block__copy ${copied ? 'copied' : ''}`} onClick={handleCopy}>
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
              <pre>{sampleStr}</pre>
            </div>
          </div>

          {/* Upload Zone */}
          <div className="json-sample-section">
            <h3>📁 Upload Your JSON File</h3>
            <div
              className={`json-upload-zone ${dragging ? 'dragging' : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <span className="json-upload-zone__icon">📄</span>
              <div className="json-upload-zone__text">
                {file ? 'File selected — click to change' : 'Click to browse or drag & drop'}
              </div>
              <div className="json-upload-zone__hint">Accepts .json files only</div>
              {file && <div className="json-upload-zone__file">📎 {file.name}</div>}
              <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileChange} />
            </div>
          </div>

          {/* Error */}
          {error && <div className="json-upload-error">⚠️ {error}</div>}

          {/* Preview */}
          {parsed && (
            <div className="json-sample-section">
              <h3>✅ Preview ({allCourses.length} courses detected)</h3>
              <div className="json-preview-stats">
                <div className="json-preview-stats__item"><strong>{parsed.periods.length}</strong> {label}s</div>
                <div className="json-preview-stats__item"><strong>{allCourses.length}</strong> Courses</div>
                <div className="json-preview-stats__item"><strong>{totalCredits}</strong> Total Credits</div>
              </div>
              <table className="json-preview-table">
                <thead>
                  <tr>
                    <th>{label}</th>
                    <th>Course Name</th>
                    <th>Code</th>
                    <th>Credits</th>
                    <th>Elective</th>
                  </tr>
                </thead>
                <tbody>
                  {allCourses.map((c, i) => (
                    <tr key={`all-course-${i}`}>
                      <td><span className="period-badge">{c.period_number}</span></td>
                      <td>{c.course_name}</td>
                      <td><code>{c.course_code}</code></td>
                      <td>{c.credits ?? 0}</td>
                      <td>
                        <span className={`elective-badge ${c.is_elective ? 'yes' : 'no'}`}>
                          {c.is_elective ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="json-upload-modal__footer">
          <button className="dept-btn dept-btn--secondary" onClick={onClose}>Cancel</button>
          <button
            className="dept-btn dept-btn--success"
            disabled={!parsed}
            onClick={() => { onImport(parsed); onClose(); }}
          >
            ✅ Import {allCourses.length ? `${allCourses.length} Courses` : 'Courses'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────
export default function EditDepartment() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const syllabusId = searchParams.get('syllabus_id');
  const [syllabuses, setSyllabuses] = useState([]);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState('');
  const [role, setRole] = useState('admin');
  const [deptId, setDeptId] = useState(id);
  const [showJsonModal, setShowJsonModal] = useState(false);

  const [form, setForm] = useState({
    name: '', code: '', department_type: 'semester_wise',
    structure_count: '', description: '', periods: []
  });

  const label = form.department_type === 'semester_wise' ? 'Semester' : 'Year';

  // ── Load Department ────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const user = await getMe();
        setRole(user.role);
        let targetId = id;
        if (!targetId && user.role === 'hod') {
          targetId = user.dept_id;
          setDeptId(targetId);
        }
        if (targetId) {
            const [dept, syls] = await Promise.all([
              departmentCreationAPI.getDetails(targetId, syllabusId),
              syllabusAPI.list(targetId)
            ]);
            const periods = normalizePeriods(dept);
            setSyllabuses(syls);
            setForm({
            name: dept.name || '', code: dept.code || '',
            department_type: dept.department_type || 'semester_wise',
            structure_count: dept.structure_count || '',
            description: dept.description || '',
            periods
          });
          if (user.role === 'hod') {
            setStep(parseInt(dept.structure_count, 10) > 0 ? 2 : 1);
          }
        }
      } catch (err) {
        setErrors([err.message]);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, syllabusId]);

  // ── Updaters ────────────────────────────────────────────
  const updateField = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const generatePeriods = useCallback(() => {
    const count = parseInt(form.structure_count) || 0;
    if (count < 1 || count > 20) return;
    const existing = form.periods || [];
    const periods = [];
    for (let i = 1; i <= count; i++) {
      const prev = existing.find(p => p.period_number === i);
      periods.push(prev || { period_number: i, courses: [{ ...EMPTY_COURSE }] });
    }
    updateField('periods', periods);
  }, [form.structure_count, form.periods]);

  const updatePeriod = (idx, updated) => {
    setForm(f => {
      const periods = [...f.periods];
      periods[idx] = updated;
      return { ...f, periods };
    });
  };

  const copyFromPrevious = (idx) => {
    if (idx < 1) return;
    setForm(f => {
      const periods = [...f.periods];
      const prev = periods[idx - 1];
      periods[idx] = {
        ...periods[idx],
        courses: (prev.courses || []).map(c => ({ ...c, course_code: '' }))
      };
      return { ...f, periods };
    });
  };

  // ── JSON Import Handler ────────────────────────────────────
  const handleJsonImport = (jsonData) => {
    const importedPeriods = jsonData.periods;
    setForm(f => {
      const count = Math.max(parseInt(f.structure_count) || 0, ...importedPeriods.map(p => p.period_number));
      const periods = [];
      for (let i = 1; i <= count; i++) {
        const imported = importedPeriods.find(p => p.period_number === i);
        const existing = f.periods.find(p => p.period_number === i);
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
      return { ...f, structure_count: String(count), periods };
    });
  };

  // ── Validation ──────────────────────────────────────────
  const validateStep = (s) => {
    const errs = [];
    if (s === 0) {
      if (!form.name.trim()) errs.push('Department name is required');
      if (!form.code.trim()) errs.push('Department code is required');
      if (form.code.trim().length < 2) errs.push('Code must be at least 2 characters');
    }
    if (s === 1) {
      const n = parseInt(form.structure_count);
      if (!n || n < 1) errs.push(`Number of ${label.toLowerCase()}s must be at least 1`);
      if (n > 20) errs.push(`Maximum 20 ${label.toLowerCase()}s allowed`);
      if (!form.periods.length) errs.push(`Click "Generate" to create ${label.toLowerCase()} sections`);
    }
    if (s === 2) {
      const allCodes = [];
      form.periods.forEach(p => {
        if (!p.courses) return;
        p.courses.forEach((c, ci) => {
          const hasName = c.course_name && c.course_name.trim();
          const hasCode = c.course_code && c.course_code.trim();
          const hasCredits = c.credits !== '' && c.credits !== undefined && c.credits !== null;
          const isPartial = hasName || hasCode || hasCredits;
          if (!isPartial) return;
          const prefix = `${label} ${p.period_number}, Course ${ci + 1}`;
          if (!hasName) errs.push(`${prefix}: Name is required (or clear all fields to skip)`);
          if (!hasCode) errs.push(`${prefix}: Code is required (or clear all fields to skip)`);
          if (!hasCredits || isNaN(Number(c.credits)) || Number(c.credits) < 0) {
            errs.push(`${prefix}: Credits must be a non-negative number (or clear all fields to skip)`);
          }
          if (hasCode) {
            const norm = c.course_code.trim().toUpperCase();
            if (allCodes.includes(norm)) errs.push(`Duplicate course code: ${norm}`);
            allCodes.push(norm);
          }
        });
      });
    }
    return errs;
  };

  const nextStep = () => {
    const errs = validateStep(step);
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    if (step === 1 && form.periods.length === 0) generatePeriods();
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const prevStep = () => { setErrors([]); setStep(s => Math.max(s - 1, 0)); };

  // ── Submit ──────────────────────────────────────────────
  const handleSubmit = async () => {
    for (let s = 0; s <= 2; s++) {
      const errs = validateStep(s);
      if (errs.length) { setErrors(errs); setStep(s); return; }
    }
    setErrors([]);
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        department_type: form.department_type,
        structure_count: parseInt(form.structure_count),
        description: form.description.trim(),
        periods: form.periods.map(p => ({
          period_number: p.period_number,
          courses: (p.courses || []).filter(c =>
            (c.course_name && c.course_name.trim()) ||
            (c.course_code && c.course_code.trim())
          ).map(c => ({
            course_name: c.course_name.trim(),
            course_code: c.course_code.trim().toUpperCase(),
            credits: parseFloat(c.credits) || 0,
            is_elective: !!c.is_elective
          }))
        })),
        syllabus_id: syllabusId
      };
      await departmentCreationAPI.update(deptId, payload);
      setSuccess('Department updated successfully!');
      setTimeout(() => navigate(role === 'admin' ? '/admin/departments' : '/dashboard?tab=dept'), 1500);
    } catch (e) {
      setErrors([e.message]);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading department details...</div>;
  }

  // ── Render ──────────────────────────────────────────────
  return (
    <div className="dept-wizard">
      {/* Header */}
      <div className="dept-wizard__header">
        <h1>{role === 'admin' ? '🏛️ Edit Department' : '📚 Edit Department Courses'}</h1>
        <div className="dept-wizard__header-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {role === 'admin' && form.periods.some(p => p.courses?.some(c => c.is_approved === false)) && (
            <>
              <button 
                className="dept-btn" 
                style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}
                onClick={async () => {
                  if (!window.confirm('Approve all pending courses for this department?')) return;
                  try {
                    await departmentAPI.approveCourses(deptId);
                    alert('Courses approved successfully');
                    window.location.reload();
                  } catch (e) {
                    alert('Error approving courses: ' + e.message);
                  }
                }}
              >
                ✅ Approve Pending Courses
              </button>
              <button 
                className="dept-btn" 
                style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}
                onClick={async () => {
                  if (!window.confirm('Reject all pending courses for this department?')) return;
                  try {
                    await departmentAPI.rejectCourses(deptId);
                    alert('Courses rejected successfully');
                    window.location.reload();
                  } catch (e) {
                    alert('Error rejecting courses: ' + e.message);
                  }
                }}
              >
                ❌ Reject Pending Courses
              </button>
            </>
          )}
          <button className="dept-btn dept-btn--outline" onClick={() => navigate(role === 'admin' ? '/admin/departments' : '/dashboard?tab=dept')}>
            ← Back
          </button>
        </div>
      </div>

      {syllabuses.length > 0 && (
        <div style={{ padding: '0 2rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155' }}>Editing Curriculum For:</label>
          <select 
            style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: '#1e293b', minWidth: '200px' }}
            value={syllabusId || ''}
            onChange={(e) => {
              if (!window.confirm('Changing syllabus will load its specific curriculum. Unsaved changes will be lost. Continue?')) return;
              const newId = e.target.value;
              if (newId) setSearchParams({ syllabus_id: newId });
              else setSearchParams({});
            }}
          >
            <option value="">Default Syllabus (or Legacy)</option>
            {syllabuses.map(s => (
              <option key={s.id} value={s.id}>{s.name} {s.is_active ? '' : '(Inactive)'}</option>
            ))}
          </select>
        </div>
      )}

      {/* Steps */}
      <div className="dept-steps">
        {STEPS.map((s, i) => (
          <div
            key={`step-${i}`}
            className={`dept-step ${i === step ? 'active' : ''} ${i < step ? 'completed' : ''}`}
            onClick={() => { if (i < step) setStep(i); }}
            style={{ cursor: i < step ? 'pointer' : 'default' }}
          >
            <span className="dept-step__num">{i < step ? '✓' : i + 1}</span>
            {s}
          </div>
        ))}
      </div>

      {/* Alerts */}
      {errors.length > 0 && (
        <div className="dept-alert dept-alert--error">
          <span className="dept-alert__icon">⚠️</span>
          <div>
            <strong>Please fix the following:</strong>
            <ul className="dept-alert__list">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        </div>
      )}
      {success && (
        <div className="dept-alert dept-alert--success">
          <span className="dept-alert__icon">✅</span>
          <span>{success}</span>
        </div>
      )}
      
      {role === 'hod' && form.periods.some(p => p.courses?.some(c => c.is_approved === false)) && (
        <div className="dept-alert dept-alert--info" style={{ background: '#fffbeb', border: '1px solid #fcd34d', color: '#b45309' }}>
          <span className="dept-alert__icon">⏳</span>
          <span><strong>Pending Admin Approval:</strong> Some courses in this curriculum are waiting for administrator approval and won't be available for assignment yet.</span>
        </div>
      )}

      {/* ── STEP 0: Department Info ────────────────────────── */}
      {step === 0 && (
        <div className="dept-card">
          <div className="dept-card__title"><span className="icon">📝</span> Department Information</div>
          <div className="dept-form-grid">
            <div className={`dept-field ${errors.some(e => e.includes('name')) ? 'has-error' : ''}`}>
              <label>Department Name *</label>
              <input type="text" placeholder="e.g. Computer Science and Engineering" value={form.name} onChange={e => updateField('name', e.target.value)} disabled={role === 'hod'} />
            </div>
            <div className={`dept-field ${errors.some(e => e.includes('code') || e.includes('Code')) ? 'has-error' : ''}`}>
              <label>Department Code *</label>
              <input type="text" placeholder="e.g. CSE" value={form.code} onChange={e => updateField('code', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))} maxLength={10} disabled={role === 'hod'} />
              <span className="hint">{form.code.length}/10 — Letters & numbers only</span>
            </div>
            <div className="dept-field dept-form-grid--full">
              <label>Department Type *</label>
              <div className={`dept-radio-group ${role === 'hod' ? 'disabled-group' : ''}`}>
                <div className={`dept-radio ${form.department_type === 'semester_wise' ? 'selected' : ''} ${role === 'hod' ? 'disabled' : ''}`} onClick={() => role !== 'hod' && updateField('department_type', 'semester_wise')}>
                  <span className="dept-radio__emoji">📅</span>
                  <div className="dept-radio__label">Semester Wise</div>
                  <div className="dept-radio__desc">Courses organized by semesters</div>
                </div>
                <div className={`dept-radio ${form.department_type === 'year_wise' ? 'selected' : ''} ${role === 'hod' ? 'disabled' : ''}`} onClick={() => role !== 'hod' && updateField('department_type', 'year_wise')}>
                  <span className="dept-radio__emoji">📆</span>
                  <div className="dept-radio__label">Year Wise</div>
                  <div className="dept-radio__desc">Courses organized by academic years</div>
                </div>
              </div>
            </div>
            <div className="dept-field dept-form-grid--full">
              <label>Description (Optional)</label>
              <textarea placeholder="Brief description of the department..." value={form.description} onChange={e => updateField('description', e.target.value)} maxLength={500} />
              <span className="hint">{form.description.length}/500</span>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 1: Structure ──────────────────────────────── */}
      {step === 1 && (
        <div className="dept-card">
          <div className="dept-card__title"><span className="icon">🏗️</span> Academic Structure</div>
          <div className="dept-form-grid">
            <div className={`dept-field ${errors.some(e => e.includes('Number')) ? 'has-error' : ''}`}>
              <label>Number of {label}s *</label>
              <input type="number" min="1" max="20" placeholder={`e.g. ${form.department_type === 'semester_wise' ? '8' : '4'}`} value={form.structure_count} onChange={e => updateField('structure_count', e.target.value)} />
              <span className="hint">Between 1 and 20</span>
            </div>
            <div className="dept-field" style={{ justifyContent: 'flex-end' }}>
              <button className="dept-btn dept-btn--primary" onClick={generatePeriods} disabled={!form.structure_count || parseInt(form.structure_count) < 1}>
                ⚡ Generate {label} Sections
              </button>
            </div>
          </div>
          {form.periods.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <div className="dept-alert dept-alert--info">
                <span className="dept-alert__icon">ℹ️</span>
                <span>{form.periods.length} {label.toLowerCase()} section{form.periods.length > 1 ? 's' : ''} ready. Proceed to add courses.</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
                {form.periods.map((p, i) => (
                  <span key={`p-badge-${i}`} style={{ padding: '.4rem .85rem', borderRadius: '8px', fontSize: '.82rem', fontWeight: 600, background: 'linear-gradient(135deg, #e6f2ff, #cce5ff)', color: '#0056b3' }}>
                    {label} {p.period_number}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: Courses ────────────────────────────────── */}
      {step === 2 && (
        <div className="dept-card" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div className="dept-card__title"><span className="icon">📚</span> Course Configuration</div>
              <p style={{ color: '#64748b', fontSize: '.88rem', margin: 0 }}>
                Add courses manually for each {label.toLowerCase()}, or import them from a JSON file.
              </p>
            </div>
            <button className="dept-btn dept-btn--primary" onClick={() => setShowJsonModal(true)}>
              📤 Upload JSON
            </button>
          </div>
          {form.periods.map((period, idx) => (
            <PeriodCard
              key={`pcard-${period.period_number}-${idx}`}
              period={period}
              periodIndex={idx}
              label={label}
              onUpdate={(updated) => updatePeriod(idx, updated)}
              onCopyPrevious={copyFromPrevious}
              hasPrevious={idx > 0}
            />
          ))}
        </div>
      )}

      {/* ── STEP 3: Review & Submit ────────────────────────── */}
      {step === 3 && (
        <div>
          <PreviewPanel formData={form} />
          <div className="dept-card">
            <div className="dept-card__title"><span className="icon">📦</span> Example Submission Payload</div>
            <pre style={{ background: '#1e293b', color: '#e2e8f0', padding: '1.25rem', borderRadius: '10px', fontSize: '.78rem', overflow: 'auto', maxHeight: '300px' }}>
              {JSON.stringify({
                name: form.name, code: form.code.toUpperCase(),
                department_type: form.department_type,
                structure_count: parseInt(form.structure_count),
                description: form.description,
                periods: form.periods.map(p => ({
                  period_number: p.period_number,
                  courses: p.courses.map(c => ({
                    course_name: c.course_name, course_code: c.course_code.toUpperCase(),
                    credits: parseFloat(c.credits) || 0, is_elective: !!c.is_elective
                  }))
                }))
              }, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────── */}
      <div className="dept-footer">
        <button className="dept-btn dept-btn--secondary" onClick={prevStep} disabled={step === 0}>
          ← Previous
        </button>
        <div className="dept-footer__right">
          {step < STEPS.length - 1 ? (
            <button className="dept-btn dept-btn--primary" onClick={nextStep}>Next →</button>
          ) : (
            <button className="dept-btn dept-btn--success dept-btn--lg" onClick={handleSubmit} disabled={submitting}>
              {submitting ? '⏳ Saving...' : '🚀 Save Changes'}
            </button>
          )}
        </div>
      </div>

      {/* ── JSON Upload Modal ──────────────────────────────── */}
      {showJsonModal && (
        <JsonUploadModal
          label={label}
          structureCount={parseInt(form.structure_count) || 0}
          onImport={handleJsonImport}
          onClose={() => setShowJsonModal(false)}
        />
      )}
    </div>
  );
}
