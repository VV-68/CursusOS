import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { classAPI, departmentAPI, departmentCreationAPI, profileAPI } from '../../services/api';

function AdminDepartmentBatches() {
  const { id: deptId } = useParams();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeOnly, setActiveOnly] = useState(true);

  // Modals
  const [studentsModal, setStudentsModal] = useState(null); // class object
  const [batchStudents, setBatchStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const [coursesModal, setCoursesModal] = useState(null); // class object
  const [batchCourses, setBatchCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [courseMeta, setCourseMeta] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [allClasses, depts] = await Promise.all([
          classAPI.getAll(),
          departmentAPI.getAll()
        ]);
        
        const currentDept = depts.find(d => d.id === deptId);
        setDepartment(currentDept);
        
        const deptClasses = allClasses.filter(c => c.dept_id === deptId);
        setClasses(deptClasses);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [deptId]);

  const openStudentsModal = async (cls) => {
    setStudentsModal(cls);
    setStudentsLoading(true);
    setBatchStudents([]);
    try {
      const classStudents = await profileAPI.getClassStudents(cls.id);
      setBatchStudents(classStudents);
    } catch (err) {
      alert(err.message);
    } finally {
      setStudentsLoading(false);
    }
  };

  const openCoursesModal = async (cls) => {
    setCoursesModal(cls);
    setCoursesLoading(true);
    setBatchCourses([]);
    setCourseMeta(null);
    try {
      const data = await departmentCreationAPI.getManageCourses(deptId, {
        class_id: cls.id
      });
      // Filter to only show courses for the current active semester/period of the batch
      const currentPeriod = Number(cls.current_semester_number || 1);
      const activeCourses = (data.courses || []).filter(c => 
        Number(c.period_number) === currentPeriod
      );
      
      setBatchCourses(activeCourses);
      setCourseMeta({
        period_label: data.period_label || 'Semester',
        current_period: currentPeriod
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setCoursesLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading batches...</div>;

  const filteredClasses = classes.filter(cls => {
    if (activeOnly && cls.is_active === false) return false;
    return true;
  });

  return (
    <div style={{ padding: '2rem' }}>
      <button 
        style={{ 
          background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', 
          padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', 
          marginBottom: '1.5rem' 
        }} 
        onClick={() => navigate('/admin/departments')}
      >
        ← Back
      </button>
      
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>📚 Batches in {department?.name || 'Department'}</h2>
      
      {/* Filters */}
      <div className="dept-card" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', cursor: 'pointer', color: 'var(--text-primary)' }}>
          <input 
            type="checkbox" 
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            style={{ width: '1.2rem', height: '1.2rem' }}
          />
          Active Batches Only
        </label>
      </div>

      {filteredClasses.length === 0 ? (
        <div className="dept-alert dept-alert--info" style={{ textAlign: 'center' }}>
          No batches found.
        </div>
      ) : (
        <div className="dept-card" style={{ overflowX: 'auto', padding: 0 }}>
          <table className="json-preview-table form-control" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Batch Name</th>
                <th>Year / Sem</th>
                <th>Status</th>
                <th>Advisors</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClasses.map(cls => (
                <tr key={cls.id}>
                  <td style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{cls.name} - {cls.section}</td>
                  <td>
                    Year {cls.year}
                    <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sem {cls.current_semester_number || 1}</span>
                  </td>
                  <td>
                    {cls.is_active === false ? (
                      <span className="elective-badge no">Inactive</span>
                    ) : cls.is_graduated ? (
                      <span className="elective-badge" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>Graduated</span>
                    ) : (
                      <span className="elective-badge yes">Active</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', color: 'var(--text-secondary)' }}>
                      {cls.advisor1_name ? <span style={{ fontSize: '0.85rem' }}>• {cls.advisor1_name}</span> : null}
                      {cls.advisor2_name ? <span style={{ fontSize: '0.85rem' }}>• {cls.advisor2_name}</span> : null}
                      {!cls.advisor1_name && !cls.advisor2_name && <span style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-muted)' }}>No advisors</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'nowrap' }}>
                      <button 
                        onClick={() => openCoursesModal(cls)}
                        className="dept-btn dept-btn--primary"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                      >
                        📘 View Courses
                      </button>
                      <button 
                        onClick={() => openStudentsModal(cls)}
                        className="dept-btn dept-btn--success"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                      >
                        🧑‍🎓 View Students
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Courses Modal */}
      {coursesModal && (
        <div className="json-upload-overlay" onClick={() => setCoursesModal(null)}>
          <div className="json-upload-modal" style={{ maxWidth: '800px', width: '90%', background: 'var(--bg-surface)' }} onClick={e => e.stopPropagation()}>
            <div className="json-upload-modal__header">
              <h2>Course Assignments - {coursesModal.name} ({coursesModal.section})</h2>
              <button className="json-upload-modal__close" onClick={() => setCoursesModal(null)}>×</button>
            </div>
            <div className="json-upload-modal__body">
              {coursesLoading ? (
                <p style={{ color: 'var(--text-muted)' }}>Loading course assignments...</p>
              ) : batchCourses.length === 0 ? (
                <div className="dept-alert dept-alert--info">
                  No courses assigned for this batch's current active {courseMeta?.period_label?.toLowerCase()} ({courseMeta?.current_period}).
                </div>
              ) : (
                <div>
                  <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Showing assignments for current active {courseMeta?.period_label}: <strong>{courseMeta?.current_period}</strong>
                  </p>
                  <table className="json-preview-table form-control">
                    <thead>
                      <tr>
                        <th>Course Code</th>
                        <th>Course Name</th>
                        <th>Faculty Assigned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchCourses.map(c => (
                        <tr key={c.id}>
                          <td><code>{c.course_code}</code></td>
                          <td>{c.course_name}</td>
                          <td>
                            {c.assignment?.faculty1_name || '—'}
                            {c.assignment?.faculty2_name && <span>, {c.assignment.faculty2_name}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Students Modal */}
      {studentsModal && (
        <div className="json-upload-overlay" onClick={() => setStudentsModal(null)}>
          <div className="json-upload-modal" style={{ maxWidth: '800px', width: '90%', background: 'var(--bg-surface)' }} onClick={e => e.stopPropagation()}>
            <div className="json-upload-modal__header">
              <h2>Students - {studentsModal.name} ({studentsModal.section})</h2>
              <button className="json-upload-modal__close" onClick={() => setStudentsModal(null)}>×</button>
            </div>
            <div className="json-upload-modal__body">
              {studentsLoading ? (
                <p style={{ color: 'var(--text-muted)' }}>Loading students...</p>
              ) : batchStudents.length === 0 ? (
                <div className="dept-alert dept-alert--info">
                  No students found in this batch.
                </div>
              ) : (
                <table className="json-preview-table form-control">
                  <thead>
                    <tr>
                      <th>Reg No.</th>
                      <th>Name</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchStudents.map(st => (
                      <tr key={st.user_id}>
                        <td><code>{st.registration_number || 'N/A'}</code></td>
                        <td>{st.full_name}</td>
                        <td>
                          <button 
                            onClick={() => navigate(`/advisor/student/${st.user_id}`)}
                            className="dept-btn dept-btn--secondary"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          >
                            View Full Profile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminDepartmentBatches;
