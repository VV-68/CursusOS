import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  departmentCreationAPI, getMe, userAPI, classAPI, semesterAPI, courseAPI
} from '../../services/api';
import '../admin/CreateDepartment.css';

function Courses() {
  const [deptId, setDeptId] = useState(null);
  const [periodLabel, setPeriodLabel] = useState('Semester');
  const [periods, setPeriods] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [periodFilter, setPeriodFilter] = useState('');
  const [semesters, setSemesters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  const [assignModal, setAssignModal] = useState(null);
  const [assignForm, setAssignForm] = useState({ faculty_id: '' });
  const [assigning, setAssigning] = useState(false);
  const periodInitialized = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const user = await getMe();
        setDeptId(user.dept_id);
        const [semData, classData, userData] = await Promise.all([
          semesterAPI.getAll(),
          classAPI.getAll(),
          userAPI.getAll()
        ]);
        setSemesters(semData);
        setClasses(classData);
        setFaculty(userData.filter(u => u.role === 'faculty' || u.role === 'advisor'));
        const active = semData.find(s => s.is_active);
        if (active) setSelectedSemester(active.id);
        if (classData.length) setSelectedClass(classData[0].id);
      } catch (err) {
        setError(err.message);
      }
    })();
  }, []);

  const loadCourses = useCallback(async () => {
    if (!deptId) return;
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (periodFilter) params.period_number = periodFilter;
      if (selectedClass) params.class_id = selectedClass;
      if (selectedSemester) params.semester_id = selectedSemester;
      const data = await departmentCreationAPI.getManageCourses(deptId, params);
      setPeriodLabel(data.period_label || 'Semester');
      setPeriods(data.periods || []);
      setCourses(data.courses || []);
      if (!periodInitialized.current && data.periods?.length) {
        setPeriodFilter(String(data.periods[0].period_number));
        periodInitialized.current = true;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [deptId, periodFilter, selectedClass, selectedSemester]);

  useEffect(() => {
    if (deptId) loadCourses();
  }, [deptId, loadCourses]);

  const openAssign = (course) => {
    setAssignModal(course);
    setAssignForm({ faculty_id: course.assignment?.faculty_id || '' });
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignModal || !selectedClass || !selectedSemester) {
      alert('Select a class and semester first');
      return;
    }
    setAssigning(true);
    try {
      await departmentCreationAPI.assignFaculty(deptId, {
        department_course_id: assignModal.id,
        faculty_id: assignForm.faculty_id,
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

  const filteredCourses = periodFilter
    ? courses.filter(c => String(c.period_number) === String(periodFilter))
    : courses;

  return (
    <div className="dept-wizard" style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem' }}>
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

      <div className="dept-card">
        <div className="dept-card__title"><span className="icon">🔍</span> Filters</div>
        <div className="dept-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="dept-field">
            <label>{periodLabel}</label>
            <select
              value={periodFilter}
              onChange={e => setPeriodFilter(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%' }}
            >
              <option value="">All {periodLabel}s</option>
              {periods.map(p => (
                <option key={p.period_number} value={p.period_number}>
                  {periodLabel} {p.period_number}
                </option>
              ))}
            </select>
          </div>
          <div className="dept-field">
            <label>Academic Semester</label>
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
          <div className="dept-field">
            <label>Class (for assignments)</label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%' }}
            >
              <option value="">Select class…</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} — {c.section} (Year {c.year})</option>
              ))}
            </select>
          </div>
        </div>
        <p style={{ fontSize: '.82rem', color: '#64748b', margin: '1rem 0 0' }}>
          Courses are listed by {periodLabel.toLowerCase()}. Assign faculty per class and semester to enable timetable scheduling.
        </p>
      </div>

      <div className="dept-card" style={{ marginTop: '1rem' }}>
        <div className="dept-card__title" style={{ marginBottom: '1rem' }}>
          <span className="icon">📋</span>
          {periodFilter ? `${periodLabel} ${periodFilter} Courses` : 'All Courses'}
          <span style={{ fontWeight: 400, color: '#64748b', marginLeft: '0.5rem' }}>
            ({filteredCourses.length})
          </span>
        </div>

        {loading ? (
          <p style={{ color: '#64748b' }}>Loading courses…</p>
        ) : filteredCourses.length === 0 ? (
          <div className="dept-alert dept-alert--info">
            <span className="dept-alert__icon">ℹ️</span>
            <span>
              No courses found.
              {' '}
              <Link to="/hod/department/edit">Add courses</Link>
            </span>
          </div>
        ) : (
          <table className="json-preview-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>{periodLabel}</th>
                <th>Code</th>
                <th>Course Name</th>
                <th>Credits</th>
                <th>Elective</th>
                <th>Faculty</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map(c => (
                <tr key={c.id}>
                  <td><span className="period-badge">{c.period_number}</span></td>
                  <td><code>{c.course_code}</code></td>
                  <td>{c.course_name}</td>
                  <td>{c.credits}</td>
                  <td>
                    <span className={`elective-badge ${c.is_elective ? 'yes' : 'no'}`}>
                      {c.is_elective ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>{c.assignment?.faculty_name || '—'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      className="dept-btn dept-btn--primary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '.8rem' }}
                      onClick={() => openAssign(c)}
                      disabled={!selectedClass || !selectedSemester}
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
        )}
      </div>

      {assignModal && (
        <div className="json-upload-overlay" onClick={(e) => e.target === e.currentTarget && setAssignModal(null)}>
          <div className="json-upload-modal" style={{ maxWidth: '480px' }}>
            <div className="json-upload-modal__header">
              <h2>Assign Faculty</h2>
              <button type="button" className="json-upload-modal__close" onClick={() => setAssignModal(null)}>×</button>
            </div>
            <form id="assign-faculty-form" onSubmit={handleAssign} className="json-upload-modal__body">
              <p style={{ margin: '0 0 1rem', color: '#475569' }}>
                <strong>{assignModal.course_code}</strong> — {assignModal.course_name}
                <br />
                <span style={{ fontSize: '.85rem' }}>{periodLabel} {assignModal.period_number}</span>
              </p>
              <div className="dept-field">
                <label>Faculty *</label>
                <select
                  value={assignForm.faculty_id}
                  onChange={e => setAssignForm({ faculty_id: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  <option value="">Select faculty…</option>
                  {faculty.map(f => (
                    <option key={f.id} value={f.id}>{f.full_name} ({f.role})</option>
                  ))}
                </select>
              </div>
            </form>
            <div className="json-upload-modal__footer">
              <button type="button" className="dept-btn dept-btn--secondary" onClick={() => setAssignModal(null)}>Cancel</button>
              <button type="submit" form="assign-faculty-form" className="dept-btn dept-btn--success" disabled={assigning}>
                {assigning ? 'Saving…' : 'Save Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Courses;
