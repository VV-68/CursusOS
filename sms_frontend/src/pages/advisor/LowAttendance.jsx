import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { attendanceAPI, classAPI } from '../../services/api';

function LowAttendance() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [reports, setReports] = useState([]);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchReports();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const data = await classAPI.getAll();
      setClasses(data);
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchReports = async () => {
    try {
      const qs = new URLSearchParams({ class_id: selectedClass }).toString();
      const data = await attendanceAPI.getLow(qs);
      setReports(data);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate('/dashboard?tab=oversight')}>← Back</button>
      <h2>Low Attendance Report ({'< 75%'})</h2>
      
      <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{ marginBottom: '2rem' }}>
        <option value="">Select Class...</option>
        {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
      </select>

      {selectedClass && (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th>Student Name</th>
              <th>Roll No</th>
              <th>Course Name</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #ccc' }}>
                <td>{r.student_name}</td>
                <td>{r.roll_no}</td>
                <td>{r.course_name}</td>
                <td style={{ color: 'red', fontWeight: 'bold' }}>{r.attendance_percentage}%</td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '1rem' }}>No low attendance records found for this class.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default LowAttendance;
