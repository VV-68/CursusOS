import { useState, useEffect } from 'react';
import { courseAPI, attendanceAPI } from '../../services/api';

function MarkAttendance() {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    if (selectedAssignment && date) {
      fetchSheet();
    }
  }, [selectedAssignment, date]);

  const fetchAssignments = async () => {
    try {
      // Faculty will only see their own assigned courses. Backend filters this by JWT user id.
      // But we pass null to not overconstrain, or we can fetch their ID.
      // Actually backend `getCourseAssignments(null, id)` happens if faculty makes a general getAssignments call.
      // Wait, courseController for GET /api/courses returns courses assigned to faculty.
      // To get course_assignment_ids, the faculty should actually hit GET /api/courses/assignments
      const data = await courseAPI.getAssignments();
      setAssignments(data);
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchSheet = async () => {
    try {
      const qs = new URLSearchParams({ course_assignment_id: selectedAssignment, date }).toString();
      const sheet = await attendanceAPI.getSheet(qs);
      
      // sheet objects: { student_id, student_name, roll_no, status }
      // We initialize status to 'Present' if not already marked.
      const initialized = sheet.map(s => ({
        ...s,
        status: s.status || 'Present'
      }));
      setStudents(initialized);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStatusChange = (student_id, newStatus) => {
    setStudents(prev => prev.map(s => s.student_id === student_id ? { ...s, status: newStatus } : s));
  };

  const handleSave = async () => {
    const records = students.map(s => ({ student_id: s.student_id, status: s.status }));
    try {
      await attendanceAPI.mark({ course_assignment_id: selectedAssignment, date, records });
      alert('Attendance saved successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Mark Attendance</h2>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <select value={selectedAssignment} onChange={e => setSelectedAssignment(e.target.value)}>
          <option value="">Select Course Assignment...</option>
          {assignments.map(a => (
            <option key={a.id} value={a.id}>Course: {a.course_id.substring(0,8)} | Class: {a.class_id.substring(0,8)}</option>
          ))}
        </select>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
      </div>

      {students.length > 0 && (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th>Roll No</th>
                <th>Name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.student_id} style={{ borderBottom: '1px solid #ccc' }}>
                  <td>{s.roll_no}</td>
                  <td>{s.student_name}</td>
                  <td>
                    <select value={s.status} onChange={e => handleStatusChange(s.student_id, e.target.value)}>
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Excused">Excused</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={handleSave} style={{ marginTop: '2rem' }}>Save Attendance</button>
        </>
      )}
    </div>
  );
}

export default MarkAttendance;
