import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import {
  departmentCreationAPI, getMe, userAPI, classAPI, semesterAPI, courseAPI
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

  const [semesters, setSemesters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  const [assignModal, setAssignModal] = useState(null);
  const [assignForm, setAssignForm] = useState({ faculty1_id: '', faculty2_id: '' });
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const user = await getMe();
        setDeptId(user.dept_id);
        const [semData, classData, userData] = await Promise.all([
          semesterAPI.getAll().catch(() => []),
          classAPI.getAll(),
          userAPI.getAll()
        ]);
        setSemesters(semData);
        setClasses(classData);
        setFaculty(userData.filter(u => u.role === 'faculty' || u.role === 'advisor' || u.role === 'hod'));
        const active = semData.find(s => s.is_active);
        if (active) setSelectedSemester(active.id);
        else if (semData.length) setSelectedSemester(semData[0].id);
      } catch (err) {
        setError(err.message);
      }
    })();
  }, []);

  const loadCourses = useCallback(async () => {
    if (!deptId || !selectedClass || !selectedSemester) {
      setCourses([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await departmentCreationAPI.getManageCourses(deptId, {
        class_id: selectedClass,
        semester_id: selectedSemester
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
  }, [deptId, selectedClass, selectedSemester]);

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
    if (!assignModal || !selectedClass || !selectedSemester) return;
    setAssigning(true);
    try {
      await departmentCreationAPI.assignFaculty(deptId, {
        department_course_id: assignModal.id,
        faculty1_id: assignForm.faculty1_id,
        faculty2_id: assignForm.faculty2_id,
        class_id: selectedClass,
        semester_id: selectedSemester
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

  const coursesByPeriod = groupCoursesByPeriod(courses, applicablePeriods);

  const canShowCourses = selectedClass && selectedSemester;

  return (
    <div className="dept-wizard" style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate('/dashboard?tab=dept')}>← Back</button>
      <div className="dept-wizard__header">
        <h1>📚 Manage Department Courses</h1>
        <div className="dept-wizard__header-actions">
          <Link to="/hod/department/edit" className="dept-btn dept-btn--outline">
            ✏️ Edit / Upload Courses
          </Link>
          <Link to="/dashboard" className="dept-btn dept-btn--secondary">← Dashboard</Link>
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
          <div className="dept-field">
            <label>Academic Semester *</label>
            <select
              value={selectedSemester}
              onChange={e => setSelectedSemester(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%' }}
            >
              <option value="">Select semester…</option>
              {semesters.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.is_active ? '(Active)' : ''}
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
            Select a class and academic semester to view courses for that class year.
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
                <table className="json-preview-table" className="form-control">
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
    </div>
  );
}

export default Courses;
