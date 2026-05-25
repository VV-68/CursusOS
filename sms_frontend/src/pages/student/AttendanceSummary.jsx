import { useState, useEffect } from 'react';
import { attendanceAPI } from '../../services/api';
import { jwtDecode } from 'jwt-decode';

function AttendanceSummary() {
  const [summary, setSummary] = useState([]);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const decoded = jwtDecode(token);
      
      const data = await attendanceAPI.getSummary(decoded.id);
      setSummary(data);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div id="top" style={{ padding: '2rem' }}>
      <h2>My Attendance Summary</h2>
      
      {summary.length === 0 ? (
        <p>No attendance records found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '1rem' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th>Course Name</th>
              <th>Course Code</th>
              <th>Total Classes</th>
              <th>Attended</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {summary.map(s => (
              <tr key={s.course_assignment_id} style={{ borderBottom: '1px solid #ccc' }}>
                <td>{s.course_name}</td>
                <td>{s.course_code}</td>
                <td>{s.classes_done}</td>
                <td>{s.classes_present}</td>
                <td style={{ color: parseFloat(s.percentage) < 75 ? 'red' : 'green', fontWeight: 'bold' }}>
                  {s.percentage}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
        <a href="#top" style={{ color: '#94a3b8', fontSize: '0.82rem', textDecoration: 'none' }}>↑ Back to top</a>
      </div>
    </div>
  );
}

export default AttendanceSummary;
