import { useState, useEffect } from 'react';
import { classAPI } from '../../services/api';
import { Link } from 'react-router-dom';

function Classes() {
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const data = await classAPI.getAll();
      setClasses(data);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Classes</h2>
      <table style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
            <th>Name</th>
            <th>Year</th>
            <th>Section</th>
            <th>Advisor 1</th>
            <th>Advisor 2</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((c) => (
            <tr key={c.id} style={{ borderBottom: '1px solid #ccc' }}>
              <td>{c.name}</td>
              <td>{c.year}</td>
              <td>{c.section}</td>
              <td>{c.advisor1_name || 'None'}</td>
              <td>{c.advisor2_name || 'None'}</td>
              <td>
                <Link to={`/hod/classes/${c.id}/assign-advisors`}>
                  <button>Change Advisors</button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Classes;
