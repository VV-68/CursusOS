import { useState, useEffect } from 'react';
import { departmentAPI } from '../../services/api';
import { Link } from 'react-router-dom';

function Departments() {
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const data = await departmentAPI.getAll();
      setDepartments(data);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Departments</h2>
      <table style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
            <th>Name</th>
            <th>Code</th>
            <th>HOD Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {departments.map((d) => (
            <tr key={d.id} style={{ borderBottom: '1px solid #ccc' }}>
              <td>{d.name}</td>
              <td>{d.code}</td>
              <td>{d.hod_name || 'None'}</td>
              <td>
                <Link to={`/admin/departments/${d.id}/assign-hod`}>
                  <button>Assign HOD</button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Departments;
