import { useState, useEffect } from 'react';
import { timetableAPI, classAPI, semesterAPI } from '../../services/api';
import { downloadTimetablePdf } from '../../utils/timetablePdf';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

function Timetable() {
  const [classes, setClasses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [classInfo, setClassInfo] = useState(null);
  const [periodOptions, setPeriodOptions] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [timetableRows, setTimetableRows] = useState([]);
  const [slots, setSlots] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const [clData, semData] = await Promise.all([
          classAPI.getAll(),
          semesterAPI.getAll()
        ]);
        setClasses(clData);
        setSemesters(semData);
        const active = semData.find(s => s.is_active);
        if (active) setSelectedSemester(active.id);
        if (clData.length) setSelectedClass(clData[0].id);
      } catch (err) {
        alert(err.message);
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSemester) fetchClassData();
  }, [selectedClass, selectedSemester, selectedPeriod]);

  const fetchClassData = async () => {
    try {
      const bootstrap = await timetableAPI.getAvailableCourses(selectedClass, {
        semester_id: selectedSemester,
        ...(selectedPeriod ? { period_number: selectedPeriod } : {})
      });

      setClassInfo(bootstrap.class);
      const opts = (bootstrap.class?.applicable_periods || []).map(p => ({
        period_number: p,
        label: `${bootstrap.class?.period_label || 'Semester'} ${p}`
      }));
      setPeriodOptions(opts);

      const period = selectedPeriod || (opts[0] ? String(opts[0].period_number) : '');
      if (!selectedPeriod && period) {
        setSelectedPeriod(period);
        return;
      }
      if (!period) return;

      const [timetable, courseData] = await Promise.all([
        timetableAPI.get(selectedClass, selectedSemester),
        timetableAPI.getAvailableCourses(selectedClass, {
          semester_id: selectedSemester,
          period_number: period
        })
      ]);

      setAvailableCourses(courseData.courses || []);
      setTimetableRows(timetable);

      const newSlots = {};
      timetable.forEach(t => {
        const key = `${t.day_of_week}-${t.period_no}`;
        if (t.department_course_id) {
          newSlots[key] = `dc:${t.department_course_id}`;
        } else if (t.course_assignment_id) {
          newSlots[key] = t.course_assignment_id;
        }
      });
      setSlots(newSlots);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSlotChange = (day, period, value) => {
    setSlots({ ...slots, [`${day}-${period}`]: value });
  };

  const handleSave = async () => {
    const payloadSlots = [];
    Object.keys(slots).forEach(key => {
      const [day_of_week, period_no] = key.split('-');
      const val = slots[key];
      if (!val) return;
      const slot = {
        day_of_week,
        period_no: parseInt(period_no, 10),
        start_time: `${8 + parseInt(period_no, 10)}:00:00`,
        end_time: `${9 + parseInt(period_no, 10)}:00:00`
      };
      if (String(val).startsWith('dc:')) {
        slot.department_course_id = val.replace('dc:', '');
      } else {
        slot.course_assignment_id = val;
      }
      payloadSlots.push(slot);
    });

    try {
      await timetableAPI.upload({
        class_id: selectedClass,
        semester_id: selectedSemester,
        slots: payloadSlots
      });
      alert('Timetable saved successfully');
      fetchClassData();
    } catch (err) {
      alert('Error saving timetable: ' + err.message);
    }
  };

  const handleDownloadPdf = () => {
    const cls = classes.find(c => c.id === selectedClass);
    const sem = semesters.find(s => s.id === selectedSemester);
    downloadTimetablePdf({
      title: `Timetable — ${cls?.name || 'Class'} ${cls?.section || ''}`,
      subtitle: `${sem?.name || ''} | ${classInfo?.period_label || 'Semester'} ${selectedPeriod}`,
      timetable: timetableRows
    });
  };

  const periodLabel = classInfo?.period_label || 'Semester';

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>Manage Class Timetable</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
        Select class, academic semester, and {periodLabel.toLowerCase()} for the class year. Faculty assignment is optional.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <select
          value={selectedClass}
          onChange={e => { setSelectedClass(e.target.value); setSelectedPeriod(''); setClassInfo(null); }}
          style={{ padding: '0.5rem', minWidth: '220px' }}
        >
          <option value="">Select class…</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name} — {c.section} (Year {c.year})</option>
          ))}
        </select>

        <select
          value={selectedSemester}
          onChange={e => setSelectedSemester(e.target.value)}
          style={{ padding: '0.5rem', minWidth: '200px' }}
        >
          <option value="">Academic semester…</option>
          {semesters.map(s => (
            <option key={s.id} value={s.id}>{s.name} {s.is_active ? '(Active)' : ''}</option>
          ))}
        </select>

        <select
          value={selectedPeriod}
          onChange={e => setSelectedPeriod(e.target.value)}
          style={{ padding: '0.5rem', minWidth: '160px' }}
          disabled={!periodOptions.length}
        >
          <option value="">{periodLabel}…</option>
          {periodOptions.map(p => (
            <option key={p.period_number} value={p.period_number}>{p.label}</option>
          ))}
        </select>
      </div>

      {selectedClass && selectedSemester && (selectedPeriod || periodOptions.length > 0) && (
        <>
          {classInfo && (
            <div style={{
              background: '#eef2ff', padding: '0.75rem 1rem', borderRadius: '8px',
              marginBottom: '1rem', fontSize: '.9rem', color: '#4338ca'
            }}>
              Class Year {classInfo.year} — scheduling <strong>{periodLabel} {selectedPeriod}</strong>
            </div>
          )}

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
                        style={{ width: '100%', fontSize: '.75rem' }}
                      >
                        <option value="">— Off —</option>
                        {availableCourses.map(c => (
                          <option key={c.department_course_id} value={`dc:${c.department_course_id}`}>
                            {c.code} — {c.course_name}
                            {c.faculty_name ? ` (${c.faculty_name})` : ''}
                          </option>
                        ))}
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleSave}
              style={{
                padding: '0.6rem 1.5rem', background: '#4f46e5', color: '#fff',
                border: 'none', borderRadius: '8px', cursor: 'pointer'
              }}
            >
              Save Timetable
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              style={{
                padding: '0.6rem 1.5rem', background: '#fff', color: '#4f46e5',
                border: '2px solid #4f46e5', borderRadius: '8px', cursor: 'pointer'
              }}
            >
              Download PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Timetable;
