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
      // Filter faculty format
      const validFaculty = users.filter(u => u.dept_id === id && (u.role === 'faculty' || u.role === 'hod'));
      setFaculty(validFaculty);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await departmentAPI.assignHOD(id, { hod_id: selectedHod });
      navigate('/admin/departments');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Assign HOD</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', maxWidth: '300px', gap: '1rem' }}>
        <select value={selectedHod} onChange={(e) => setSelectedHod(e.target.value)} required>
          <option value="">Select Faculty...</option>
          {faculty.map((f) => (
            <option key={f.id} value={f.id}>{f.full_name} ({f.username})</option>
          ))}
        </select>
        <button type="submit">Assign as HOD</button>
      </form>
    </div>
  );
}

export default AssignHOD;
