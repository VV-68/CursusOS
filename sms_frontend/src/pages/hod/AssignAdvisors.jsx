import { useState, useEffect } from 'react';
import { userAPI, classAPI } from '../../services/api';
import { useParams, useNavigate } from 'react-router-dom';

function AssignAdvisors() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState([]);
  const [advisor1, setAdvisor1] = useState('');
  const [advisor2, setAdvisor2] = useState('');

  // Note: For secure apps, HOD dept_id would be in JWT and we can filter on backend API.
  // Here we use the users endpoint.
  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    try {
      const users = await userAPI.getAll();
      // Valid faculty are 'faculty' or 'advisor' role. (backend filtering should ideally restrict by dept)
      const validFaculty = users.filter(u => u.role === 'faculty' || u.role === 'advisor');
      setFaculty(validFaculty);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await classAPI.assignAdvisors(id, { advisor1_id: advisor1, advisor2_id: advisor2 });
      navigate('/hod/classes');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate('/dashboard?tab=hod_batches')}>← Back</button>
      <h2>Assign Advisors</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', maxWidth: '300px', gap: '1rem' }}>
        <select value={advisor1} onChange={(e) => setAdvisor1(e.target.value)}>
          <option value="">No Advisor (Default)</option>
          {faculty.map((f) => (
            <option key={f.id} value={f.id}>{f.full_name} {f.faculty_code ? `(${f.faculty_code})` : `(${f.username})`} - {f.role}</option>
          ))}
        </select>
        <select value={advisor2} onChange={(e) => setAdvisor2(e.target.value)}>
          <option value="">No Advisor</option>
          {faculty.map((f) => (
            <option key={f.id} value={f.id}>{f.full_name} {f.faculty_code ? `(${f.faculty_code})` : `(${f.username})`} - {f.role}</option>
          ))}
        </select>
        <button type="submit">Assign Advisors</button>
      </form>
    </div>
  );
}

export default AssignAdvisors;
