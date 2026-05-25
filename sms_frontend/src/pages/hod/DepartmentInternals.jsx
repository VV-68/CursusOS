import { useState, useEffect } from 'react';
import { internalMarksAPI, classAPI } from '../../services/api';
import { jwtDecode } from 'jwt-decode';

function DepartmentInternals() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [internals, setInternals] = useState({});
  const [loading, setLoading] = useState(false);
  const [deptId, setDeptId] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = jwtDecode(token);
        if (payload.dept_id) setDeptId(payload.dept_id);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (deptId) {
      classAPI.getAll()
        .then(data => {
          // Filter to classes in this department if possible
          setClasses(data);
        })
        .catch(() => {});
    }
  }, [deptId]);

  useEffect(() => {
    if (selectedClass) fetchInternals();
    else setInternals({});
  }, [selectedClass]);

  const fetchInternals = async () => {
    setLoading(true);
    try {
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
        const st = studentMap[row.student_id];
        if (row.course_code) {
          if (!st.courses[row.course_code]) {
            st.courses[row.course_code] = {
              course_name: row.course_name,
              course_code: row.course_code,
              marks: {}
            };
          }
          if (row.internal_type && row.marks_obtained !== null) {
            st.courses[row.course_code].marks[row.internal_type] = {
              marks_obtained: row.marks_obtained,
              max_marks: row.max_marks
            };
          }
        }
      });
      setInternals(studentMap);
    } catch (err) {
      alert(err.message || 'Failed to fetch internals');
    } finally {
      setLoading(false);
    }
  };

  const students = Object.values(internals).sort((a, b) => a.roll_no?.localeCompare(b.roll_no));

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <h2>Department Internal Marks</h2>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ fontWeight: 600, marginRight: '0.5rem' }}>Select Class:</label>
        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
          style={{ padding: '0.5rem 1rem', borderRadius: 6, border: '1px solid #d1d5db', minWidth: 220 }}>
          <option value="">— Choose a class —</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name} — {c.section} {c.year ? `(Year ${c.year})` : ''}</option>
          ))}
        </select>
      </div>

      {!selectedClass && (
        <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 10, padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
          Select a class to view internal marks.
        </div>
      )}

      {loading && <p style={{ color: '#64748b' }}>Loading…</p>}

      {!loading && selectedClass && students.length === 0 && (
        <p style={{ color: '#64748b' }}>No internal marks found for this class.</p>
      )}

      {!loading && students.length > 0 && (
        <div>
          {students.map(student => (
            <div key={student.student_id} style={{
              marginBottom: '1.5rem', padding: '1rem 1.25rem',
              background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0'
            }}>
              <h4 style={{ margin: '0 0 0.75rem', color: '#1e293b' }}>
                {student.roll_no} — {student.student_name}
              </h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#e9ecef' }}>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Course</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center' }}>S1</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center' }}>S2</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center' }}>A1</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center' }}>A2</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center' }}>Att</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 700 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(student.courses).map(course => {
                      const s1 = course.marks['series1'];
                      const s2 = course.marks['series2'];
                      const a1 = course.marks['assignment1'];
                      const a2 = course.marks['assignment2'];
                      const att = course.marks['attendance'];
                      const total = [s1, s2, a1, a2, att].reduce((sum, m) => sum + (m ? Number(m.marks_obtained) : 0), 0);
                      return (
                        <tr key={course.course_code} style={{ borderBottom: '1px solid #dee2e6', textAlign: 'center' }}>
                          <td style={{ padding: '0.5rem', textAlign: 'left' }}>
                            {course.course_name} <small style={{ color: '#6b7280' }}>({course.course_code})</small>
                          </td>
                          <td>{s1 ? s1.marks_obtained : '-'}</td>
                          <td>{s2 ? s2.marks_obtained : '-'}</td>
                          <td>{a1 ? a1.marks_obtained : '-'}</td>
                          <td>{a2 ? a2.marks_obtained : '-'}</td>
                          <td>{att ? att.marks_obtained : '-'}</td>
                          <td style={{ fontWeight: 700 }}>{total > 0 ? total : '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '2rem', textAlign: 'right' }}>
        <a href="#top" style={{ color: '#6b7280', fontSize: '0.85rem', textDecoration: 'none' }}>↑ Back to top</a>
      </div>
    </div>
  );
}

export default DepartmentInternals;
