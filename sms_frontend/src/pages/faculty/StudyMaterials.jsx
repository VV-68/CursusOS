import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studyMaterialAPI } from '../../services/api';
import { jwtDecode } from 'jwt-decode';
import CourseSemesterSelector from '../../components/CourseSemesterSelector';

const TYPES = ['notes', 'slides', 'reference', 'video', 'question_bank', 'document', 'link'];
const TYPE_COLORS = { notes: '#818cf8', slides: '#f97316', reference: '#06b6d4', video: '#f43f5e', question_bank: '#a855f7' };
const TYPE_ICONS = { notes: '📄', slides: '📊', reference: '📖', video: '🎬', question_bank: '❓' };

const s = {
  page: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
  title: { fontSize: '1.8rem', fontWeight: '800', color: '#1e293b', letterSpacing: '-0.025em' },
  backBtn: { background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.2s' },
  addBtn: { background: 'linear-gradient(135deg, #007bff, #0056b3)', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(0, 123, 255, 0.2)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' },
  card: {
    background: '#ffffff', borderRadius: '16px', padding: '1.75rem',
    border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', transition: 'all 0.3s ease',
  },
  cardTitle: { fontSize: '1.15rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' },
  cardDesc: { color: '#64748b', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: '1.5' },
  typeBadge: (type) => ({ display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '700', background: `${TYPE_COLORS[type] || '#64748b'}15`, color: TYPE_COLORS[type] || '#64748b', marginBottom: '1rem', textTransform: 'uppercase' }),
  meta: { fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  cardActions: { display: 'flex', gap: '0.75rem' },
  openBtn: { flex: 1, padding: '0.6rem 1rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', background: '#dcfce7', color: '#15803d', transition: 'all 0.2s' },
  deleteBtn: { padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid #fee2e2', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', background: '#fff', color: '#ef4444', transition: 'all 0.2s' },
  // Modal
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' },
  modal: { background: '#ffffff', borderRadius: '16px', padding: '2.5rem', width: '90%', maxWidth: '550px', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
  modalTitle: { fontSize: '1.5rem', fontWeight: '800', color: '#1e293b', marginBottom: '1.5rem', letterSpacing: '-0.025em' },
  field: { marginBottom: '1.25rem' },
  label: { display: 'block', color: '#475569', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: '600' },
  input: { width: '100%', padding: '0.75rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#1e293b', fontSize: '0.95rem', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '0.75rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#1e293b', fontSize: '0.95rem', minHeight: '100px', resize: 'vertical', boxSizing: 'border-box' },
  select: { width: '100%', padding: '0.75rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#1e293b', fontSize: '0.95rem' },
  hint: { fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.4rem' },
  modalActions: { display: 'flex', gap: '1rem', marginTop: '2rem' },
  modalBtn: (bg) => ({ flex: 1, padding: '0.8rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem', background: bg, color: '#fff' }),
  error: { padding: '1rem', background: '#fef2f2', color: '#dc2626', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid #fee2e2' },
  empty: { textAlign: 'center', padding: '4rem 2rem', color: '#64748b', background: '#fff', borderRadius: '16px', border: '2px dashed #e2e8f0' },
};

function FacultyStudyMaterials() {
  const { course_assignment_id: initial_ca } = useParams();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', description: '', external_link: '', material_type: 'notes' });
  const [uploadFile, setUploadFile] = useState(null);
  const [selectedCA, setSelectedCA] = useState(initial_ca || '');
  const [selectedCAObj, setSelectedCAObj] = useState(null);

  const token = localStorage.getItem('token');
  let userId = '';
  try { userId = jwtDecode(token).id; } catch {}

  useEffect(() => { 
    fetchData(); 
  }, [selectedCA]);
  
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      if (selectedCA) {
        const data = await studyMaterialAPI.listByCourse(selectedCA);
        setMaterials(data);
      } else {
        const data = await studyMaterialAPI.listMine();
        setMaterials(data);
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    setError('');
    if (!form.title) return setError('Title is required');
    if (!uploadFile && !form.external_link?.trim()) {
      return setError('Upload a file or provide an external link');
    }
    if (form.external_link?.trim()) {
      try { new URL(form.external_link); } catch { return setError('Please enter a valid URL'); }
    }
    try {
      await studyMaterialAPI.create(
        { ...form, course_assignment_id: selectedCA },
        uploadFile
      );
      setShowModal(false);
      setUploadFile(null);
      setForm({ title: '', description: '', external_link: '', material_type: 'notes' });
      fetchData();
    } catch (err) { setError(err.message); }
  };

  const openMaterial = async (m) => {
    const link = m.external_link || m.drive_link;
    if (link) {
      window.open(link, '_blank');
      return;
    }
    if (m.file_path) {
      try {
        const { signed_url } = await studyMaterialAPI.getDownloadUrl(m.id);
        if (signed_url) window.open(signed_url, '_blank');
      } catch (err) { alert(err.message); }
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this material?')) return;
    try { await studyMaterialAPI.delete(id); fetchData(); }
    catch (err) { alert(err.message); }
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button style={s.backBtn} onClick={() => navigate('/dashboard?tab=teaching')}>← Back</button>
          <h1 style={s.title}>Study Materials</h1>
        </div>
        {selectedCA && <button style={s.addBtn} onClick={() => {
          if (selectedCAObj && selectedCAObj.course_completed) {
            window.alert('Batch completed the course');
            return;
          }
          if (selectedCAObj && selectedCAObj.is_active_batch === false) {
            window.alert('Batch deactivated');
            return;
          }
          setShowModal(true);
        }}>+ Add Material</button>}
      </div>

      <CourseSemesterSelector onSelect={(id, obj) => { setSelectedCA(id); setSelectedCAObj(obj); }} initialValue={initial_ca} />

      {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading materials...</div>}
      {error && <div style={s.error}>{error}</div>}

      {!selectedCA ? null : loading ? null : materials.length === 0 ? (
        <div style={s.empty}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No materials posted</p>
          <p>Share study materials with your students.</p>
        </div>
      ) : (
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
                <button style={s.openBtn} onClick={() => openMaterial(m)}>
                  {m.file_path ? '📥 Download' : '🔗 Open Link'}
                </button>
                {m.posted_by === userId && (
                  <button style={s.deleteBtn} onClick={() => handleDelete(m.id)}>Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>Add Study Material</h2>
            {error && <div style={s.error}>{error}</div>}
            <div style={s.field}>
              <label style={s.label}>Title *</label>
              <input className="form-control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Material title" />
            </div>
            <div style={s.field}>
              <label style={s.label}>Description</label>
              <textarea style={s.textarea} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." />
            </div>
            <div style={s.field}>
              <label style={s.label}>Upload file (PDF, PPT, DOC, etc.)</label>
              <input className="form-control" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip" onChange={(e) => setUploadFile(e.target.files[0] || null)} />
            </div>
            <div style={s.field}>
              <label style={s.label}>External link (optional)</label>
              <input className="form-control" value={form.external_link} onChange={(e) => setForm({ ...form, external_link: e.target.value })} placeholder="https://..." />
              <div style={s.hint}>Provide a file upload, an external link, or both</div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Type</label>
              <select style={s.select} value={form.material_type} onChange={(e) => setForm({ ...form, material_type: e.target.value })}>
                {TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div style={s.modalActions}>
              <button style={s.modalBtn('#475569')} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={s.modalBtn('linear-gradient(135deg, #007bff, #0056b3)')} onClick={handleCreate}>Add Material</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FacultyStudyMaterials;
