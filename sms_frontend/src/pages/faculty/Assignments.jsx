import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assignmentAPI } from '../../services/api';
import CourseSemesterSelector from '../../components/CourseSemesterSelector';

const s = {
  page: { padding: '2rem', maxWidth: '1100px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
  title: { fontSize: '1.5rem', fontWeight: '700', background: 'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  backBtn: { background: 'none', border: '1px solid #475569', color: '#94a3b8', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' },
  newBtn: { background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' },
  table: { width: '100%', borderCollapse: 'collapse', background: 'rgba(30,41,59,0.8)', borderRadius: '12px', overflow: 'hidden' },
  th: { padding: '0.85rem 1rem', textAlign: 'left', background: 'rgba(51,65,85,0.6)', color: '#94a3b8', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' },
  td: { padding: '0.75rem 1rem', borderBottom: '1px solid rgba(51,65,85,0.5)', color: '#e2e8f0', fontSize: '0.9rem' },
  badge: (color) => ({ display: 'inline-block', padding: '0.15rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', background: `${color}22`, color }),
  toggleBtn: (active) => ({ padding: '0.3rem 0.7rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', background: active ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)', color: active ? '#4ade80' : '#f87171' }),
  actionBtn: { padding: '0.3rem 0.7rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', marginRight: '0.4rem' },
  // Modal
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { background: '#1e293b', borderRadius: '16px', padding: '2rem', width: '90%', maxWidth: '500px', border: '1px solid rgba(100,116,139,0.3)', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontSize: '1.25rem', fontWeight: '700', color: '#f1f5f9', marginBottom: '1.5rem' },
  field: { marginBottom: '1rem' },
  label: { display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: '500' },
  input: { width: '100%', padding: '0.6rem 0.8rem', background: 'rgba(15,23,42,0.8)', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '0.6rem 0.8rem', background: 'rgba(15,23,42,0.8)', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.9rem', minHeight: '80px', resize: 'vertical', boxSizing: 'border-box' },
  checkRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' },
  modalActions: { display: 'flex', gap: '0.75rem', marginTop: '1.5rem' },
  modalBtn: (bg) => ({ flex: 1, padding: '0.65rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', background: bg, color: '#fff' }),
  empty: { textAlign: 'center', padding: '3rem', color: '#64748b', background: 'rgba(30,41,59,0.5)', borderRadius: '12px' },
  error: { padding: '0.75rem', background: 'rgba(239,68,68,0.1)', color: '#f87171', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' },
};

function Assignments() {
  const { course_assignment_id: initial_ca } = useParams();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [selectedCA, setSelectedCA] = useState(initial_ca || '');
  const [form, setForm] = useState({
    title: '', description: '', due_date: '', max_marks: 100, allow_late_submission: false
  });

  useEffect(() => { 
    if (selectedCA) {
      setLoading(true);
      fetchData(); 
    } else {
      setAssignments([]);
      setLoading(false);
    }
  }, [selectedCA]);

  const fetchData = async () => {
    try {
      const data = await assignmentAPI.listByCourse(selectedCA);
      setAssignments(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleCreate = async (publish = false) => {
    setError('');
    if (!form.title || !form.due_date) return setError('Title and due date are required');
    try {
      const created = await assignmentAPI.create({
        ...form, course_assignment_id: selectedCA,
        max_marks: Number(form.max_marks) || 100,
      });
      if (publish) {
        await assignmentAPI.publish(created.id, true);
      }
      setShowModal(false);
      setForm({ title: '', description: '', due_date: '', max_marks: 100, allow_late_submission: false });
      fetchData();
    } catch (err) { setError(err.message); }
  };

  const handleTogglePublish = async (assignment) => {
    try {
      await assignmentAPI.publish(assignment.id, !assignment.is_published);
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading...</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button style={s.backBtn} onClick={() => navigate('/faculty/courses')}>← Back</button>
          <h1 style={s.title}>Assignments</h1>
        </div>
        {selectedCA && <button style={s.newBtn} onClick={() => setShowModal(true)}>+ New Assignment</button>}
      </div>

      <CourseSemesterSelector onSelect={setSelectedCA} />
      
      {!selectedCA && <div style={s.empty}>Please select a semester and course to view assignments.</div>}
      {error && <div style={s.error}>{error}</div>}

      {selectedCA && assignments.length === 0 && !loading ? (
        <div style={s.empty}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No assignments yet</p>
          <p>Create your first assignment to get started.</p>
        </div>
      ) : selectedCA && assignments.length > 0 ? (
        <div style={{ overflowX: 'auto', borderRadius: '12px' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Title</th>
                <th style={s.th}>Due Date</th>
                <th style={s.th}>Max Marks</th>
                <th style={s.th}>Status</th>
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
                  <td style={s.td}>{a.submission_count || 0}</td>
                  <td style={s.td}>
                    <button style={s.actionBtn} onClick={() => navigate(`/faculty/submissions/${a.id}`)}>
                      Submissions
                    </button>
                    <button style={s.toggleBtn(a.is_published)} onClick={() => handleTogglePublish(a)}>
                      {a.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {showModal && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>Create Assignment</h2>
            {error && <div style={s.error}>{error}</div>}
            <div style={s.field}>
              <label style={s.label}>Title *</label>
              <input style={s.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Assignment title" />
            </div>
            <div style={s.field}>
              <label style={s.label}>Description</label>
              <textarea style={s.textarea} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." />
            </div>
            <div style={s.field}>
              <label style={s.label}>Due Date *</label>
              <input style={s.input} type="datetime-local" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Max Marks</label>
              <input style={s.input} type="number" value={form.max_marks} onChange={(e) => setForm({ ...form, max_marks: e.target.value })} min="1" />
            </div>
            <div style={s.checkRow}>
              <input type="checkbox" id="late-sub" checked={form.allow_late_submission} onChange={(e) => setForm({ ...form, allow_late_submission: e.target.checked })} />
              <label htmlFor="late-sub" style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Allow late submissions</label>
            </div>
            <div style={s.modalActions}>
              <button style={s.modalBtn('#475569')} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={s.modalBtn('#475569')} onClick={() => handleCreate(false)}>Save Draft</button>
              <button style={s.modalBtn('linear-gradient(135deg, #667eea, #764ba2)')} onClick={() => handleCreate(true)}>Publish Now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Assignments;
