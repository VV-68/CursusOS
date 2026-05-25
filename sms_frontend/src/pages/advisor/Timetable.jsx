import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { timetableAPI, classAPI, semesterAPI } from '../../services/api';
import { downloadTimetablePdf } from '../../utils/timetablePdf';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

// ── Read-only timetable table ──────────────────────────────────────────────
function TimetableReadOnly({ timetableRows, downloadPdf }) {
  const navigate = useNavigate();
  const getSlot = (day, period) =>
    timetableRows.find(t => t.day_of_week === day && t.period_no === period);

  return (
    <>
      <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', minWidth: 700 }}>
          <thead>
            <tr style={{ background: '#e8eaf6' }}>
              <th style={{ padding: '0.6rem 0.75rem', fontWeight: 700 }}>Day / Period</th>
              {PERIODS.map(p => <th key={p} style={{ padding: '0.6rem' }}>P{p}</th>)}
            </tr>
          </thead>
          <tbody>
            {DAYS.map(day => (
              <tr key={day} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ fontWeight: 700, padding: '0.6rem 0.75rem', background: '#f3f4f6' }}>{day}</td>
                {PERIODS.map(period => {
                  const slot = getSlot(day, period);
                  return (
                    <td key={`${day}-${period}`} style={{ padding: '0.4rem', border: '1px solid #e5e7eb', minWidth: 90 }}>
                      {slot ? (
                        <>
                          <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{slot.course_name || slot.course_code}</div>
                          {slot.faculty_name && <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>{slot.faculty_name}</div>}
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
      <button onClick={downloadPdf} style={{
        padding: '0.5rem 1.25rem', background: '#fff', color: '#4f46e5',
        border: '2px solid #4f46e5', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem'
      }}>
        ⬇ Download PDF
      </button>
    </>
  );
}

function Timetable() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('view'); // 'view' | 'edit'
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
        const [clData, semData] = await Promise.all([classAPI.getAll(), semesterAPI.getAll()]);
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
      if (!selectedPeriod && period) { setSelectedPeriod(period); return; }
      if (!period) return;

      const [timetable, courseData] = await Promise.all([
        timetableAPI.get(selectedClass, selectedSemester),
        timetableAPI.getAvailableCourses(selectedClass, { semester_id: selectedSemester, period_number: period })
      ]);

      setAvailableCourses(courseData.courses || []);
      setTimetableRows(timetable);

      const newSlots = {};
      timetable.forEach(t => {
        const key = `${t.day_of_week}-${t.period_no}`;
        newSlots[key] = t.department_course_id ? `dc:${t.department_course_id}` : (t.course_assignment_id || '');
      });
      setSlots(newSlots);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSlotChange = (day, period, value) =>
    setSlots({ ...slots, [`${day}-${period}`]: value });

  const handleSave = async () => {
    const payloadSlots = [];
    Object.keys(slots).forEach(key => {
      const [day_of_week, period_no] = key.split('-');
      const val = slots[key];
      if (!val) return;
      const slot = {
        day_of_week, period_no: parseInt(period_no, 10),
        start_time: `${8 + parseInt(period_no, 10)}:00:00`,
        end_time: `${9 + parseInt(period_no, 10)}:00:00`
      };
      if (String(val).startsWith('dc:')) slot.department_course_id = val.replace('dc:', '');
      else slot.course_assignment_id = val;
      payloadSlots.push(slot);
    });
    try {
      await timetableAPI.upload({ class_id: selectedClass, semester_id: selectedSemester, slots: payloadSlots });
      alert('Timetable saved successfully');
      fetchClassData();
      setTab('view');
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
  const hasData = selectedClass && selectedSemester && (selectedPeriod || periodOptions.length > 0);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate('/dashboard?tab=oversight')}>← Back</button>
      <h2>Manage Class Timetable</h2>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e5e7eb' }}>
        {['view', 'edit'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '0.5rem 1.25rem', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: tab === t ? 700 : 400, fontSize: '0.95rem',
            borderBottom: tab === t ? '2px solid #4f46e5' : '2px solid transparent',
            color: tab === t ? '#4f46e5' : '#6b7280', marginBottom: '-2px'
          }}>
            {t === 'view' ? '👁 View / Download' : '✏️ Edit Timetable'}
          </button>
        ))}
      </div>

      {/* Class / Semester / Period selectors (shared) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedPeriod(''); setClassInfo(null); }}
          style={{ padding: '0.5rem', minWidth: '220px', borderRadius: 6, border: '1px solid #d1d5db' }}>
          <option value="">Select class…</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.section} (Year {c.year})</option>)}
        </select>

        <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)}
          style={{ padding: '0.5rem', minWidth: '200px', borderRadius: 6, border: '1px solid #d1d5db' }}>
          <option value="">Academic semester…</option>
          {semesters.map(s => <option key={s.id} value={s.id}>{s.name} {s.is_active ? '(Active)' : ''}</option>)}
        </select>

        <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}
          style={{ padding: '0.5rem', minWidth: '160px', borderRadius: 6, border: '1px solid #d1d5db' }}
          disabled={!periodOptions.length}>
          <option value="">{periodLabel}…</option>
          {periodOptions.map(p => <option key={p.period_number} value={p.period_number}>{p.label}</option>)}
        </select>
      </div>

      {hasData && classInfo && (
        <div style={{ background: '#eef2ff', padding: '0.65rem 1rem', borderRadius: 8, marginBottom: '1rem', fontSize: '.9rem', color: '#4338ca' }}>
          Class Year {classInfo.year} — <strong>{periodLabel} {selectedPeriod}</strong>
        </div>
      )}

      {/* VIEW TAB */}
      {tab === 'view' && hasData && timetableRows.length > 0 && (
        <TimetableReadOnly timetableRows={timetableRows} downloadPdf={handleDownloadPdf} />
      )}
      {tab === 'view' && hasData && timetableRows.length === 0 && (
        <p style={{ color: '#9ca3af' }}>No timetable uploaded yet for this selection.</p>
      )}

      {/* EDIT TAB */}
      {tab === 'edit' && hasData && (
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
                  <td style={{ fontWeight: 'bold', padding: '0.4rem 0.75rem' }}>{day}</td>
                  {PERIODS.map(period => (
                    <td key={`${day}-${period}`} style={{ padding: '0.3rem' }}>
                      <select value={slots[`${day}-${period}`] || ''} onChange={e => handleSlotChange(day, period, e.target.value)}
                        style={{ width: '100%', fontSize: '.75rem', borderRadius: 4, border: '1px solid #d1d5db', padding: '0.2rem' }}>
                        <option value="">— Off —</option>
                        {availableCourses.map(c => (
                          <option key={c.department_course_id} value={`dc:${c.department_course_id}`}>
                            {c.code} — {c.course_name}{c.faculty_name ? ` (${c.faculty_name})` : ''}
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
            <button onClick={handleSave} style={{
              padding: '0.6rem 1.5rem', background: '#4f46e5', color: '#fff',
              border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600
            }}>Save Timetable</button>
            <button onClick={handleDownloadPdf} style={{
              padding: '0.6rem 1.5rem', background: '#fff', color: '#4f46e5',
              border: '2px solid #4f46e5', borderRadius: 8, cursor: 'pointer', fontWeight: 600
            }}>Download PDF</button>
          </div>
        </>
      )}
    </div>
  );
}

export default Timetable;
