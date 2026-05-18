import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studyMaterialAPI } from '../../services/api';

const TYPES = ['all', 'notes', 'slides', 'reference', 'video', 'question_bank', 'document', 'link'];
const TYPE_COLORS = { notes: '#818cf8', slides: '#f97316', reference: '#06b6d4', video: '#f43f5e', question_bank: '#a855f7', document: '#22c55e', link: '#eab308' };
const TYPE_ICONS = { notes: '📄', slides: '📊', reference: '📖', video: '🎬', question_bank: '❓', document: '📎', link: '🔗' };

const s = {
  page: { padding: '2rem', maxWidth: '1100px', margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' },
  backBtn: { background: 'none', border: '1px solid #475569', color: '#94a3b8', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' },
  title: { fontSize: '1.5rem', fontWeight: '700', background: 'linear-gradient(135deg, #f97316, #fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  tab: (active) => ({
    padding: '0.4rem 1rem', borderRadius: '20px', border: 'none', cursor: 'pointer',
    fontSize: '0.85rem', fontWeight: '600', textTransform: 'capitalize',
    background: active ? 'rgba(102,126,234,0.3)' : 'rgba(51,65,85,0.3)',
    color: active ? '#a5b4fc' : '#94a3b8',
    transition: 'all 0.2s ease',
  }),
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' },
  card: {
    background: 'rgba(30,41,59,0.8)', borderRadius: '12px', padding: '1.5rem',
    border: '1px solid rgba(100,116,139,0.3)', transition: 'all 0.3s ease',
  },
  cardTitle: { fontSize: '1.05rem', fontWeight: '600', color: '#f1f5f9', marginBottom: '0.5rem' },
  cardDesc: { color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.75rem', lineHeight: '1.4' },
  typeBadge: (type) => ({ display: 'inline-block', padding: '0.15rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', background: `${TYPE_COLORS[type] || '#64748b'}22`, color: TYPE_COLORS[type] || '#64748b', marginBottom: '0.75rem' }),
  meta: { fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' },
  openBtn: {
    width: '100%', padding: '0.55rem 1rem', borderRadius: '8px', border: 'none',
    cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem',
    background: 'rgba(34,197,94,0.15)', color: '#4ade80',
  },
  empty: { textAlign: 'center', padding: '3rem', color: '#64748b', background: 'rgba(30,41,59,0.5)', borderRadius: '12px' },
  error: { padding: '0.75rem', background: 'rgba(239,68,68,0.1)', color: '#f87171', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' },
};

function StudentStudyMaterials() {
  const { course_assignment_id } = useParams();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [opening, setOpening] = useState(null);

  useEffect(() => { fetchData(); }, [course_assignment_id]);
  
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      if (course_assignment_id) {
        const data = await studyMaterialAPI.listByCourse(course_assignment_id);
        setMaterials(data);
      } else {
        const data = await studyMaterialAPI.listMine();
        setMaterials(data);
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const openMaterial = async (m) => {
    setOpening(m.id);
    setError('');
    try {
      const ext = m.external_link || m.drive_link;
      if (ext) {
        window.open(ext, '_blank');
        return;
      }
      if (m.file_path) {
        const { signed_url } = await studyMaterialAPI.getDownloadUrl(m.id);
        if (signed_url) window.open(signed_url, '_blank');
      }
    } catch (err) { setError(err.message); }
    finally { setOpening(null); }
  };

  const filtered = filter === 'all' ? materials : materials.filter((m) => m.material_type === filter);

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading...</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate('/student/assignments')}>← Back</button>
        <h1 style={s.title}>Study Materials</h1>
      </div>

      {error && <div style={s.error}>{error}</div>}

      <div style={s.tabs}>
        {TYPES.map((t) => (
          <button key={t} style={s.tab(filter === t)} onClick={() => setFilter(t)}>
            {t === 'all' ? 'All' : `${TYPE_ICONS[t] || ''} ${t.replace('_', ' ')}`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={s.empty}>No materials found</div>
      ) : (
        <div style={s.grid}>
          {filtered.map((m) => (
            <div key={m.id} style={s.card}>
              {!course_assignment_id && (
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#818cf8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  📚 {m.course_name} ({m.course_code})
                </div>
              )}
              <span style={s.typeBadge(m.material_type)}>{TYPE_ICONS[m.material_type] || '📄'} {m.material_type}</span>
              <div style={s.cardTitle}>{m.title}</div>
              {m.description && <div style={s.cardDesc}>{m.description}</div>}
              <div style={s.meta}>
                {m.uploaded_by_name || m.posted_by_name} • {new Date(m.created_at).toLocaleDateString('en-IN')}
              </div>
              <button
                style={{ ...s.openBtn, opacity: opening === m.id ? 0.6 : 1 }}
                disabled={opening === m.id}
                onClick={() => openMaterial(m)}
              >
                {opening === m.id ? 'Opening...' : (m.file_path ? '📥 Secure Download' : '🔗 Open Link')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StudentStudyMaterials;
