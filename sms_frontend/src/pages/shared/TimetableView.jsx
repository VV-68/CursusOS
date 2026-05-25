import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { timetableAPI, classAPI } from '../../services/api';
import { jwtDecode } from 'jwt-decode';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

function TimetableView() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [timetable, setTimetable] = useState([]);
  const [isStudent, setIsStudent] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    let role = '';
    let classId = '';
    if (token) {
      try {
        const decoded = jwtDecode(token);
        role = decoded.role;
        classId = decoded.class_id || '';
      } catch {}
    }

    if (role === 'student') {
      // Students: auto-load their own class, no dropdown
      setIsStudent(true);
      if (classId) setSelectedClass(classId);
    } else {
      // Faculty / advisor / hod / admin: load all classes
      classAPI.getAllUnrestricted().then(setClasses).catch(err => alert(err.message));
    }
  }, []);

  useEffect(() => {
    if (selectedClass) fetchTimetable();
    else setTimetable([]);
  }, [selectedClass]);

  const fetchTimetable = async () => {
    try {
      const data = await timetableAPI.get(selectedClass);
      setTimetable(data);
    } catch (err) {
      alert(err.message);
    }
  };

  const getSlot = (day, period) =>
    timetable.find(t => t.day_of_week === day && t.period_no === period);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate('/dashboard?tab=general')}>← Back</button>
      <h2>View Timetable</h2>

      {!isStudent && (
        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
          style={{ marginBottom: '1.5rem', padding: '0.5rem 1rem', borderRadius: 6, border: '1px solid #d1d5db', minWidth: 240 }}>
          <option value="">Select class...</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name} — {c.section} {c.year ? `(Year ${c.year})` : ''}</option>
          ))}
        </select>
      )}

      {selectedClass && timetable.length === 0 && (
        <p style={{ color: '#9ca3af' }}>No timetable uploaded for this class yet.</p>
      )}

      {selectedClass && timetable.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', minWidth: 700 }}>
            <thead>
              <tr style={{ background: '#e8eaf6' }}>
                <th style={{ padding: '0.7rem 1rem', fontWeight: 700, textAlign: 'left' }}>Day / Period</th>
                {PERIODS.map(p => (
                  <th key={p} style={{ padding: '0.7rem 0.5rem', fontWeight: 600 }}>P{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map(day => (
                <tr key={day} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ fontWeight: 700, padding: '0.7rem 1rem', background: '#f9fafb', textAlign: 'left' }}>{day}</td>
                  {PERIODS.map(period => {
                    const slot = getSlot(day, period);
                    return (
                      <td key={`${day}-${period}`} style={{ padding: '0.5rem', border: '1px solid #e5e7eb', minWidth: 90 }}>
                        {slot ? (
                          <>
                            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1e293b' }}>
                              {slot.course_name || slot.course_code}
                            </div>
                            {slot.faculty_name && (
                              <div style={{ fontSize: '0.71rem', color: '#6b7280', marginTop: '0.15rem' }}>
                                {slot.faculty_name}
                              </div>
                            )}
                          </>
                        ) : (
                          <span style={{ color: '#d1d5db', fontSize: '0.75rem' }}>—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Back to top */}
      <div style={{ marginTop: '2rem', textAlign: 'right' }}>
        <a href="#top" style={{ color: '#6b7280', fontSize: '0.85rem', textDecoration: 'none' }}>↑ Back to top</a>
      </div>
    </div>
  );
}

export default TimetableView;
