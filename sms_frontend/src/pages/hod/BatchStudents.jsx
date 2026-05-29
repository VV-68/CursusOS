import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { profileAPI, classAPI } from '../../services/api';

function BatchStudents() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [cls, setCls] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const allClasses = await classAPI.getAll();
        const batch = allClasses.find(c => c.id === id);
        setCls(batch);
        const data = await profileAPI.getClassStudents(id);
        setStudents(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading students...</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem' }} onClick={() => navigate('/dashboard?tab=classes')}>← Back</button>
      <h2 style={{ marginBottom: '1rem' }}>🧑‍🎓 Students in {cls?.name} (Year {cls?.year}, {cls?.section})</h2>
      
      {students.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', background: '#f8fafc', borderRadius: '12px' }}>
          No students found in this batch.
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={{ padding: '0.75rem', fontWeight: 600 }}>Roll No</th>
              <th style={{ padding: '0.75rem', fontWeight: 600 }}>Name</th>
              <th style={{ padding: '0.75rem', fontWeight: 600 }}>Email</th>
              <th style={{ padding: '0.75rem', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '0.75rem', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map(st => (
              <tr key={st.user_id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '0.75rem' }}>{st.roll_no || '—'}</td>
                <td style={{ padding: '0.75rem', fontWeight: 500 }}>{st.full_name}</td>
                <td style={{ padding: '0.75rem' }}>{st.email}</td>
                <td style={{ padding: '0.75rem' }}>{st.isverified === 1 ? 'Verified' : 'Unverified'}</td>
                <td style={{ padding: '0.75rem' }}>
                  <button onClick={() => navigate(`/advisor/student/${st.user_id}`)} style={{ padding: '0.3rem 0.6rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default BatchStudents;
