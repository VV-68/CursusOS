import { useState, useEffect } from 'react';
import { userAPI, departmentAPI } from '../../services/api';
import { useParams, useNavigate } from 'react-router-dom';

function AssignHOD() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState([]);
  const [selectedHod, setSelectedHod] = useState('');

  useEffect(() => {
    fetchFaculty();
  }, [id]);

  const fetchFaculty = async () => {
    try {
      const users = await userAPI.getAll();
      // Filter active faculty format
      const validFaculty = users.filter(u => u.dept_id === id && (u.role === 'faculty' || u.role === 'hod') && u.is_active);
      setFaculty(validFaculty);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await departmentAPI.assignHOD(id, { hod_id: selectedHod });
      if (res.pending) {
        alert(res.message);
      } else {
        alert('HOD assigned successfully');
      }
      navigate('/admin/departments');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate('/dashboard?tab=admin_inst_dept')}>← Back</button>
      <h2>Assign HOD</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', maxWidth: '300px', gap: '1rem' }}>
        <select value={selectedHod} onChange={(e) => setSelectedHod(e.target.value)} required>
          <option value="">Select Faculty...</option>
          {faculty.map((f) => (
            <option key={f.id} value={f.id}>{f.full_name} {f.faculty_code ? `(${f.faculty_code})` : `(${f.username})`}</option>
          ))}
        </select>
        <button type="submit">Assign as HOD</button>
      </form>
    </div>
  );
}

export default AssignHOD;
