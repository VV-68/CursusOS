import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assignmentAPI } from '../../services/api';
import CourseSemesterSelector from '../../components/CourseSemesterSelector';

const s = {
  page: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
  title: { fontSize: '1.8rem', fontWeight: '800', color: '#1e293b', letterSpacing: '-0.025em' },
  backBtn: { background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.2s' },
  newBtn: { background: 'linear-gradient(135deg, #007bff, #0056b3)', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(0, 123, 255, 0.2)' },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  th: { padding: '1rem', textAlign: 'left', background: '#f8fafc', color: '#64748b', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' },
  td: { padding: '1rem', borderBottom: '1px solid #f1f5f9', color: '#334155', fontSize: '0.9rem' },
  badge: (color) => ({ display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '700', background: `${color}15`, color }),
  toggleBtn: (active) => ({ padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', background: active ? '#dcfce7' : '#fee2e2', color: active ? '#15803d' : '#b91c1c' }),
  actionBtn: { padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', background: '#fff', color: '#007bff', marginRight: '0.5rem', transition: 'all 0.2s' },
  // Modal
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' },
  modal: { background: '#ffffff', borderRadius: '16px', padding: '2.5rem', width: '90%', maxWidth: '550px', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontSize: '1.5rem', fontWeight: '800', color: '#1e293b', marginBottom: '1.5rem', letterSpacing: '-0.025em' },
  field: { marginBottom: '1.25rem' },
  label: { display: 'block', color: '#475569', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: '600' },
  input: { width: '100%', padding: '0.75rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#1e293b', fontSize: '0.95rem', boxSizing: 'border-box', transition: 'all 0.2s' },
  textarea: { width: '100%', padding: '0.75rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#1e293b', fontSize: '0.95rem', minHeight: '100px', resize: 'vertical', boxSizing: 'border-box' },
  checkRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' },
  modalActions: { display: 'flex', gap: '1rem', marginTop: '2rem' },
  modalBtn: (bg) => ({ flex: 1, padding: '0.8rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem', background: bg, color: '#fff', transition: 'all 0.2s' }),
  empty: { textAlign: 'center', padding: '4rem 2rem', color: '#64748b', background: '#fff', borderRadius: '16px', border: '2px dashed #e2e8f0' },
  error: { padding: '1rem', background: '#fef2f2', color: '#dc2626', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid #fee2e2' },
};

function Assignments() {
  const { course_assignment_id: initial_ca } = useParams();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [selectedCA, setSelectedCA] = useState(initial_ca || '');
  const [selectedCAObj, setSelectedCAObj] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', due_date: '', max_marks: 100, allow_late_submission: false,
  });
  const [questionFile, setQuestionFile] = useState(null);

  useEffect(() => { 
    fetchData(); 
  }, [selectedCA]);
  
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      if (selectedCA) {
        const data = await assignmentAPI.listByCourse(selectedCA);
        setAssignments(data);
      } else {
        const data = await assignmentAPI.listMine();
        setAssignments(data);
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleCreate = async (publish = false) => {
    setError('');
    if (!form.title || !form.due_date) return setError('Title and due date are required');
    try {
      const payload = {
        ...form,
        course_assignment_id: selectedCA,
        max_marks: Number(form.max_marks) || 100,
        is_published: publish,
      };
      await assignmentAPI.create(payload, questionFile);
      setShowModal(false);
      setQuestionFile(null);
      setForm({ title: '', description: '', due_date: '', max_marks: 100, allow_late_submission: false });
      fetchData();
    } catch (err) { setError(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this assignment and all submissions? This cannot be undone.')) return;
    try {
      await assignmentAPI.delete(id);
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const openQuestion = async (id) => {
    try {
      const { signed_url } = await assignmentAPI.getQuestionUrl(id);
      if (signed_url) window.open(signed_url, '_blank');
    } catch (err) { alert(err.message); }
  };

  const handleTogglePublish = async (assignment) => {
    try {
      await assignmentAPI.publish(assignment.id, !assignment.is_published);
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button style={s.backBtn} onClick={() => navigate('/dashboard?tab=teaching')}>← Back</button>
          <h1 style={s.title}>Assignments</h1>
        </div>
        {selectedCA && <button style={s.newBtn} onClick={() => {
          if (selectedCAObj && selectedCAObj.course_completed) {
            window.alert('Batch completed the course');
            return;
          }
          if (selectedCAObj && selectedCAObj.is_active_batch === false) {
            window.alert('Batch deactivated');
            return;
          }
          setShowModal(true);
        }}>+ New Assignment</button>}
      </div>

      <CourseSemesterSelector onSelect={(id, obj) => { setSelectedCA(id); setSelectedCAObj(obj); }} initialValue={initial_ca} />
      
      {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading assignments...</div>}
      {error && <div style={s.error}>{error}</div>}
      
      {!selectedCA ? null : loading ? null : assignments.length === 0 ? (
        <div style={s.empty}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No assignments yet</p>
          <p>Create your first assignment to get started.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '12px' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Title</th>
                <th style={s.th}>Due Date</th>
                <th style={s.th}>Max Marks</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Question</th>
                <th style={s.th}>Submissions</th>
                <th style={s.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id}>
                  <td style={s.td}>{a.title}</td>
                  <td style={s.td}>{formatDate(a.due_date)}</td>
                  <td style={s.td}>{a.max_marks}</td>
                  <td style={s.td}>
                    <span style={s.badge(a.is_published ? '#4ade80' : '#fbbf24')}>
                      {a.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td style={s.td}>
                    {a.question_file_name ? (
                      <button style={s.actionBtn} onClick={() => openQuestion(a.id)}>📄 PDF</button>
                    ) : '—'}
                  </td>
                  <td style={s.td}>{a.submission_count || 0} / {a.evaluated_count || 0} eval</td>
                  <td style={s.td}>
                    <button style={s.actionBtn} onClick={() => navigate(`/faculty/submissions/${a.id}`)}>
                      Submissions
                    </button>
                    <button style={s.toggleBtn(a.is_published)} onClick={() => handleTogglePublish(a)}>
                      {a.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button style={{ ...s.actionBtn, background: 'rgba(239,68,68,0.15)', color: '#f87171' }} onClick={() => handleDelete(a.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>Create Assignment</h2>
            {error && <div style={s.error}>{error}</div>}
            <div style={s.field}>
              <label style={s.label}>Title *</label>
              <input className="form-control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Assignment title" />
            </div>
            <div style={s.field}>
              <label style={s.label}>Description</label>
              <textarea style={s.textarea} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." />
            </div>
            <div style={s.field}>
              <label style={s.label}>Due Date *</label>
              <input className="form-control" type="datetime-local" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Max Marks</label>
              <input className="form-control" type="number" value={form.max_marks} onChange={(e) => setForm({ ...form, max_marks: e.target.value })} min="1" />
            </div>
            <div style={s.field}>
              <label style={s.label}>Question PDF (optional)</label>
              <input className="form-control" type="file" accept=".pdf" onChange={(e) => setQuestionFile(e.target.files[0] || null)} />
            </div>
            <div style={s.checkRow}>
              <input type="checkbox" id="late-sub" checked={form.allow_late_submission} onChange={(e) => setForm({ ...form, allow_late_submission: e.target.checked })} />
              <label htmlFor="late-sub" style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Allow late submissions</label>
            </div>
            <div style={s.modalActions}>
              <button style={s.modalBtn('#475569')} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={s.modalBtn('#475569')} onClick={() => handleCreate(false)}>Save Draft</button>
              <button style={s.modalBtn('linear-gradient(135deg, #007bff, #0056b3)')} onClick={() => handleCreate(true)}>Publish Now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Assignments;
