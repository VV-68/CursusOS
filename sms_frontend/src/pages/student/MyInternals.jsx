import { useState, useEffect } from 'react';
import { internalMarksAPI } from '../../services/api';

function MyInternals() {
  const [internals, setInternals] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMyInternals();
  }, []);

  const fetchMyInternals = async () => {
    try {
      setLoading(true);
      const data = await internalMarksAPI.getStudentInternals();
      
      // Group by semester and then course
      const grouped = {};
      data.forEach(row => {
        if (!grouped[row.semester_name]) {
          grouped[row.semester_name] = { semester_id: row.semester_id, courses: {} };
        }
        
        const sem = grouped[row.semester_name].courses;
        if (!sem[row.course_code]) {
          sem[row.course_code] = {
            course_name: row.course_name,
            course_code: row.course_code,
            marks: {}
          };
        }
        
        if (row.internal_type && row.marks_obtained !== null) {
          sem[row.course_code].marks[row.internal_type] = {
            marks_obtained: row.marks_obtained,
            max_marks: row.max_marks
          };
        }
      });
      
      setInternals(grouped);
    } catch (err) {
      alert(err.message || 'Failed to fetch your internals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>My Internal Marks</h2>
      
      {loading ? (
        <p>Loading...</p>
      ) : (
        Object.keys(internals).length > 0 ? (
          <div>
            {Object.entries(internals).map(([semName, semData]) => (
              <div key={semName} style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #ccc', borderRadius: '8px', background: '#fff' }}>
                <h3 style={{ marginTop: 0, color: '#0d6efd', borderBottom: '2px solid #0d6efd', paddingBottom: '0.5rem' }}>{semName}</h3>
                
                {Object.keys(semData.courses).length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ padding: '0.75rem', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>Course</th>
                        <th style={{ padding: '0.75rem', borderBottom: '2px solid #dee2e6' }}>Series 1</th>
                        <th style={{ padding: '0.75rem', borderBottom: '2px solid #dee2e6' }}>Series 2</th>
                        <th style={{ padding: '0.75rem', borderBottom: '2px solid #dee2e6' }}>Assignment 1</th>
                        <th style={{ padding: '0.75rem', borderBottom: '2px solid #dee2e6' }}>Assignment 2</th>
                        <th style={{ padding: '0.75rem', borderBottom: '2px solid #dee2e6' }}>Attendance</th>
                        <th style={{ padding: '0.75rem', borderBottom: '2px solid #dee2e6' }}>Total/Average</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(semData.courses).map(course => {
                        const s1 = course.marks['series1'];
                        const s2 = course.marks['series2'];
                        const a1 = course.marks['assignment1'];
                        const a2 = course.marks['assignment2'];
                        const att = course.marks['attendance'];
                        
                        let total = 0;
                        if(s1) total += Number(s1.marks_obtained);
                        if(s2) total += Number(s2.marks_obtained);
                        if(a1) total += Number(a1.marks_obtained);
                        if(a2) total += Number(a2.marks_obtained);
                        if(att) total += Number(att.marks_obtained);

                        return (
                          <tr key={course.course_code} style={{ borderBottom: '1px solid #eee', textAlign: 'center' }}>
                            <td style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '500' }}>{course.course_name} <br/><small style={{color: '#6c757d'}}>{course.course_code}</small></td>
                            <td style={{ padding: '0.75rem' }}>{s1 ? `${s1.marks_obtained}/${s1.max_marks}` : '-'}</td>
                            <td style={{ padding: '0.75rem' }}>{s2 ? `${s2.marks_obtained}/${s2.max_marks}` : '-'}</td>
                            <td style={{ padding: '0.75rem' }}>{a1 ? `${a1.marks_obtained}/${a1.max_marks}` : '-'}</td>
                            <td style={{ padding: '0.75rem' }}>{a2 ? `${a2.marks_obtained}/${a2.max_marks}` : '-'}</td>
                            <td style={{ padding: '0.75rem' }}>{att ? `${att.marks_obtained}/${att.max_marks}` : '-'}</td>
                            <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#198754' }}>{total > 0 ? total : '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <p>No marks recorded for this semester.</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>No internal marks found.</p>
        )
      )}
    </div>
  );
}

export default MyInternals;
