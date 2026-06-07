import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import {
  departmentCreationAPI, getMe, userAPI, classAPI, courseAPI, syllabusAPI
} from '../../services/api';
import { periodLabel } from '../../utils/periodUtils';
import '../admin/CreateDepartment.css';

function groupCoursesByPeriod(courses, applicablePeriods) {
  const periodNumbers = applicablePeriods?.length
    ? applicablePeriods
    : [...new Set(courses.map(c => Number(c.period_number)))].filter(Boolean).sort((a, b) => a - b);
  return periodNumbers.map(pn => ({
    period_number: pn,
    courses: courses.filter(c => Number(c.period_number) === Number(pn))
  }));
}

function Courses() {
  const navigate = useNavigate();
  const [deptId, setDeptId] = useState(null);
  const [deptType, setDeptType] = useState('semester_wise');
  const [periodLabelText, setPeriodLabelText] = useState('Semester');
  const [applicablePeriods, setApplicablePeriods] = useState([]);
  const [selectedClassMeta, setSelectedClassMeta] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [classes, setClasses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');

  const [assignModal, setAssignModal] = useState(null);
  const [assignForm, setAssignForm] = useState({ faculty1_id: '', faculty2_id: '' });
  const [assigning, setAssigning] = useState(false);

  // Syllabus create modal
  const [showSyllabusModal, setShowSyllabusModal] = useState(false);
  const [syllabusForm, setSyllabusForm] = useState({ name: '', description: '' });
  const [syllabusCreating, setSyllabusCreating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const user = await getMe();
        setDeptId(user.dept_id);
        const [classData, userData] = await Promise.all([
          classAPI.getAll(),
          userAPI.getAll()
        ]);
        setClasses(classData.filter(c => c.is_active !== false));
        setFaculty(userData.filter(u => u.role === 'faculty' || u.role === 'advisor' || u.role === 'hod'));
      } catch (err) {
        setError(err.message);
      }
    })();
  }, []);

  const loadCourses = useCallback(async () => {
    if (!deptId || !selectedClass) {
      setCourses([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await departmentCreationAPI.getManageCourses(deptId, {
        class_id: selectedClass
      });
      setDeptType(data.department?.department_type || 'semester_wise');
      setPeriodLabelText(data.period_label || periodLabel(data.department?.department_type));
      setApplicablePeriods(data.applicable_periods || []);
      setSelectedClassMeta(data.class);
      setCourses(data.courses || []);
    } catch (err) {
      setError(err.message);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [deptId, selectedClass]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const openAssign = (course) => {

    setAssignModal(course);
    setAssignForm({ 
      faculty1_id: course.assignment?.faculty1_id || '',
      faculty2_id: course.assignment?.faculty2_id || ''
    });
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignModal || !selectedClass) return;
    setAssigning(true);
    try {
      await departmentCreationAPI.assignFaculty(deptId, {
        department_course_id: assignModal.id,
        faculty1_id: assignForm.faculty1_id,
        faculty2_id: assignForm.faculty2_id,
        class_id: selectedClass
      });
      setAssignModal(null);
      loadCourses();
    } catch (err) {
      alert(err.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    if (!window.confirm('Remove this faculty assignment?')) return;
    try {
      await courseAPI.removeAssignment(assignmentId);
      loadCourses();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateSyllabus = async (e) => {
    e.preventDefault();
    if (!syllabusForm.name.trim()) return;
    setSyllabusCreating(true);
    try {
      const created = await syllabusAPI.create(syllabusForm);
      setShowSyllabusModal(false);
      setSyllabusForm({ name: '', description: '' });
      // Redirect to course upload page for the new syllabus
      navigate(`/hod/department/edit?syllabus_id=${created.id}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setSyllabusCreating(false);
    }
  };

  const coursesByPeriod = groupCoursesByPeriod(courses, applicablePeriods);

  const canShowCourses = !!selectedClass;

  return (
    <div className="dept-wizard" style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate('/dashboard?tab=dept')}>← Back</button>
      <div className="dept-wizard__header">
        <h1>📚 Manage Department Courses</h1>
        <div className="dept-wizard__header-actions">
          <button
            onClick={() => setShowSyllabusModal(true)}
            style={{
              padding: '0.45rem 1rem',
              background: '#8b5cf6',
              color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer',
              fontWeight: 600, fontSize: '.9rem',
              boxShadow: '0 2px 8px rgba(139,92,246,.25)'
            }}
          >
            📑 New Syllabus
          </button>
          <Link to="/hod/department/edit" className="dept-btn dept-btn--outline">
            ✏️ Edit / Upload Courses
          </Link>
          <Link to="/dashboard?tab=dept" className="dept-btn dept-btn--secondary">← Dashboard</Link>
        </div>
      </div>

      {error && (
        <div className="dept-alert dept-alert--error">
          <span className="dept-alert__icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <h2 style={{ marginTop: '2rem', marginBottom: '1rem', color: '#1e293b', fontSize: '1.25rem' }}>Assign Faculty</h2>
      <div className="dept-card">
        <div className="dept-card__title"><span className="icon">🔍</span> Select Class & Semester</div>
        <div className="dept-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div className="dept-field">
            <label>Class *</label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%' }}
            >
              <option value="">Select class…</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.section} (Year {c.year})
                </option>
              ))}
            </select>
          </div>

        </div>
        {canShowCourses && applicablePeriods.length > 0 && (
          <div className="dept-alert dept-alert--info" style={{ marginTop: '1rem' }}>
            <span className="dept-alert__icon">ℹ️</span>
            <span>
              Showing courses for <strong>Year {selectedClassMeta?.year}</strong>
              {' '}({applicablePeriods.map(p => `${periodLabelText} ${p}`).join(', ')})
            </span>
          </div>
        )}
        {!canShowCourses && (
          <p style={{ fontSize: '.82rem', color: '#64748b', margin: '1rem 0 0' }}>
            Select a class to view courses for that class year.
          </p>
        )}
      </div>

      {canShowCourses && (
        <div className="dept-card" style={{ marginTop: '1rem' }}>
          {loading ? (
            <p style={{ color: '#64748b' }}>Loading courses…</p>
          ) : courses.length === 0 ? (
            <div className="dept-alert dept-alert--info">
              <span className="dept-alert__icon">ℹ️</span>
              <span>
                No courses for this class year.
                <Link to="/hod/department/edit" style={{ marginLeft: '0.5rem' }}>Add courses</Link>
              </span>
            </div>
          ) : (
            coursesByPeriod.map(group => (
              <div key={group.period_number} style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', color: '#0056b3', marginBottom: '0.75rem' }}>
                  {periodLabelText} {group.period_number}
                  <span style={{ fontWeight: 400, color: '#64748b', marginLeft: '0.5rem' }}>
                    ({group.courses.length} courses)
                  </span>
                </h3>
                <table className="json-preview-table form-control">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Course Name</th>
                      <th>Credits</th>
                      <th>Elective</th>
                      <th>Faculty</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.courses.map(c => (
                      <tr key={c.id}>
                        <td><code>{c.course_code}</code></td>
                        <td>{c.course_name}</td>
                        <td>{c.credits}</td>
                        <td>
                          <span className={`elective-badge ${c.is_elective ? 'yes' : 'no'}`}>
                            {c.is_elective ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td>
                          {c.assignment?.faculty1_name || '—'}
                          {c.assignment?.faculty2_name && <span>, {c.assignment.faculty2_name}</span>}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <button
                            type="button"
                            className="dept-btn dept-btn--primary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '.8rem' }}
                            onClick={() => openAssign(c)}
                          >
                            Assign Faculty
                          </button>
                          {c.assignment?.assignment_id && (
                            <button
                              type="button"
                              className="dept-btn dept-btn--secondary"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '.8rem', marginLeft: '0.35rem', color: '#dc2626' }}
                              onClick={() => handleRemoveAssignment(c.assignment.assignment_id)}
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      )}

      {assignModal && (
        <div className="json-upload-overlay" onClick={(e) => e.target === e.currentTarget && setAssignModal(null)}>
          <div className="json-upload-modal" style={{ maxWidth: '480px' }}>
            <div className="json-upload-modal__header">
              <h2>Assign Faculty</h2>
              <button type="button" className="json-upload-modal__close" onClick={() => setAssignModal(null)}>×</button>
            </div>
            <form onSubmit={handleAssign} className="json-upload-modal__body">
              <p style={{ margin: '0 0 1rem', color: '#475569' }}>
                <strong>{assignModal.course_code}</strong> — {assignModal.course_name}
                <br />
                <span style={{ fontSize: '.85rem' }}>{periodLabelText} {assignModal.period_number}</span>
              </p>
              <div className="dept-field">
                <label>Faculty 1</label>
                <select
                  value={assignForm.faculty1_id}
                  onChange={e => setAssignForm({ ...assignForm, faculty1_id: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '1rem' }}
                >
                  <option value="">Select faculty 1…</option>
                  {faculty.map(f => (
                    <option key={f.id} value={f.id}>{f.full_name} ({f.role})</option>
                  ))}
                </select>
                <label>Faculty 2 (Optional)</label>
                <select
                  value={assignForm.faculty2_id}
                  onChange={e => setAssignForm({ ...assignForm, faculty2_id: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  <option value="">Select faculty 2…</option>
                  {faculty.map(f => (
                    <option key={f.id} value={f.id}>{f.full_name} ({f.role})</option>
                  ))}
                </select>
              </div>
              <div className="json-upload-modal__footer" style={{ padding: 0, border: 'none', marginTop: '1rem' }}>
                <button type="button" className="dept-btn dept-btn--secondary" onClick={() => setAssignModal(null)}>Cancel</button>
                <button type="submit" className="dept-btn dept-btn--success" disabled={assigning}>
                  {assigning ? 'Saving…' : 'Save Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── Syllabus Create Modal ── */}
      {showSyllabusModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,86,179,0.15)', backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem' }}
          onClick={(e) => e.target === e.currentTarget && setShowSyllabusModal(false)}>
          <div style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: '20px', padding: '2rem', width: '90%', maxWidth: '480px', boxShadow: '0 25px 50px -12px rgba(0,123,255,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>📑 Create New Syllabus</h2>
              <button onClick={() => setShowSyllabusModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#1e40af' }}>
              ℹ️ After creating, you'll be taken to upload courses for this syllabus.
            </div>
            <form onSubmit={handleCreateSyllabus}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 600, fontSize: '0.88rem' }}>Syllabus Name *</label>
                <input type="text" placeholder="e.g. 2024 Scheme" value={syllabusForm.name}
                  onChange={e => setSyllabusForm({ ...syllabusForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  required />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 600, fontSize: '0.88rem' }}>Description</label>
                <textarea placeholder="Optional description..." value={syllabusForm.description}
                  onChange={e => setSyllabusForm({ ...syllabusForm, description: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '70px', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowSyllabusModal(false)}
                  style={{ padding: '0.5rem 1rem', background: '#64748b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" disabled={syllabusCreating}
                  style={{ padding: '0.5rem 1rem', background: syllabusCreating ? '#94a3b8' : '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', cursor: syllabusCreating ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                  {syllabusCreating ? '⏳ Creating…' : '✓ Create & Upload Courses'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Courses;
