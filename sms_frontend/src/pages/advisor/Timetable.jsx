import { useState, useEffect } from 'react';
import { timetableAPI, courseAPI, classAPI } from '../../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

function Timetable() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [courseAssignments, setCourseAssignments] = useState([]);
  const [slots, setSlots] = useState({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchClassData();
    }
  }, [selectedClass]);

  const fetchInitialData = async () => {
    try {
      // For advisor, classAPI.getAll() will return their assigned classes
      const clData = await classAPI.getAll();
      setClasses(clData);
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchClassData = async () => {
    try {
      const [timetable, assignments] = await Promise.all([
        timetableAPI.get(selectedClass),
        courseAPI.getAssignments({ class_id: selectedClass })
      ]);
      setCourseAssignments(assignments);
      
      const newSlots = {};
      timetable.forEach(t => {
        const key = `${t.day_of_week}-${t.period_no}`;
        newSlots[key] = t.course_assignment_id;
      });
      setSlots(newSlots);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSlotChange = (day, period, value) => {
    const key = `${day}-${period}`;
    setSlots({ ...slots, [key]: value });
  };

  const handleSave = async () => {
    const payloadSlots = [];
    Object.keys(slots).forEach(key => {
      const [day_of_week, period_no] = key.split('-');
      if (slots[key]) {
        // We'll generate dummy start_time and end_time based on period_no
        // Replace this with real schedule times if necessary
        const start_time = `${8 + parseInt(period_no)}:00:00`;
        const end_time = `${9 + parseInt(period_no)}:00:00`;
        
        payloadSlots.push({
          course_assignment_id: slots[key],
          day_of_week,
          period_no: parseInt(period_no),
          start_time,
          end_time
        });
      }
    });

    try {
      await timetableAPI.upload({ class_id: selectedClass, slots: payloadSlots });
      alert('Timetable saved successfully');
    } catch (err) {
      alert('Error saving timetable: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Manage Timetable</h2>
      <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{ marginBottom: '2rem' }}>
        <option value="">Select your class...</option>
        {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
      </select>

      {selectedClass && (
        <>
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
                  <td style={{ fontWeight: 'bold' }}>{day}</td>
                  {PERIODS.map(period => (
                    <td key={`${day}-${period}`} style={{ padding: '0.5rem' }}>
                      <select 
                        value={slots[`${day}-${period}`] || ''} 
                        onChange={e => handleSlotChange(day, period, e.target.value)}
                        style={{ width: '100%' }}
                      >
                        <option value="">Off</option>
                        {courseAssignments.map(ca => (
                          // Ideally show course short name or subject, here we just show assignment UUID or course id
                          // The `v_timetable` actually shows name.
                          <option key={ca.id} value={ca.id}>Ref: {ca.course_id.substring(0,6)}...</option>
                        ))}
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={handleSave} style={{ marginTop: '2rem' }}>Save Timetable</button>
        </>
      )}
    </div>
  );
}

export default Timetable;
