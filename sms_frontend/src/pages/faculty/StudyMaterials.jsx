import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studyMaterialAPI } from '../../services/api';
import { jwtDecode } from 'jwt-decode';
import CourseSemesterSelector from '../../components/CourseSemesterSelector';

const TYPES = ['notes', 'slides', 'reference', 'video', 'question_bank'];
const TYPE_COLORS = { notes: '#818cf8', slides: '#f97316', reference: '#06b6d4', video: '#f43f5e', question_bank: '#a855f7' };
const TYPE_ICONS = { notes: '📄', slides: '📊', reference: '📖', video: '🎬', question_bank: '❓' };

const s = {
  page: { padding: '2rem', maxWidth: '1100px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
  title: { fontSize: '1.5rem', fontWeight: '700', background: 'linear-gradient(135deg, #22c55e, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  backBtn: { background: 'none', border: '1px solid #475569', color: '#94a3b8', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' },
  addBtn: { background: 'linear-gradient(135deg, #22c55e, #06b6d4)', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' },
  card: {
    background: 'rgba(30,41,59,0.8)', borderRadius: '12px', padding: '1.5rem',
    border: '1px solid rgba(100,116,139,0.3)', transition: 'all 0.3s ease',
  },
  cardTitle: { fontSize: '1.05rem', fontWeight: '600', color: '#f1f5f9', marginBottom: '0.5rem' },
  cardDesc: { color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: '1.4' },
  typeBadge: (type) => ({ display: 'inline-block', padding: '0.15rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', background: `${TYPE_COLORS[type] || '#64748b'}22`, color: TYPE_COLORS[type] || '#64748b', marginBottom: '0.75rem' }),
  meta: { fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' },
  cardActions: { display: 'flex', gap: '0.5rem' },
  openBtn: { flex: 1, padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', background: 'rgba(34,197,94,0.15)', color: '#4ade80' },
  deleteBtn: { padding: '0.5rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', fontWeight: '500', fontSize: '0.85rem', background: 'rgba(239,68,68,0.1)', color: '#f87171' },
  // Modal
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { background: '#1e293b', borderRadius: '16px', padding: '2rem', width: '90%', maxWidth: '500px', border: '1px solid rgba(100,116,139,0.3)' },
  modalTitle: { fontSize: '1.25rem', fontWeight: '700', color: '#f1f5f9', marginBottom: '1.5rem' },
  field: { marginBottom: '1rem' },
  label: { display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: '500' },
  input: { width: '100%', padding: '0.6rem 0.8rem', background: 'rgba(15,23,42,0.8)', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '0.6rem 0.8rem', background: 'rgba(15,23,42,0.8)', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.9rem', minHeight: '80px', resize: 'vertical', boxSizing: 'border-box' },
  select: { width: '100%', padding: '0.6rem 0.8rem', background: 'rgba(15,23,42,0.8)', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.9rem' },
  hint: { fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem' },
  modalActions: { display: 'flex', gap: '0.75rem', marginTop: '1.5rem' },
  modalBtn: (bg) => ({ flex: 1, padding: '0.65rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', background: bg, color: '#fff' }),
  error: { padding: '0.75rem', background: 'rgba(239,68,68,0.1)', color: '#f87171', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' },
  empty: { textAlign: 'center', padding: '3rem', color: '#64748b', background: 'rgba(30,41,59,0.5)', borderRadius: '12px' },
};

function FacultyStudyMaterials() {
  const { course_assignment_id: initial_ca } = useParams();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', description: '', drive_link: '', material_type: 'notes' });
  const [selectedCA, setSelectedCA] = useState(initial_ca || '');

  const token = localStorage.getItem('token');
  let userId = '';
  try { userId = jwtDecode(token).id; } catch {}

  useEffect(() => { 
    if (selectedCA) {
      setLoading(true);
      fetchData(); 
    } else {
      setMaterials([]);
      setLoading(false);
    }
  }, [selectedCA]);

  const fetchData = async () => {
    try {
      const data = await studyMaterialAPI.listByCourse(selectedCA);
      setMaterials(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    setError('');
    if (!form.title || !form.drive_link) return setError('Title and link are required');
    try { new URL(form.drive_link); } catch { return setError('Please enter a valid URL'); }
    try {
      await studyMaterialAPI.create({ ...form, course_assignment_id: selectedCA });
      setShowModal(false);
      setForm({ title: '', description: '', drive_link: '', material_type: 'notes' });
      fetchData();
    } catch (err) { setError(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this material?')) return;
    try { await studyMaterialAPI.delete(id); fetchData(); }
    catch (err) { alert(err.message); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading...</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button style={s.backBtn} onClick={() => navigate('/faculty/courses')}>← Back</button>
          <h1 style={s.title}>Study Materials</h1>
        </div>
        {selectedCA && <button style={s.addBtn} onClick={() => setShowModal(true)}>+ Add Material</button>}
      </div>

      <CourseSemesterSelector onSelect={setSelectedCA} />

      {!selectedCA && <div style={s.empty}>Please select a semester and course to view materials.</div>}
      
      {error && <div style={s.error}>{error}</div>}

      {selectedCA && materials.length === 0 && !loading ? (
        <div style={s.empty}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No materials posted</p>
          <p>Share study materials with your students.</p>
        </div>
      ) : selectedCA && materials.length > 0 ? (
        <div style={s.grid}>
          {materials.map((m) => (
            <div key={m.id} style={s.card}>
              <span style={s.typeBadge(m.material_type)}>{TYPE_ICONS[m.material_type] || '📄'} {m.material_type}</span>
              <div style={s.cardTitle}>{m.title}</div>
              {m.description && <div style={s.cardDesc}>{m.description}</div>}
              <div style={s.meta}>
                Posted by {m.posted_by_name} • {new Date(m.created_at).toLocaleDateString('en-IN')}
              </div>
              <div style={s.cardActions}>
                <button style={s.openBtn} onClick={() => window.open(m.drive_link, '_blank')}>🔗 Open Link</button>
                {m.posted_by === userId && (
                  <button style={s.deleteBtn} onClick={() => handleDelete(m.id)}>Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {showModal && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>Add Study Material</h2>
            {error && <div style={s.error}>{error}</div>}
            <div style={s.field}>
              <label style={s.label}>Title *</label>
              <input style={s.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Material title" />
            </div>
            <div style={s.field}>
              <label style={s.label}>Description</label>
              <textarea style={s.textarea} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." />
            </div>
            <div style={s.field}>
              <label style={s.label}>Google Drive / External Link *</label>
              <input style={s.input} value={form.drive_link} onChange={(e) => setForm({ ...form, drive_link: e.target.value })} placeholder="https://drive.google.com/..." />
              <div style={s.hint}>Paste a Google Drive share link, YouTube link, or any public URL</div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Type</label>
              <select style={s.select} value={form.material_type} onChange={(e) => setForm({ ...form, material_type: e.target.value })}>
                {TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div style={s.modalActions}>
              <button style={s.modalBtn('#475569')} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={s.modalBtn('linear-gradient(135deg, #22c55e, #06b6d4)')} onClick={handleCreate}>Add Material</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FacultyStudyMaterials;
