import { useState, useEffect } from 'react';
import { timetableAPI, classAPI } from '../../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

function Timetable() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [classInfo, setClassInfo] = useState(null);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [slots, setSlots] = useState({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass) fetchClassData();
  }, [selectedClass]);

  const fetchInitialData = async () => {
    try {
      const clData = await classAPI.getAll();
      setClasses(clData);
      if (clData.length) setSelectedClass(clData[0].id);
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchClassData = async () => {
    try {
      const [timetable, courseData] = await Promise.all([
        timetableAPI.get(selectedClass),
        timetableAPI.getAvailableCourses(selectedClass)
      ]);

      const courses = Array.isArray(courseData) ? courseData : (courseData.courses || []);
      setClassInfo(Array.isArray(courseData) ? null : courseData.class);
      setAvailableCourses(courses);

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
        const start_time = `${8 + parseInt(period_no, 10)}:00:00`;
        const end_time = `${9 + parseInt(period_no, 10)}:00:00`;
        payloadSlots.push({
          course_assignment_id: slots[key],
          day_of_week,
          period_no: parseInt(period_no, 10),
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

  const assignedCourses = availableCourses.filter(c => c.course_assignment_id);
  const unassignedCourses = availableCourses.filter(c => !c.course_assignment_id);
  const periodLabel = classInfo?.period_label || 'Semester';

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>Manage Class Timetable</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
        Build a timetable from courses assigned to your class for the matching {periodLabel.toLowerCase()}/year.
      </p>

      <select
        value={selectedClass}
        onChange={e => setSelectedClass(e.target.value)}
        style={{ marginBottom: '1rem', padding: '0.5rem', minWidth: '280px' }}
      >
        <option value="">Select your class…</option>
        {classes.map(c => (
          <option key={c.id} value={c.id}>{c.name} — {c.section} (Year {c.year})</option>
        ))}
      </select>

      {selectedClass && classInfo && (
        <div style={{
          background: '#eef2ff', padding: '0.75rem 1rem', borderRadius: '8px',
          marginBottom: '1.5rem', fontSize: '.9rem', color: '#4338ca'
        }}>
          Showing courses for <strong>{periodLabel} {classInfo.period_number}</strong>
          {' '}(Class year: {classInfo.year})
        </div>
      )}

      {selectedClass && (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', marginBottom: '1rem' }}>
            <thead>
              <tr style={{ background: '#eee' }}>
                <th>Day / Period</th>
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
                        style={{ width: '100%', fontSize: '.8rem' }}
                      >
                        <option value="">— Off —</option>
                        {assignedCourses.map(ca => (
                          <option key={ca.course_assignment_id} value={ca.course_assignment_id}>
                            {ca.code} — {ca.course_name || ca.name}
                            {ca.faculty_name ? ` (${ca.faculty_name})` : ''}
                          </option>
                        ))}
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '1rem', color: '#666', fontSize: '0.9em' }}>
            <strong>Not yet assigned to faculty (cannot schedule):</strong>
            <ul>
              {unassignedCourses.map(c => (
                <li key={c.course_id || c.code}>
                  {c.code} — {c.course_name || c.name}
                </li>
              ))}
              {unassignedCourses.length === 0 && <li>None — all courses have faculty assigned</li>}
            </ul>
          </div>

          {assignedCourses.length === 0 && (
            <p style={{ color: '#b45309', background: '#fffbeb', padding: '0.75rem', borderRadius: '8px' }}>
              No faculty-assigned courses for this class&apos;s {periodLabel.toLowerCase()}.
              Ask your HOD to assign faculty first.
            </p>
          )}

          <button
            type="button"
            onClick={handleSave}
            style={{
              marginTop: '1.5rem', padding: '0.6rem 1.5rem',
              background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer'
            }}
          >
            Save Timetable
          </button>
        </>
      )}
    </div>
  );
}

export default Timetable;
