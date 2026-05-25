import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { internalMarksAPI, classAPI } from '../../services/api';

function ClassInternals() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [internals, setInternals] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchInternals();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      // Reusing API if it exists, or just use general getClasses (assuming advisor filter applies on backend)
      // Wait, getAdvisorClasses exists. Let's use it.
      const data = await classAPI.getAll();
      setClasses(data);
      if (data.length > 0) setSelectedClass(data[0].id);
    } catch (err) {
      alert(err.message || 'Failed to fetch advisor classes');
    }
  };

  const fetchInternals = async () => {
    try {
      setLoading(true);
      const data = await internalMarksAPI.getClassInternals(selectedClass);
      
      // Group by student
      const studentMap = {};
      data.forEach(row => {
        if (!studentMap[row.student_id]) {
          studentMap[row.student_id] = {
            student_id: row.student_id,
            student_name: row.student_name,
            roll_no: row.roll_no,
            courses: {}
          };
        }
        if (row.course_code) {
          if (!studentMap[row.student_id].courses[row.course_code]) {
            studentMap[row.student_id].courses[row.course_code] = {
              course_name: row.course_name,
              course_code: row.course_code,
              marks: {}
            };
          }
          if (row.internal_type && row.marks_obtained !== null) {
            studentMap[row.student_id].courses[row.course_code].marks[row.internal_type] = {
              marks_obtained: row.marks_obtained,
              max_marks: row.max_marks
            };
          }
        }
      });
      
      const grouped = Object.values(studentMap).sort((a, b) => {
        if(a.roll_no < b.roll_no) return -1;
        if(a.roll_no > b.roll_no) return 1;
        return 0;
      });
      
      setInternals(grouped);
    } catch (err) {
      alert(err.message || 'Failed to fetch class internals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate('/dashboard?tab=oversight')}>← Back</button>
      <h2>Class Internal Marks</h2>
      
      <div style={{ marginBottom: '2rem' }}>
        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px' }}>
          <option value="">Select Class...</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name} - {c.year} Year {c.section}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        internals.length > 0 ? (
          <div>
            {internals.map(student => (
              <div key={student.student_id} style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', background: '#fff' }}>
                <h3 style={{ marginTop: 0 }}>{student.roll_no} - {student.student_name}</h3>
                
                {Object.keys(student.courses).length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ padding: '0.5rem', borderBottom: '1px solid #dee2e6' }}>Course</th>
                        <th style={{ padding: '0.5rem', borderBottom: '1px solid #dee2e6' }}>Series 1</th>
                        <th style={{ padding: '0.5rem', borderBottom: '1px solid #dee2e6' }}>Series 2</th>
                        <th style={{ padding: '0.5rem', borderBottom: '1px solid #dee2e6' }}>Assignment 1</th>
                        <th style={{ padding: '0.5rem', borderBottom: '1px solid #dee2e6' }}>Assignment 2</th>
                        <th style={{ padding: '0.5rem', borderBottom: '1px solid #dee2e6' }}>Attendance</th>
                        <th style={{ padding: '0.5rem', borderBottom: '1px solid #dee2e6' }}>Total/Average (Dynamic)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(student.courses).map(course => {
                        const s1 = course.marks['series1'];
                        const s2 = course.marks['series2'];
                        const a1 = course.marks['assignment1'];
                        const a2 = course.marks['assignment2'];
                        const att = course.marks['attendance'];
                        
                        // Example dynamic calculation (can be customized based on college rules)
                        // e.g. Series out of 20 each scaled, or average. Here we just show the sum of what's available
                        let total = 0;
                        if(s1) total += Number(s1.marks_obtained);
                        if(s2) total += Number(s2.marks_obtained);
                        if(a1) total += Number(a1.marks_obtained);
                        if(a2) total += Number(a2.marks_obtained);
                        if(att) total += Number(att.marks_obtained);

                        return (
                          <tr key={course.course_code} style={{ borderBottom: '1px solid #eee', textAlign: 'center' }}>
                            <td style={{ padding: '0.5rem', textAlign: 'left' }}>{course.course_name} ({course.course_code})</td>
                            <td style={{ padding: '0.5rem' }}>{s1 ? `${s1.marks_obtained}/${s1.max_marks}` : '-'}</td>
                            <td style={{ padding: '0.5rem' }}>{s2 ? `${s2.marks_obtained}/${s2.max_marks}` : '-'}</td>
                            <td style={{ padding: '0.5rem' }}>{a1 ? `${a1.marks_obtained}/${a1.max_marks}` : '-'}</td>
                            <td style={{ padding: '0.5rem' }}>{a2 ? `${a2.marks_obtained}/${a2.max_marks}` : '-'}</td>
                            <td style={{ padding: '0.5rem' }}>{att ? `${att.marks_obtained}/${att.max_marks}` : '-'}</td>
                            <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{total > 0 ? total : '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <p>No marks recorded yet.</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>No student marks found for this class.</p>
        )
      )}
    </div>
  );
}

export default ClassInternals;
