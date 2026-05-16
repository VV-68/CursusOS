import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileAPI, assignmentAPI } from '../../services/api';

const s = {
  page: { padding: '2rem', maxWidth: '1100px', margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: '700', background: 'linear-gradient(135deg, #f97316, #fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '1.5rem' },
  courseSection: { marginBottom: '2rem' },
  courseHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0.75rem 1.25rem', background: 'rgba(51,65,85,0.4)',
    borderRadius: '10px 10px 0 0', borderBottom: '2px solid rgba(102,126,234,0.3)',
    cursor: 'pointer',
  },
  courseName: { fontSize: '1rem', fontWeight: '600', color: '#e2e8f0' },
  courseCode: { color: '#94a3b8', fontSize: '0.8rem' },
  matLink: { color: '#818cf8', fontSize: '0.8rem', textDecoration: 'none', cursor: 'pointer' },
  assignmentList: { background: 'rgba(30,41,59,0.6)', borderRadius: '0 0 10px 10px', padding: '0.5rem' },
  card: {
    background: 'rgba(15,23,42,0.6)', borderRadius: '10px', padding: '1.25rem',
    margin: '0.5rem', border: '1px solid rgba(51,65,85,0.5)',
    transition: 'all 0.2s ease',
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' },
  cardTitle: { fontSize: '1rem', fontWeight: '600', color: '#f1f5f9' },
  badge: (color) => ({ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '700', background: `${color}22`, color }),
  cardMeta: { fontSize: '0.82rem', color: '#64748b', marginBottom: '0.75rem' },
  cardDesc: { fontSize: '0.88rem', color: '#94a3b8', marginBottom: '1rem', lineHeight: '1.4' },
  submitArea: {
    padding: '1rem', background: 'rgba(51,65,85,0.3)', borderRadius: '8px',
    border: '1px dashed rgba(100,116,139,0.4)', marginTop: '0.75rem',
  },
  fileInput: { display: 'block', marginBottom: '0.75rem', color: '#94a3b8', fontSize: '0.85rem' },
  submitBtn: { padding: '0.5rem 1.2rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', marginRight: '0.5rem' },
  secondaryBtn: { padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #475569', cursor: 'pointer', fontWeight: '500', fontSize: '0.85rem', background: 'transparent', color: '#94a3b8' },
  submittedBox: {
    padding: '0.75rem 1rem', background: 'rgba(34,197,94,0.1)', borderRadius: '8px',
    border: '1px solid rgba(34,197,94,0.2)', marginTop: '0.75rem',
  },
  evBox: {
    padding: '0.75rem 1rem', background: 'rgba(102,126,234,0.1)', borderRadius: '8px',
    border: '1px solid rgba(102,126,234,0.2)', marginTop: '0.5rem',
  },
  linkBtn: { background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: '0.85rem', padding: 0, marginTop: '0.35rem' },
  loading: { textAlign: 'center', padding: '3rem', color: '#94a3b8' },
  error: { padding: '0.75rem', background: 'rgba(239,68,68,0.1)', color: '#f87171', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' },
  empty: { textAlign: 'center', padding: '3rem', color: '#64748b', background: 'rgba(30,41,59,0.5)', borderRadius: '12px' },
  progressBar: { width: '100%', height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden', marginTop: '0.5rem' },
  progressFill: (pct) => ({ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #667eea, #764ba2)', transition: 'width 0.3s ease' }),
};

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

  useEffect(() => { fetchCourseAssignments(); }, []);

  const fetchCourseAssignments = async () => {
    try {
      const allCA = await profileAPI.getMyCourses();
      setCourseAssignments(allCA);
      if (allCA.length > 0) {
        const firstId = allCA[0].course_assignment_id;
        setExpandedCourse(firstId);
        await loadAssignments(firstId);
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const loadAssignments = async (courseAssignmentId) => {
    try {
      const data = await assignmentAPI.listByCourse(courseAssignmentId);
      setAssignmentsByCourse((prev) => ({ ...prev, [courseAssignmentId]: data }));
    } catch (err) { console.error(err); }
  };

  const toggleCourse = async (id) => {
    if (expandedCourse === id) {
      setExpandedCourse(null);
    } else {
      setExpandedCourse(id);
      if (!assignmentsByCourse[id]) await loadAssignments(id);
    }
  };

  const refreshCourseForAssignment = async (assignmentId) => {
    const courseId = Object.keys(assignmentsByCourse).find((k) =>
      assignmentsByCourse[k]?.some((a) => a.id === assignmentId)
    );
    if (courseId) await loadAssignments(courseId);
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
      await refreshCourseForAssignment(assignmentId);
    } catch (err) { setError(err.message); }
    finally {
      setTimeout(() => { setUploading(null); setUploadProgress(0); }, 400);
    }
  };

  const handleDeleteSubmission = async (assignmentId) => {
    if (!confirm('Remove your submission? You can upload again before evaluation.')) return;
    setError('');
    try {
      await assignmentAPI.deleteMySubmission(assignmentId);
      await refreshCourseForAssignment(assignmentId);
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
    if (a.is_evaluated || (a.marks_awarded !== null && a.marks_awarded !== undefined)) {
      return { label: 'Evaluated', color: '#4ade80' };
    }
    if (a.submission_id) return { label: 'Submitted', color: '#60a5fa' };
    if (now > due) return { label: 'Overdue', color: '#f87171' };
    return { label: 'Pending', color: '#fbbf24' };
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  if (loading) return <div style={s.loading}>Loading your assignments...</div>;

  return (
    <div style={s.page}>
      <h1 style={s.title}>My Assignments</h1>
      {error && <div style={s.error}>{error}</div>}

      {courseAssignments.length === 0 ? (
        <div style={s.empty}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No courses found</p>
          <p>You are not enrolled in any courses this semester.</p>
        </div>
      ) : (
        courseAssignments.map((ca) => {
          const caId = ca.course_assignment_id;
          return (
          <div key={caId} style={s.courseSection}>
            <div style={s.courseHeader} onClick={() => toggleCourse(caId)}>
              <div>
                <div style={s.courseName}>{ca.name} ({ca.code})</div>
                <div style={s.courseCode}>
                  {ca.faculty1_name}{ca.faculty2_name ? ` & ${ca.faculty2_name}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span
                  style={s.matLink}
                  onClick={(e) => { e.stopPropagation(); navigate(`/student/materials/${caId}`); }}
                >
                  📚 Materials
                </span>
                <span style={{ color: '#64748b' }}>{expandedCourse === caId ? '▲' : '▼'}</span>
              </div>
            </div>

            {expandedCourse === caId && (
              <div style={s.assignmentList}>
                {!assignmentsByCourse[caId] ? (
                  <div style={{ padding: '1rem', color: '#64748b', textAlign: 'center' }}>Loading...</div>
                ) : assignmentsByCourse[caId].length === 0 ? (
                  <div style={{ padding: '1rem', color: '#64748b', textAlign: 'center' }}>No assignments posted</div>
                ) : (
                  assignmentsByCourse[caId].map((a) => {
                    const status = getStatus(a);
                    const isExpanded = expandedAssignment === a.id;
                    const canModify = a.submission_id && !a.is_evaluated;
                    return (
                      <div
                        key={a.id} style={s.card}
                        onClick={() => setExpandedAssignment(isExpanded ? null : a.id)}
                      >
                        <div style={s.cardHeader}>
                          <div style={s.cardTitle}>{a.title}</div>
                          <span style={s.badge(status.color)}>{status.label}</span>
                        </div>
                        <div style={s.cardMeta}>
                          Due: {formatDate(a.due_date)} • Max: {a.max_marks} marks
                          {a.allow_late_submission && <span style={{ color: '#fbbf24' }}> • Late OK</span>}
                        </div>

                        {isExpanded && (
                          <>
                            {a.description && <div style={s.cardDesc}>{a.description}</div>}
                            {a.question_file_name && (
                              <button style={s.linkBtn} onClick={(e) => { e.stopPropagation(); openQuestion(a.id); }}>
                                📄 Download question: {a.question_file_name}
                              </button>
                            )}

                            {a.submission_id ? (
                              <div style={s.submittedBox} onClick={(e) => e.stopPropagation()}>
                                <div style={{ fontSize: '0.88rem', color: '#4ade80', fontWeight: '600', marginBottom: '0.35rem' }}>
                                  ✅ Submitted: {a.file_name}
                                </div>
                                <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                                  {formatDate(a.submitted_at)}
                                  {a.is_late && <span style={s.badge('#f87171')}> Late</span>}
                                </div>
                                <button style={s.linkBtn} onClick={() => openMyFile(a.id)}>Download my submission</button>

                                {(a.is_evaluated || a.marks_awarded != null) && (
                                  <div style={s.evBox}>
                                    <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#818cf8' }}>
                                      Marks: {a.marks_awarded} / {a.max_marks}
                                    </div>
                                    {a.feedback && (
                                      <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.35rem' }}>
                                        💬 {a.feedback}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {canModify && (
                                  <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <input
                                      type="file"
                                      accept=".pdf,.doc,.docx,.zip,.jpg,.png"
                                      style={s.fileInput}
                                      onChange={(e) => setSelectedFiles((prev) => ({ ...prev, [a.id]: e.target.files[0] }))}
                                    />
                                    <button
                                      style={s.submitBtn}
                                      disabled={!selectedFiles[a.id] || uploading === a.id}
                                      onClick={() => handleSubmit(a.id)}
                                    >
                                      Resubmit
                                    </button>
                                    <button style={s.secondaryBtn} onClick={() => handleDeleteSubmission(a.id)}>
                                      Delete submission
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div style={s.submitArea} onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="file"
                                  accept=".pdf,.doc,.docx,.zip,.jpg,.png"
                                  style={s.fileInput}
                                  onChange={(e) => setSelectedFiles((prev) => ({ ...prev, [a.id]: e.target.files[0] }))}
                                />
                                {uploading === a.id ? (
                                  <div style={s.progressBar}>
                                    <div style={s.progressFill(uploadProgress)} />
                                  </div>
                                ) : (
                                  <button
                                    style={{ ...s.submitBtn, opacity: selectedFiles[a.id] ? 1 : 0.5 }}
                                    disabled={!selectedFiles[a.id]}
                                    onClick={() => handleSubmit(a.id)}
                                  >
                                    📤 Submit Assignment
                                  </button>
                                )}
                              </div>
                            )}
                          </>
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
