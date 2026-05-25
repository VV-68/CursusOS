import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileAPI, classAPI } from '../../services/api';
import { jwtDecode } from 'jwt-decode';
import StudentBulkUpload from '../../components/StudentBulkUpload';
import AddStudentModal from '../../components/AddStudentModal';
import '../admin/CreateDepartment.css'; // Add the CSS import

function MyStudents() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [studentsByClass, setStudentsByClass] = useState({});
  const [activeClass, setActiveClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterVerified, setFilterVerified] = useState('all'); // all, verified, unverified

  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => { fetchClasses(); }, []);

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = jwtDecode(token);

      const allClasses = await classAPI.getAll();
      const myClasses = allClasses.filter(
        (c) => c.advisor1_id === user.id || c.advisor2_id === user.id
      );
      setClasses(myClasses);

      if (myClasses.length > 0) {
        setActiveClass(myClasses[0].id);
        await loadStudents(myClasses[0].id);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadStudents = async (classId, forceRefresh = false) => {
    if (!forceRefresh && studentsByClass[classId]) return;
    try {
      const data = await profileAPI.getClassStudents(classId);
      setStudentsByClass((prev) => ({ ...prev, [classId]: data }));
    } catch (err) { console.error(err); }
  };

  const handleTabClick = async (classId) => {
    setActiveClass(classId);
    await loadStudents(classId);
  };

  const handleVerify = async (studentId) => {
    if (!window.confirm("Are you sure you want to verify this student profile?")) return;
    try {
      await profileAPI.verifyStudent(studentId);
      // Reload students
      loadStudents(activeClass, true);
    } catch (err) {
      alert("Failed to verify: " + err.message);
    }
  };

  const students = studentsByClass[activeClass] || [];
  
  const filtered = students.filter((st) => {
    const matchesSearch = !search || st.full_name?.toLowerCase().includes(search.toLowerCase()) || st.roll_no?.toLowerCase().includes(search.toLowerCase()) || st.email?.toLowerCase().includes(search.toLowerCase());
    const isVerified = st.isverified === 1;
    const matchesFilter = filterVerified === 'all' || (filterVerified === 'verified' && isVerified) || (filterVerified === 'unverified' && !isVerified);
    return matchesSearch && matchesFilter;
  });

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading students...</div>;

  return (
    <div className="dept-wizard" style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate('/dashboard?tab=oversight')}>← Back</button>
      
      <div className="dept-wizard__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ color: '#4f46e5', margin: 0 }}>🧑‍🎓 My Students</h1>
        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <button className="dept-btn dept-btn--outline" onClick={() => setShowBulkUpload(true)}>Bulk Upload</button>
          <button className="dept-btn dept-btn--primary" onClick={() => setShowAddModal(true)}>+ Add Student</button>
        </div>
      </div>

      {classes.length > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', background: '#f8fafc', padding: '0.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          {classes.map((c) => (
            <button 
              key={c.id} 
              style={{
                padding: '0.4rem 1rem', borderRadius: '20px', border: 'none', cursor: 'pointer',
                fontSize: '0.85rem', fontWeight: '600', textTransform: 'capitalize',
                background: activeClass === c.id ? '#eef2ff' : 'transparent',
                color: activeClass === c.id ? '#4f46e5' : '#64748b',
                transition: 'all 0.2s ease',
              }}
              onClick={() => handleTabClick(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="dept-card" style={{ marginBottom: '1.5rem' }}>
        <div className="dept-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', alignItems: 'center' }}>
          <div className="dept-field" style={{ marginBottom: 0 }}>
            <input
              type="text"
              placeholder="🔍 Search by name, email, or roll no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </div>
          <div className="dept-field" style={{ marginBottom: 0 }}>
            <select style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} value={filterVerified} onChange={e => setFilterVerified(e.target.value)}>
              <option value="all">All Status</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified Only</option>
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          No students found
        </div>
      ) : (
        <div className="dept-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '1rem', color: '#475569', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Roll No</th>
                  <th style={{ padding: '1rem', color: '#475569', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Full Name</th>
                  <th style={{ padding: '1rem', color: '#475569', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Email</th>
                  <th style={{ padding: '1rem', color: '#475569', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '1rem', color: '#475569', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((st) => (
                  <tr key={st.user_id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem', color: '#1e293b' }}>{st.roll_no || '—'}</td>
                    <td style={{ padding: '1rem', color: '#1e293b', fontWeight: '500' }}>{st.full_name}</td>
                    <td style={{ padding: '1rem', color: '#475569' }}>{st.email}</td>
                    <td style={{ padding: '1rem' }}>
                      {st.isverified === 1 ? (
                        <span style={{ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', background: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0' }}>Verified</span>
                      ) : (
                        <span style={{ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', background: '#fffbeb', color: '#f59e0b', border: '1px solid #fde68a' }}>Unverified</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                      <button className="dept-btn dept-btn--outline" style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem', marginRight: '0.5rem' }} onClick={() => navigate(`/advisor/student/${st.user_id}`)}>
                        View
                      </button>
                      {st.isverified !== 1 && (
                        <button className="dept-btn dept-btn--success" style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleVerify(st.user_id)}>
                          Verify
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showBulkUpload && <StudentBulkUpload classId={activeClass} onClose={() => setShowBulkUpload(false)} onSuccess={() => loadStudents(activeClass, true)} />}
      {showAddModal && <AddStudentModal classId={activeClass} onClose={() => setShowAddModal(false)} onSuccess={() => loadStudents(activeClass, true)} />}
    </div>
  );
}

export default MyStudents;
