import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studyMaterialAPI, profileAPI } from '../../services/api';
import '../admin/CreateDepartment.css';
import FacultyPopup from '../../components/FacultyPopup';

const TYPES = ['all', 'notes', 'slides', 'reference', 'video', 'question_bank', 'document', 'link'];
const TYPE_COLORS = { notes: '#007bff', slides: '#f97316', reference: '#06b6d4', video: '#f43f5e', question_bank: '#a855f7', document: '#22c55e', link: '#eab308' };
const TYPE_ICONS = { notes: '📄', slides: '📊', reference: '📖', video: '🎬', question_bank: '❓', document: '📎', link: '🔗' };

function StudentStudyMaterials() {
  const { course_assignment_id } = useParams();
  const navigate = useNavigate();
  const [allMaterials, setAllMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [opening, setOpening] = useState(null);

  const [currentSemester, setCurrentSemester] = useState(1);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [courseAssignments, setCourseAssignments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(course_assignment_id || null);

  useEffect(() => {
    if (course_assignment_id) {
      setSelectedCourse(course_assignment_id);
      fetchData();
    } else {
      fetchInitial();
    }
  }, [course_assignment_id]);

  useEffect(() => {
    if (!course_assignment_id && selectedSemester) {
      fetchData(selectedSemester);
    }
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
  
  const fetchData = async (sem) => {
    setLoading(true);
    setError('');
    try {
      if (course_assignment_id) {
        const data = await studyMaterialAPI.listByCourse(course_assignment_id);
        setAllMaterials(data);
      } else {
        let allCA = await profileAPI.getMyCourses();
        allCA = allCA.filter(c => c.period_number === sem);
        setCourseAssignments(allCA);
        
        const data = await studyMaterialAPI.listMine();
        const caIds = allCA.map(c => c.course_assignment_id);
        const filteredData = data.filter(m => caIds.includes(m.course_assignment_id));
        setAllMaterials(filteredData);
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

  // Group materials by course
  const materialsByCourse = allMaterials.reduce((acc, m) => {
    const caId = m.course_assignment_id;
    if (!acc[caId]) acc[caId] = [];
    acc[caId].push(m);
    return acc;
  }, {});

  // Get filtered materials for a specific course
  const getFilteredMaterials = (caId) => {
    const mats = materialsByCourse[caId] || [];
    return filter === 'all' ? mats : mats.filter(m => m.material_type === filter);
  };

  // When viewing a specific course directly via URL param
  const filteredDirect = filter === 'all' ? allMaterials : allMaterials.filter(m => m.material_type === filter);

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading materials...</div>;

  // Direct course view (from URL param)
  if (course_assignment_id) {
    return (
      <div className="dept-wizard" style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem' }}>
        <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate('/student/materials')}>← Back to Courses</button>
        
        <h1 style={{ color: '#007bff', margin: '0 0 1.5rem' }}>📚 Study Materials</h1>

        {error && <div className="dept-alert dept-alert--error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

        <FilterBar filter={filter} setFilter={setFilter} />

        {filteredDirect.length === 0 ? (
          <EmptyState />
        ) : (
          <MaterialGrid materials={filteredDirect} opening={opening} openMaterial={openMaterial} showCourse={false} />
        )}
      </div>
    );
  }

  // Course cards view (default)
  return (
    <div className="dept-wizard" style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate('/dashboard?tab=academics')}>← Back</button>
      
      <div className="dept-wizard__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: '#007bff', margin: 0 }}>📚 Study Materials</h1>
        {!course_assignment_id && currentSemester > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label style={{ fontWeight: '500', color: '#475569', fontSize: '0.9rem' }}>Semester:</label>
            <select
              value={selectedSemester || ''}
              onChange={(e) => { setSelectedSemester(Number(e.target.value)); setSelectedCourse(null); }}
              style={{
                padding: '0.4rem 2rem 0.4rem 0.8rem',
                border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff',
                fontSize: '0.9rem', fontWeight: '500', color: '#1e293b', cursor: 'pointer',
                appearance: 'none',
                backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748b\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")',
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center'
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

      {/* If no course selected, show course cards */}
      {!selectedCourse ? (
        courseAssignments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', marginTop: '1.5rem' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>📭</span>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: '600', color: '#1e293b' }}>No courses found</p>
            <p>You are not enrolled in any courses for this semester.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
            {courseAssignments.map(ca => {
              const caId = ca.course_assignment_id;
              const count = (materialsByCourse[caId] || []).length;
              return (
                <div
                  key={caId}
                  onClick={() => setSelectedCourse(caId)}
                  style={{
                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem',
                    cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'transform 0.2s, box-shadow 0.2s',
                    display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative', overflow: 'hidden'
                  }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)'; }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#007bff' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ background: '#cce5ff', color: '#007bff', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800' }}>{ca.code}</span>
                    <span style={{
                      fontSize: '0.8rem', color: count > 0 ? '#007bff' : '#94a3b8', fontWeight: '700',
                      background: count > 0 ? '#e6f2ff' : '#f1f5f9', padding: '0.2rem 0.6rem', borderRadius: '4px'
                    }}>
                      {count} {count === 1 ? 'material' : 'materials'}
                    </span>
                  </div>
                  <h3 style={{ margin: '0.5rem 0 0', fontSize: '1.1rem', color: '#1e293b', fontWeight: '700', lineHeight: '1.4' }}>{ca.name}</h3>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
                    {ca.faculty1_name && <span>{ca.faculty1_name}</span>}
                    {ca.faculty2_name && <span> & {ca.faculty2_name}</span>}
                  </p>
                  <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#3b82f6', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    View Materials <span style={{ fontSize: '1rem' }}>→</span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Selected course - show materials */
        <div style={{ marginTop: '1.5rem' }}>
          <button
            onClick={() => { setSelectedCourse(null); setFilter('all'); }}
            style={{
              background: '#e6f2ff', border: '1px solid #b8daff', color: '#007bff', padding: '0.5rem 1rem',
              borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            ← Back to Courses
          </button>

          {/* Course header */}
          {(() => {
            const ca = courseAssignments.find(c => c.course_assignment_id === selectedCourse);
            if (!ca) return null;
            return (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ background: '#cce5ff', color: '#007bff', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800' }}>{ca.code}</span>
                  <h2 style={{ margin: '0.5rem 0 0.25rem', fontSize: '1.2rem', color: '#1e293b' }}>{ca.name}</h2>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    {ca.faculty1_name && <FacultyPopup name={ca.faculty1_name} designation={ca.faculty1_designation} email={ca.faculty1_email} phone={ca.faculty1_phone} />}
                    {ca.faculty2_name && <> & <FacultyPopup name={ca.faculty2_name} designation={ca.faculty2_designation} email={ca.faculty2_email} phone={ca.faculty2_phone} /></>}
                  </div>
                </div>
              </div>
            );
          })()}

          <FilterBar filter={filter} setFilter={setFilter} />

          {getFilteredMaterials(selectedCourse).length === 0 ? (
            <EmptyState />
          ) : (
            <MaterialGrid materials={getFilteredMaterials(selectedCourse)} opening={opening} openMaterial={openMaterial} showCourse={false} />
          )}
        </div>
      )}
    </div>
  );
}

// Reusable filter bar
function FilterBar({ filter, setFilter }) {
  return (
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
  );
}

// Empty state
function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
      No materials found
    </div>
  );
}

// Material cards grid
function MaterialGrid({ materials, opening, openMaterial, showCourse }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
      {materials.map((m) => (
        <div key={m.id} className="dept-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {showCourse && (
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
  );
}

export default StudentStudyMaterials;
