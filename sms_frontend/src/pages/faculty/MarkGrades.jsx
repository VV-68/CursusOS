import { useState, useEffect } from 'react';
import { courseAPI, marksAPI } from '../../services/api';

function MarkGrades() {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [examType, setExamType] = useState('internal');
  const [students, setStudents] = useState([]);
  const [maxMarks, setMaxMarks] = useState(100);

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    if (selectedAssignment) {
      fetchSheet();
    }
  }, [selectedAssignment, examType]);

  const fetchAssignments = async () => {
    try {
      const data = await courseAPI.getAssignments();
      setAssignments(data);
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchSheet = async () => {
    try {
      const qs = new URLSearchParams({ course_assignment_id: selectedAssignment, exam_type: examType }).toString();
      const sheet = await marksAPI.getSheet(qs);

      const initialized = sheet.map(s => ({
        ...s,
        marks_obtained: s.marks_obtained ?? 0,
        max_marks: s.max_marks ?? maxMarks
      }));
      setStudents(initialized);
      if (initialized.length > 0 && initialized[0].max_marks && initialized[0].max_marks !== maxMarks) {
        setMaxMarks(initialized[0].max_marks);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleMarkChange = (student_id, value) => {
    setStudents(prev => prev.map(s => s.student_id === student_id ? { ...s, marks_obtained: Number(value) } : s));
  };

  const handleMaxMarksChange = (value) => {
    setMaxMarks(Number(value));
    setStudents(prev => prev.map(s => ({ ...s, max_marks: Number(value) })));
  };

  const handleSave = async () => {
    const records = students.map(s => ({
      student_id: s.student_id,
      marks_obtained: s.marks_obtained,
      max_marks: s.max_marks
    }));
    try {
      await marksAPI.update({ course_assignment_id: selectedAssignment, exam_type: examType, marks: records });
      alert('Marks saved successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Manage Grades & Marks</h2>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <select value={selectedAssignment} onChange={e => setSelectedAssignment(e.target.value)}>
          <option value="">Select Course Assignment...</option>
          {assignments.map(a => (
            <option key={a.id} value={a.id}>Course: {a.course_id?.substring(0,8)} | Class: {a.class_id?.substring(0,8)}</option>
          ))}
        </select>

        <select value={examType} onChange={e => setExamType(e.target.value)}>
          <option value="internal">Internal</option>
          <option value="midterm">Midterm</option>
          <option value="endterm">End Term</option>
          <option value="assignment">Assignment</option>
        </select>

        {selectedAssignment && (
          <div>
            <label style={{ marginRight: '0.5rem' }}>Max Marks:</label>
            <input type="number" value={maxMarks} onChange={e => handleMaxMarksChange(e.target.value)} />
          </div>
        )}
      </div>

      {students.length > 0 && (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th>Roll No</th>
                <th>Name</th>
                <th>Marks Obtained</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.student_id} style={{ borderBottom: '1px solid #ccc' }}>
                  <td>{s.roll_no}</td>
                  <td>{s.student_name}</td>
                  <td>
                    <input
                      type="number"
                      value={s.marks_obtained}
                      onChange={e => handleMarkChange(s.student_id, e.target.value)}
                      max={s.max_marks}
                      min="0"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={handleSave} style={{ marginTop: '2rem' }}>Save Grades</button>
        </>
      )}
    </div>
  );
}

export default MarkGrades;
