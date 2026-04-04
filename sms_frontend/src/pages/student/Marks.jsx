import { useState, useEffect } from 'react';
import { marksAPI } from '../../services/api';
import { jwtDecode } from 'jwt-decode';

function Marks() {
  const [marks, setMarks] = useState([]);

  useEffect(() => {
    fetchMarks();
  }, []);

  const fetchMarks = async () => {
    try {
      const token = localStorage.getItem('token');
      const decoded = jwtDecode(token);

      const data = await marksAPI.getStudentMarks(decoded.id);
      setMarks(data);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>My Grades & Marks</h2>

      {marks.length === 0 ? (
        <p>No marks records found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '1rem' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th>Course Name</th>
              <th>Course Code</th>
              <th>Exam Type</th>
              <th>Marks Obtained</th>
              <th>Max Marks</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {marks.map(m => {
              const perc = ((m.marks_obtained / m.max_marks) * 100).toFixed(2);
              return (
                <tr key={m.id} style={{ borderBottom: '1px solid #ccc' }}>
                  <td>{m.course_name}</td>
                  <td>{m.course_code}</td>
                  <td style={{ textTransform: 'capitalize' }}>{m.exam_type}</td>
                  <td>{m.marks_obtained}</td>
                  <td>{m.max_marks}</td>
                  <td style={{ color: perc < 40 ? 'red' : 'green', fontWeight: 'bold' }}>
                    {perc}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Marks;
