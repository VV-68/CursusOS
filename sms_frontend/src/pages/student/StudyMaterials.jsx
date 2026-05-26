import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studyMaterialAPI } from '../../services/api';
import '../admin/CreateDepartment.css'; // Add the CSS import
import FacultyPopup from '../../components/FacultyPopup';

const TYPES = ['all', 'notes', 'slides', 'reference', 'video', 'question_bank', 'document', 'link'];
const TYPE_COLORS = { notes: '#007bff', slides: '#f97316', reference: '#06b6d4', video: '#f43f5e', question_bank: '#a855f7', document: '#22c55e', link: '#eab308' };
const TYPE_ICONS = { notes: '📄', slides: '📊', reference: '📖', video: '🎬', question_bank: '❓', document: '📎', link: '🔗' };

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

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading materials...</div>;

  return (
    <div className="dept-wizard" style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate('/dashboard?tab=academics')}>← Back</button>
      
      <div className="dept-wizard__header">
        <h1 style={{ color: '#007bff', margin: 0 }}>📚 Study Materials</h1>
      </div>

      {error && <div className="dept-alert dept-alert--error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', background: '#f8fafc', padding: '0.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        {TYPES.map((t) => (
          <button 
            key={t} 
            style={{ 
              padding: '0.4rem 1rem', borderRadius: '20px', border: 'none', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: '600', textTransform: 'capitalize',
              background: filter === t ? '#e6f2ff' : 'transparent',
              color: filter === t ? '#007bff' : '#64748b',
              transition: 'all 0.2s ease',
            }} 
            onClick={() => setFilter(t)}
          >
            {t === 'all' ? 'All' : `${TYPE_ICONS[t] || ''} ${t.replace('_', ' ')}`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          No materials found
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {filtered.map((m) => (
            <div key={m.id} className="dept-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {!course_assignment_id && (
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#007bff', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                  📚 {m.course_name} ({m.course_code})
                </div>
              )}
              
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ 
                  display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '12px', 
                  fontSize: '0.75rem', fontWeight: '600', 
                  background: `${TYPE_COLORS[m.material_type] || '#64748b'}22`, 
                  color: TYPE_COLORS[m.material_type] || '#64748b' 
                }}>
                  {TYPE_ICONS[m.material_type] || '📄'} {m.material_type.replace('_', ' ')}
                </span>
              </div>
              
              <div style={{ fontSize: '1.05rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem' }}>{m.title}</div>
              
              {m.description && <div style={{ color: '#475569', fontSize: '0.85rem', marginBottom: '0.75rem', lineHeight: '1.4', flexGrow: 1 }}>{m.description}</div>}
              
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem', marginTop: m.description ? '0' : 'auto' }}>
                <FacultyPopup 
                  name={m.uploaded_by_name || m.posted_by_name} 
                  email={m.posted_by_email} 
                  phone={m.posted_by_phone} 
                  designation={m.posted_by_designation} 
                /> • {new Date(m.created_at).toLocaleDateString('en-IN')}
              </div>
              
              <button
                className="dept-btn dept-btn--primary"
                style={{ width: '100%', opacity: opening === m.id ? 0.6 : 1 }}
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
