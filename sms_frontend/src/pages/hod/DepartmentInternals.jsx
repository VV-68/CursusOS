import { useState, useEffect } from 'react';
import { internalMarksAPI } from '../../services/api';

function DepartmentInternals() {
  const [internals, setInternals] = useState({});
  const [loading, setLoading] = useState(false);
  const [filterClass, setFilterClass] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload);
      } catch (e) {
        console.error('Invalid token', e);
      }
    }
  }, []);


  useEffect(() => {
    if (user && user.dept_id) {
      fetchDepartmentInternals();
    }
  }, [user]);

  const fetchDepartmentInternals = async () => {
    try {
      setLoading(true);
      const data = await API.getDepartmentInternals(user.dept_id);
      
      // We will store it flat and filter dynamically, or group it.
      // Grouping by Class then Student is best for HOD view.
      
      const classMap = {};
      data.forEach(row => {
        if (!classMap[row.class_name]) {
          classMap[row.class_name] = {
            class_name: row.class_name,
            semester_name: row.semester_name,
            students: {}
          };
        }
        
        const st = classMap[row.class_name].students;
        if (!st[row.student_id]) {
          st[row.student_id] = {
            student_id: row.student_id,
            student_name: row.student_name,
            roll_no: row.roll_no,
            courses: {}
          };
        }
        
        if (row.course_code) {
          if (!st[row.student_id].courses[row.course_code]) {
            st[row.student_id].courses[row.course_code] = {
              course_name: row.course_name,
              course_code: row.course_code,
              marks: {}
            };
          }
          if (row.internal_type && row.marks_obtained !== null) {
            st[row.student_id].courses[row.course_code].marks[row.internal_type] = {
              marks_obtained: row.marks_obtained,
              max_marks: row.max_marks
            };
          }
        }
      });
      
      setInternals(classMap);
    } catch (err) {
      alert(err.message || 'Failed to fetch department internals');
    } finally {
      setLoading(false);
    }
  };

  const classes = Object.values(internals);
  const filteredClasses = classes.filter(c => {
    if (filterClass && c.class_name !== filterClass) return false;
    if (filterSemester && c.semester_name !== filterSemester) return false;
    return true;
  });

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Department Internal Marks</h2>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px' }}>
          <option value="">All Classes</option>
          {[...new Set(classes.map(c => c.class_name))].sort().map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        
        <select value={filterSemester} onChange={e => setFilterSemester(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px' }}>
          <option value="">All Semesters</option>
          {[...new Set(classes.map(c => c.semester_name))].sort().map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        filteredClasses.length > 0 ? (
          <div>
            {filteredClasses.map(cls => (
              <div key={cls.class_name} style={{ marginBottom: '3rem' }}>
                <h3 style={{ borderBottom: '2px solid #ccc', paddingBottom: '0.5rem' }}>{cls.class_name} ({cls.semester_name})</h3>
                
                {Object.values(cls.students).sort((a,b) => a.roll_no.localeCompare(b.roll_no)).map(student => (
                  <div key={student.student_id} style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 1rem 0' }}>{student.roll_no} - {student.student_name}</h4>
                    
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#e9ecef' }}>
                          <th style={{ padding: '0.5rem', textAlign: 'left' }}>Course</th>
                          <th style={{ padding: '0.5rem' }}>S1</th>
                          <th style={{ padding: '0.5rem' }}>S2</th>
                          <th style={{ padding: '0.5rem' }}>A1</th>
                          <th style={{ padding: '0.5rem' }}>A2</th>
                          <th style={{ padding: '0.5rem' }}>Att</th>
                          <th style={{ padding: '0.5rem' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.values(student.courses).map(course => {
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
                            <tr key={course.course_code} style={{ borderBottom: '1px solid #dee2e6', textAlign: 'center' }}>
                              <td style={{ padding: '0.5rem', textAlign: 'left' }}>{course.course_name} <small>({course.course_code})</small></td>
                              <td style={{ padding: '0.5rem' }}>{s1 ? `${s1.marks_obtained}` : '-'}</td>
                              <td style={{ padding: '0.5rem' }}>{s2 ? `${s2.marks_obtained}` : '-'}</td>
                              <td style={{ padding: '0.5rem' }}>{a1 ? `${a1.marks_obtained}` : '-'}</td>
                              <td style={{ padding: '0.5rem' }}>{a2 ? `${a2.marks_obtained}` : '-'}</td>
                              <td style={{ padding: '0.5rem' }}>{att ? `${att.marks_obtained}` : '-'}</td>
                              <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{total > 0 ? total : '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <p>No internal marks found for the selected filters.</p>
        )
      )}
    </div>
  );
}

export default DepartmentInternals;
