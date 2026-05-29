import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileAPI, assignmentAPI } from '../../services/api';
import '../admin/CreateDepartment.css'; // Add the CSS import
import FacultyPopup from '../../components/FacultyPopup';

function MyAssignments() {
  const navigate = useNavigate();
  const [courseAssignments, setCourseAssignments] = useState([]);
  const [assignmentsByCourse, setAssignmentsByCourse] = useState({});
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [expandedAssignment, setExpandedAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [currentSemester, setCurrentSemester] = useState(1);
  const [selectedSemester, setSelectedSemester] = useState(null);

  useEffect(() => { fetchInitial(); }, []);
  
  useEffect(() => {
    if (selectedSemester) fetchCoursesForSemester(selectedSemester);
  }, [selectedSemester]);
  
  const fetchInitial = async () => {
    try {
      const profile = await profileAPI.getMyProfile();
      const sem = profile?.current_semester || 1;
      setCurrentSemester(sem);
      setSelectedSemester(sem);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchCoursesForSemester = async (sem) => {
    setLoading(true);
    try {
      let allCA = await profileAPI.getMyCourses();
      allCA = allCA.filter(c => c.period_number === sem);
      setCourseAssignments(allCA);
      
      const allAssignments = await assignmentAPI.listMine();
      const grouped = (allAssignments || []).reduce((acc, a) => {
        const caId = a.course_assignment_id;
        if (!acc[caId]) acc[caId] = [];
        acc[caId].push(a);
        return acc;
      }, {});
      setAssignmentsByCourse(grouped);
      
      if (allCA.length > 0) {
        setExpandedCourse(allCA[0].course_assignment_id);
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const refreshCourseForAssignment = async () => {
    try {
      const allAssignments = await assignmentAPI.listMine();
      const grouped = (allAssignments || []).reduce((acc, a) => {
        const caId = a.course_assignment_id;
        if (!acc[caId]) acc[caId] = [];
        acc[caId].push(a);
        return acc;
      }, {});
      setAssignmentsByCourse(grouped);
    } catch (err) { console.error(err); }
  };

  const toggleCourse = (ca) => {
    setExpandedCourse(expandedCourse === ca.course_assignment_id ? null : ca.course_assignment_id);
  };

  const handleMaterialsClick = (e, ca) => {
    e.stopPropagation();
    navigate(`/student/materials/${ca.course_assignment_id}`);
  };

  const handleSubmit = async (assignmentId) => {
    const file = selectedFiles[assignmentId];
    if (!file) return;
    setUploading(assignmentId);
    setUploadProgress(40);
    setError('');
    try {
      await assignmentAPI.submit(assignmentId, file);
      setUploadProgress(100);
      setSelectedFiles((prev) => ({ ...prev, [assignmentId]: null }));
      await refreshCourseForAssignment();
    } catch (err) { setError(err.message); }
    finally {
      setTimeout(() => { setUploading(null); setUploadProgress(0); }, 400);
    }
  };

  const handleDeleteSubmission = async (assignmentId) => {
    if (!window.confirm('Remove your submission? You can upload again before evaluation.')) return;
    setError('');
    try {
      await assignmentAPI.deleteMySubmission(assignmentId);
      await refreshCourseForAssignment();
    } catch (err) { setError(err.message); }
  };

  const openQuestion = async (assignmentId) => {
    try {
      const { signed_url } = await assignmentAPI.getQuestionUrl(assignmentId);
      if (signed_url) window.open(signed_url, '_blank');
    } catch (err) { setError(err.message); }
  };

  const openMyFile = async (assignmentId) => {
    try {
      const sub = await assignmentAPI.getMySubmission(assignmentId);
      if (sub?.signed_url) window.open(sub.signed_url, '_blank');
    } catch (err) { setError(err.message); }
  };

  const getStatus = (a) => {
    const now = new Date();
    const due = new Date(a.due_date);
    const sub = a.submission;
    if (sub?.is_evaluated || (sub?.marks_awarded !== null && sub?.marks_awarded !== undefined)) {
      return { label: 'Evaluated', color: '#10b981', bg: '#ecfdf5' };
    }
    if (sub) return { label: 'Submitted', color: '#3b82f6', bg: '#eff6ff' };
    if (now > due) return { label: 'Overdue', color: '#ef4444', bg: '#fef2f2' };
    return { label: 'Pending', color: '#f59e0b', bg: '#fffbeb' };
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading your assignments...</div>;

  return (
    <div className="dept-wizard" style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate('/dashboard?tab=academics')}>← Back</button>
      
      <div className="dept-wizard__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: '#007bff', margin: 0 }}>📝 My Assignments</h1>
        {currentSemester > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label style={{ fontWeight: '500', color: '#475569', fontSize: '0.9rem' }}>Semester:</label>
            <select
              value={selectedSemester || ''}
              onChange={(e) => setSelectedSemester(Number(e.target.value))}
              style={{
                padding: '0.4rem 2rem 0.4rem 0.8rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                background: '#fff',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: '#1e293b',
                cursor: 'pointer',
                appearance: 'none',
                backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748b\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.5rem center'
              }}
            >
              {Array.from({ length: currentSemester }, (_, i) => i + 1).map((sem) => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      {error && <div className="dept-alert dept-alert--error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {courseAssignments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: '600', color: '#1e293b' }}>No courses found</p>
          <p>You are not enrolled in any courses this semester.</p>
        </div>
      ) : (
        courseAssignments.map((ca) => {
          const caId = ca.course_assignment_id;
          return (
          <div key={caId} style={{ marginBottom: '2rem' }}>
            <div 
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '1rem 1.25rem', background: expandedCourse === caId ? '#e6f2ff' : '#f8fafc',
                borderRadius: expandedCourse === caId ? '12px 12px 0 0' : '12px', 
                border: '1px solid #e2e8f0', borderBottom: expandedCourse === caId ? 'none' : '1px solid #e2e8f0',
                cursor: 'pointer', transition: 'all 0.2s ease'
              }}
              onClick={() => toggleCourse(ca)}
            >
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: '600', color: '#1e293b' }}>{ca.name} ({ca.code})</div>
                <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                  {ca.faculty1_name && (
                    <FacultyPopup name={ca.faculty1_name} designation={ca.faculty1_designation} email={ca.faculty1_email} phone={ca.faculty1_phone} />
                  )}
                  {ca.faculty2_name && (
                    <>
                      <span>&</span>
                      <FacultyPopup name={ca.faculty2_name} designation={ca.faculty2_designation} email={ca.faculty2_email} phone={ca.faculty2_phone} />
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span
                  style={{ color: '#007bff', fontSize: '0.85rem', fontWeight: '600', textDecoration: 'none', padding: '0.4rem 0.8rem', background: '#fff', borderRadius: '6px', border: '1px solid #b8daff', transition: 'all 0.2s ease' }}
                  onClick={(e) => handleMaterialsClick(e, ca)}
                >
                  📚 Materials
                </span>
                <span style={{ color: '#64748b' }}>{expandedCourse === caId ? '▲' : '▼'}</span>
              </div>
            </div>

            {expandedCourse === caId && (
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '1rem' }}>
                {!assignmentsByCourse[caId] ? (
                  <div style={{ padding: '1.5rem', color: '#64748b', textAlign: 'center' }}>Loading...</div>
                ) : assignmentsByCourse[caId].length === 0 ? (
                  <div style={{ padding: '1.5rem', color: '#64748b', textAlign: 'center', background: '#f8fafc', borderRadius: '8px' }}>No assignments posted for this course</div>
                ) : (
                  assignmentsByCourse[caId].map((a) => {
                    const status = getStatus(a);
                    const isExpanded = expandedAssignment === a.id;
                    const sub = a.submission;
                    const canModify = sub && !sub.is_evaluated;
                    return (
                      <div
                        key={a.id} className="dept-card"
                        style={{ margin: '0 0 1rem 0', cursor: 'pointer', padding: '1.25rem', boxShadow: isExpanded ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
                        onClick={() => setExpandedAssignment(isExpanded ? null : a.id)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <div style={{ fontSize: '1.05rem', fontWeight: '600', color: '#1e293b' }}>{a.title}</div>
                          <span style={{ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', background: status.bg, color: status.color, border: `1px solid ${status.color}40` }}>
                            {status.label}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: isExpanded ? '1rem' : '0' }}>
                          Due: <span style={{ fontWeight: '500', color: '#475569' }}>{formatDate(a.due_date)}</span> • Max: <span style={{ fontWeight: '500', color: '#475569' }}>{a.max_marks} marks</span>
                          {a.allow_late_submission && <span style={{ color: '#d97706', fontWeight: '500' }}> • Late OK</span>}
                          <span style={{ margin: '0 0.5rem' }}>•</span>
                          Posted by: <FacultyPopup 
                            name={a.posted_by} 
                            email={a.posted_by_email} 
                            phone={a.posted_by_phone} 
                            designation={a.posted_by_designation} 
                          />
                        </div>

                        {isExpanded && (
                          <div style={{ marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                            {a.description && <div style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '1rem', lineHeight: '1.5' }}>{a.description}</div>}
                            
                            {a.question_file_name && (
                              <button className="dept-btn dept-btn--outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', width: 'fit-content' }} onClick={(e) => { e.stopPropagation(); openQuestion(a.id); }}>
                                📄 Download Question: {a.question_file_name}
                              </button>
                            )}

                            {sub ? (
                              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '1rem' }} onClick={(e) => e.stopPropagation()}>
                                <div style={{ fontSize: '0.9rem', color: '#059669', fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  ✅ Submitted: {sub.file_name}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                                  {formatDate(sub.submitted_at)}
                                  {sub.is_late && <span style={{ color: '#ef4444', fontWeight: '600', marginLeft: '0.5rem' }}>Late</span>}
                                </div>
                                
                                <button className="dept-btn dept-btn--secondary" onClick={() => openMyFile(a.id)}>
                                  Download My Submission
                                </button>

                                {(sub.is_evaluated || sub.marks_awarded != null) && (
                                  <div style={{ padding: '1rem', background: '#e6f2ff', borderRadius: '8px', border: '1px solid #b8daff', marginTop: '1rem' }}>
                                    <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#007bff' }}>
                                      Marks Obtained: {sub.marks_awarded} / {a.max_marks}
                                    </div>
                                    {sub.feedback && (
                                      <div style={{ fontSize: '0.9rem', color: '#475569', marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                        <span>💬</span> <span>{sub.feedback}</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {canModify && (
                                  <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: '500' }}>Upload a new file to replace your current submission:</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                                      <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.zip,.jpg,.png"
                                        style={{ display: 'block', color: '#475569', fontSize: '0.85rem', border: '1px solid #cbd5e1', padding: '0.4rem', borderRadius: '6px', background: '#fff' }}
                                        onChange={(e) => setSelectedFiles((prev) => ({ ...prev, [a.id]: e.target.files[0] }))}
                                      />
                                      <button
                                        className="dept-btn dept-btn--primary"
                                        disabled={!selectedFiles[a.id] || uploading === a.id}
                                        onClick={() => handleSubmit(a.id)}
                                      >
                                        {uploading === a.id ? 'Uploading...' : 'Resubmit'}
                                      </button>
                                      <button className="dept-btn dept-btn--secondary" style={{ color: '#ef4444', borderColor: '#fca5a5' }} onClick={() => handleDeleteSubmission(a.id)}>
                                        Delete Submission
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #94a3b8', marginTop: '1rem', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '1rem', fontWeight: '500' }}>Upload your assignment submission:</p>
                                <input
                                  type="file"
                                  accept=".pdf,.doc,.docx,.zip,.jpg,.png"
                                  style={{ display: 'block', margin: '0 auto 1rem', color: '#475569', fontSize: '0.85rem', border: '1px solid #cbd5e1', padding: '0.4rem', borderRadius: '6px', background: '#fff' }}
                                  onChange={(e) => setSelectedFiles((prev) => ({ ...prev, [a.id]: e.target.files[0] }))}
                                />
                                {uploading === a.id ? (
                                  <div style={{ width: '100%', maxWidth: '300px', margin: '0 auto', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#007bff', transition: 'width 0.3s ease' }} />
                                  </div>
                                ) : (
                                  <button
                                    className="dept-btn dept-btn--success"
                                    disabled={!selectedFiles[a.id]}
                                    onClick={() => handleSubmit(a.id)}
                                  >
                                    📤 Submit Assignment
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
          );
        })
      )}
    </div>
  );
}

export default MyAssignments;
