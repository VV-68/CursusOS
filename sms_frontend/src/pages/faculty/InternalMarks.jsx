import { useState, useEffect } from 'react';
import { internalMarksAPI, courseAssignmentAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

function InternalMarks() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [examType, setExamType] = useState('series1');
  const [students, setStudents] = useState([]);
  const [maxMarks, setMaxMarks] = useState(50);

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
      const data = await courseAssignmentAPI.getMine();
      setAssignments(data);
    } catch (err) {
      alert(err.message || 'Failed to fetch courses');
    }
  };

  const fetchSheet = async () => {
    try {
      const sheet = await internalMarksAPI.getInternalMarksSheet(selectedAssignment);
      
      const studentMap = {};
      sheet.forEach(row => {
         if (!studentMap[row.student_id]) {
           studentMap[row.student_id] = {
             student_id: row.student_id,
             student_name: row.student_name,
             roll_no: row.roll_no,
             marks: {}
           };
         }
         if (row.internal_type) {
           studentMap[row.student_id].marks[row.internal_type] = row;
         }
      });
      
      const initialized = Object.values(studentMap).map(s => {
         const markRow = s.marks[examType];
         return {
           ...s,
           marks_obtained: markRow && markRow.marks_obtained !== null ? markRow.marks_obtained : '',
           max_marks: markRow && markRow.max_marks !== null ? markRow.max_marks : maxMarks
         };
      });
      
      // Sort by roll no
      initialized.sort((a, b) => {
        if(a.roll_no < b.roll_no) return -1;
        if(a.roll_no > b.roll_no) return 1;
        return 0;
      });

      setStudents(initialized);
      
      const firstWithMax = initialized.find(s => s.max_marks && s.marks_obtained !== '');
      if (firstWithMax) {
        setMaxMarks(firstWithMax.max_marks);
      }
    } catch (err) {
      alert(err.message || 'Failed to fetch marks sheet');
    }
  };

  const handleMarkChange = (student_id, value) => {
    setStudents(prev => prev.map(s => s.student_id === student_id ? { ...s, marks_obtained: value } : s));
  };

  const handleMaxMarksChange = (value) => {
    setMaxMarks(Number(value));
    setStudents(prev => prev.map(s => ({ ...s, max_marks: Number(value) })));
  };

  const handleSave = async () => {
    const marksData = students.map(s => ({
      student_id: s.student_id,
      internal_type: examType,
      marks_obtained: s.marks_obtained !== '' ? Number(s.marks_obtained) : null,
      max_marks: s.max_marks
    }));

    try {
      await internalMarksAPI.updateInternalMarks(selectedAssignment, marksData);
      alert('Internal marks saved successfully!');
      fetchSheet();
    } catch (err) {
      alert(err.message || 'Failed to save marks');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate('/dashboard?tab=teaching')}>← Back</button>
      <h2>Manage Internal Marks</h2>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <select value={selectedAssignment} onChange={e => setSelectedAssignment(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}>
          <option value="">Select Course Offering...</option>
          {assignments.map(a => (
            <option key={a.course_assignment_id} value={a.course_assignment_id}>{a.course_name} ({a.course_code}) - {a.class_name}</option>
          ))}
        </select>

        <select value={examType} onChange={e => setExamType(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}>
          <option value="series1">Series 1</option>
          <option value="series2">Series 2</option>
          <option value="assignment1">Assignment 1</option>
          <option value="assignment2">Assignment 2</option>
          <option value="attendance">Attendance</option>
          <option value="lab">Lab Internal</option>
        </select>

        {selectedAssignment && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <label style={{ marginRight: '0.5rem' }}>Max Marks:</label>
            <input type="number" value={maxMarks} onChange={e => handleMaxMarksChange(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', width: '80px' }} />
          </div>
        )}
      </div>

      {students.length > 0 && selectedAssignment && (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
            <thead style={{ background: '#f8f9fa' }}>
              <tr>
                <th style={{ padding: '1rem', borderBottom: '2px solid #dee2e6' }}>Roll No</th>
                <th style={{ padding: '1rem', borderBottom: '2px solid #dee2e6' }}>Name</th>
                <th style={{ padding: '1rem', borderBottom: '2px solid #dee2e6' }}>Marks Obtained</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.student_id} style={{ borderBottom: '1px solid #e9ecef' }}>
                  <td style={{ padding: '1rem' }}>{s.roll_no}</td>
                  <td style={{ padding: '1rem' }}>{s.student_name}</td>
                  <td style={{ padding: '1rem' }}>
                    <input
                      type="number"
                      value={s.marks_obtained}
                      onChange={e => handleMarkChange(s.student_id, e.target.value)}
                      max={s.max_marks}
                      min="0"
                      style={{ padding: '0.5rem', width: '100px', border: '1px solid #ced4da', borderRadius: '4px' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button 
            onClick={handleSave} 
            style={{ 
              marginTop: '2rem', 
              padding: '0.75rem 1.5rem', 
              background: '#0d6efd', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Save Internal Marks
          </button>
        </>
      )}
    </div>
  );
}

export default InternalMarks;
