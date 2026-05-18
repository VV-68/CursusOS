import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileAPI, classAPI } from '../../services/api';
import { jwtDecode } from 'jwt-decode';
import StudentBulkUpload from '../../components/StudentBulkUpload';
import AddStudentModal from '../../components/AddStudentModal';

const s = {
  page: { padding: '2rem', maxWidth: '1100px', margin: '0 auto' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title: { fontSize: '1.5rem', fontWeight: '700', background: 'linear-gradient(135deg, #20c997, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 },
  actions: { display: 'flex', gap: '0.8rem' },
  btnAction: { padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', color: '#fff', background: '#3b82f6', transition: 'all 0.2s' },
  btnOutline: { padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #3b82f6', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', color: '#3b82f6', background: 'transparent', transition: 'all 0.2s' },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' },
  tab: (active) => ({
    padding: '0.5rem 1.2rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
    fontSize: '0.9rem', fontWeight: '600',
    background: active ? 'rgba(32,201,151,0.3)' : 'rgba(51,65,85,0.3)',
    color: active ? '#6ee7b7' : '#94a3b8', transition: 'all 0.2s ease',
  }),
  filterRow: { display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  searchBar: {
    flex: '1', minWidth: '250px', padding: '0.55rem 1rem',
    background: 'rgba(15,23,42,0.8)', border: '1px solid #334155',
    borderRadius: '8px', color: '#e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box',
  },
  select: { padding: '0.55rem 1rem', background: 'rgba(15,23,42,0.8)', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.9rem' },
  table: { width: '100%', borderCollapse: 'collapse', background: 'rgba(30,41,59,0.8)', borderRadius: '12px', overflow: 'hidden' },
  th: { padding: '0.85rem 1rem', textAlign: 'left', background: 'rgba(51,65,85,0.6)', color: '#94a3b8', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' },
  td: { padding: '0.75rem 1rem', borderBottom: '1px solid rgba(51,65,85,0.5)', color: '#e2e8f0', fontSize: '0.9rem' },
  badge: (type) => ({ display: 'inline-block', padding: '0.15rem 0.6rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '700', 
    background: type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(251,191,36,0.2)', 
    color: type === 'success' ? '#4ade80' : '#fbbf24' }),
  viewBtn: { padding: '0.35rem 0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', marginRight: '0.5rem' },
  verifyBtn: { padding: '0.35rem 0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', background: 'rgba(34,197,94,0.2)', color: '#4ade80' },
  loading: { textAlign: 'center', padding: '3rem', color: '#94a3b8' },
  empty: { textAlign: 'center', padding: '3rem', color: '#64748b', background: 'rgba(30,41,59,0.5)', borderRadius: '12px' },
};

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

  if (loading) return <div style={s.loading}>Loading students...</div>;

  return (
    <div style={s.page}>
      <div style={s.headerRow}>
        <h1 style={s.title}>My Students</h1>
        <div style={s.actions}>
          <button style={s.btnOutline} onClick={() => setShowBulkUpload(true)}>Bulk Upload</button>
          <button style={s.btnAction} onClick={() => setShowAddModal(true)}>+ Add Student</button>
        </div>
      </div>

      {classes.length > 1 && (
        <div style={s.tabs}>
          {classes.map((c) => (
            <button key={c.id} style={s.tab(activeClass === c.id)} onClick={() => handleTabClick(c.id)}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div style={s.filterRow}>
        <input
          style={s.searchBar}
          placeholder="🔍 Search by name, email, or roll no..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select style={s.select} value={filterVerified} onChange={e => setFilterVerified(e.target.value)}>
          <option value="all">All Status</option>
          <option value="verified">Verified Only</option>
          <option value="unverified">Unverified Only</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={s.empty}>No students found</div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '12px' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Roll No</th>
                <th style={s.th}>Full Name</th>
                <th style={s.th}>Email</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((st) => (
                <tr key={st.user_id}>
                  <td style={s.td}>{st.roll_no || '—'}</td>
                  <td style={s.td}>{st.full_name}</td>
                  <td style={s.td}>{st.email}</td>
                  <td style={s.td}>
                    {st.isverified === 1 ? (
                      <span style={s.badge('success')}>Verified</span>
                    ) : (
                      <span style={s.badge('warning')}>Unverified</span>
                    )}
                  </td>
                  <td style={s.td}>
                    <button style={s.viewBtn} onClick={() => navigate(`/advisor/student/${st.user_id}`)}>
                      View
                    </button>
                    {st.isverified !== 1 && (
                      <button style={s.verifyBtn} onClick={() => handleVerify(st.user_id)}>
                        Verify
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showBulkUpload && <StudentBulkUpload classId={activeClass} onClose={() => setShowBulkUpload(false)} onSuccess={() => loadStudents(activeClass, true)} />}
      {showAddModal && <AddStudentModal classId={activeClass} onClose={() => setShowAddModal(false)} onSuccess={() => loadStudents(activeClass, true)} />}
    </div>
  );
}

export default MyStudents;
