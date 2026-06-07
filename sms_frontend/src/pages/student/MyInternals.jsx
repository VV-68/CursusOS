import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { internalMarksAPI } from '../../services/api';

function MyInternals() {
  const navigate = useNavigate();
  const [internals, setInternals] = useState({});
  const [loading, setLoading] = useState(false);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');

  useEffect(() => {
    fetchMyInternals();
  }, []);

  const fetchMyInternals = async () => {
    try {
      setLoading(true);
      const data = await internalMarksAPI.getStudentInternals();
      
      // Group by semester and then course
      const grouped = {};
      const sems = [];
      data.forEach(row => {
        if (!grouped[row.semester_name]) {
          grouped[row.semester_name] = { semester_id: row.semester_id, period_number: row.period_number, courses: {} };
          sems.push({ name: row.semester_name, period_number: row.period_number });
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
      
      sems.sort((a, b) => (b.period_number || 0) - (a.period_number || 0));
      setSemesters(sems);
      if (sems.length > 0) setSelectedSemester(sems[0].name);
      setInternals(grouped);
    } catch (err) {
      alert(err.message || 'Failed to fetch your internals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate('/dashboard?tab=academics')}>← Back</button>
      <h2>My Internal Marks</h2>
      
      {loading ? (
        <p>Loading...</p>
      ) : (
        Object.keys(internals).length > 0 ? (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontWeight: 600, marginRight: '0.5rem' }}>Semester:</label>
              <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)}
                style={{ padding: '0.5rem 1rem', borderRadius: 6, border: '1px solid #d1d5db', minWidth: 200 }}>
                {semesters.map(s => (
                  <option key={s.name} value={s.name}>{s.name} {s.period_number === semesters[0].period_number ? '(Current)' : ''}</option>
                ))}
              </select>
            </div>
            {selectedSemester && internals[selectedSemester] && (
              <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #ccc', borderRadius: '8px', background: '#fff' }}>
                {Object.keys(internals[selectedSemester].courses).length > 0 ? (
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
                      {Object.values(internals[selectedSemester].courses).map(course => {
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
            )}
          </div>
        ) : (
          <p>No internal marks found.</p>
        )
      )}
    </div>
  );
}

export default MyInternals;
