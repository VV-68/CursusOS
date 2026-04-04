import { useState, useEffect } from 'react';
import { timetableAPI, classAPI } from '../../services/api';
// Normally jwtDecode would be used if we need default class for student
import { jwtDecode } from 'jwt-decode';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

function TimetableView() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [timetable, setTimetable] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchTimetable();
    }
  }, [selectedClass]);

  const fetchInitialData = async () => {
    try {
      const clData = await classAPI.getAll();
      setClasses(clData);
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchTimetable = async () => {
    try {
      const data = await timetableAPI.get(selectedClass);
      setTimetable(data);
    } catch (err) {
      alert(err.message);
    }
  };

  const getSlot = (day, period) => {
    return timetable.find(t => t.day_of_week === day && t.period_no === period);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>View Timetable</h2>
      <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{ marginBottom: '2rem' }}>
        <option value="">Select class...</option>
        {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
      </select>

      {selectedClass && (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
          <thead>
            <tr style={{ background: '#eee' }}>
              <th>Period / Day</th>
              {PERIODS.map(p => <th key={p}>Period {p}</th>)}
            </tr>
          </thead>
          <tbody>
            {DAYS.map(day => (
              <tr key={day} style={{ borderBottom: '1px solid #ccc' }}>
                <td style={{ fontWeight: 'bold', padding: '1rem' }}>{day}</td>
                {PERIODS.map(period => {
                  const slot = getSlot(day, period);
                  return (
                    <td key={`${day}-${period}`} style={{ padding: '0.5rem', border: '1px solid #ddd' }}>
                      {slot ? (
                        <>
                          <div style={{ fontWeight: 'bold' }}>{slot.course_name || slot.course_code}</div>
                          <div style={{ fontSize: '0.8rem', color: '#555' }}>{slot.faculty_name}</div>
                        </>
                      ) : (
                        <div style={{ color: '#ccc' }}>-</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default TimetableView;
