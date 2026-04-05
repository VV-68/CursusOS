import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileAPI, classAPI } from '../../services/api';
import { jwtDecode } from 'jwt-decode';

const s = {
  page: { padding: '2rem', maxWidth: '1100px', margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: '700', background: 'linear-gradient(135deg, #20c997, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '1.5rem' },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' },
  tab: (active) => ({
    padding: '0.5rem 1.2rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
    fontSize: '0.9rem', fontWeight: '600',
    background: active ? 'rgba(32,201,151,0.3)' : 'rgba(51,65,85,0.3)',
    color: active ? '#6ee7b7' : '#94a3b8', transition: 'all 0.2s ease',
  }),
  searchBar: {
    width: '100%', maxWidth: '350px', padding: '0.55rem 1rem',
    background: 'rgba(15,23,42,0.8)', border: '1px solid #334155',
    borderRadius: '8px', color: '#e2e8f0', fontSize: '0.9rem',
    marginBottom: '1.5rem', boxSizing: 'border-box',
  },
  table: { width: '100%', borderCollapse: 'collapse', background: 'rgba(30,41,59,0.8)', borderRadius: '12px', overflow: 'hidden' },
  th: { padding: '0.85rem 1rem', textAlign: 'left', background: 'rgba(51,65,85,0.6)', color: '#94a3b8', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' },
  td: { padding: '0.75rem 1rem', borderBottom: '1px solid rgba(51,65,85,0.5)', color: '#e2e8f0', fontSize: '0.9rem' },
  badge: (ok) => ({ display: 'inline-block', padding: '0.15rem 0.6rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '700', background: ok ? 'rgba(34,197,94,0.2)' : 'rgba(251,191,36,0.2)', color: ok ? '#4ade80' : '#fbbf24' }),
  viewBtn: { padding: '0.35rem 0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' },
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

  useEffect(() => { fetchClasses(); }, []);

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = jwtDecode(token);

      // Get advisor's classes
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

  const loadStudents = async (classId) => {
    if (studentsByClass[classId]) return;
    try {
      const data = await profileAPI.getClassStudents(classId);
      setStudentsByClass((prev) => ({ ...prev, [classId]: data }));
    } catch (err) { console.error(err); }
  };

  const handleTabClick = async (classId) => {
    setActiveClass(classId);
    await loadStudents(classId);
  };

  const students = studentsByClass[activeClass] || [];
  const filtered = students.filter((st) =>
    !search ||
    st.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    st.roll_no?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div style={s.loading}>Loading students...</div>;

  return (
    <div style={s.page}>
      <h1 style={s.title}>My Students</h1>

      {classes.length > 1 && (
        <div style={s.tabs}>
          {classes.map((c) => (
            <button key={c.id} style={s.tab(activeClass === c.id)} onClick={() => handleTabClick(c.id)}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      <input
        style={s.searchBar}
        placeholder="🔍 Search by name or roll number..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

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
                <th style={s.th}>Profile</th>
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
                    <span style={s.badge(st.profile_completed)}>
                      {st.profile_completed ? 'Complete' : 'Incomplete'}
                    </span>
                  </td>
                  <td style={s.td}>
                    <button style={s.viewBtn} onClick={() => navigate(`/advisor/student/${st.user_id}`)}>
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default MyStudents;
