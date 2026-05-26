import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { timetableAPI, classAPI, semesterAPI } from '../../services/api';
import { downloadTimetablePdf } from '../../utils/timetablePdf';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function ClassTimetableView() {
  const { classId } = useParams();
  const [classInfo, setClassInfo] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [classes, semData] = await Promise.all([
          classAPI.getAll(),
          semesterAPI.getAll()
        ]);
        const cls = classes.find(c => c.id === classId);
        setClassInfo(cls);
        setSemesters(semData);
        const active = semData.find(s => s.is_active);
        if (active) setSelectedSemester(active.id);
      } catch (err) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [classId]);

  useEffect(() => {
    if (!selectedSemester || !classId) return;
    (async () => {
      try {
        const data = await timetableAPI.get(classId, selectedSemester);
        setTimetable(data);
      } catch (err) {
        alert(err.message);
      }
    })();
  }, [classId, selectedSemester]);

  const getSlot = (day, period) =>
    timetable.find(t => t.day_of_week === day && t.period_no === period);

  const handlePdf = () => {
    const sem = semesters.find(s => s.id === selectedSemester);
    downloadTimetablePdf({
      title: `Timetable — ${classInfo?.name || ''} ${classInfo?.section || ''}`,
      subtitle: `${sem?.name || ''} | Year ${classInfo?.year}`,
      timetable
    });
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading…</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>📅 Class Timetable</h2>
          {classInfo && (
            <p style={{ color: '#64748b', margin: '0.25rem 0 0' }}>
              {classInfo.name} — Section {classInfo.section} (Year {classInfo.year})
            </p>
          )}
        </div>
        <Link to="/hod/classes" style={{ textDecoration: 'none', color: '#007bff' }}>← Back to Classes</Link>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
        {selectedSemester && (
          <div style={{ padding: '0.5rem 1rem', background: '#f3f4f6', borderRadius: 6, border: '1px solid #d1d5db', color: '#374151', fontSize: '0.95rem' }}>
            <strong>Term:</strong> {semesters.find(s => s.id === selectedSemester)?.name} {semesters.find(s => s.id === selectedSemester)?.is_active ? '(Active)' : ''}
          </div>
        )}
        <button
          type="button"
          onClick={handlePdf}
          disabled={!timetable.length}
          style={{
            padding: '0.5rem 1.25rem', background: '#007bff', color: '#fff',
            border: 'none', borderRadius: '8px', cursor: 'pointer'
          }}
        >
          Download PDF
        </button>
      </div>

      {selectedSemester && (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={{ padding: '0.75rem' }}>Day / Period</th>
              {PERIODS.map(p => <th key={p} style={{ padding: '0.75rem' }}>P{p}</th>)}
            </tr>
          </thead>
          <tbody>
            {DAYS.map(day => (
              <tr key={day} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ fontWeight: 600, padding: '0.75rem' }}>{day}</td>
                {PERIODS.map(period => {
                  const slot = getSlot(day, period);
                  return (
                    <td key={`${day}-${period}`} style={{ padding: '0.5rem', border: '1px solid #e2e8f0' }}>
                      {slot ? (
                        <>
                          <div style={{ fontWeight: 600, fontSize: '.85rem' }}>
                            {slot.course_name || slot.course_code}
                          </div>
                          {slot.faculty_name && (
                            <div style={{ fontSize: '.75rem', color: '#64748b' }}>{slot.faculty_name}</div>
                          )}
                        </>
                      ) : (
                        <span style={{ color: '#cbd5e1' }}>—</span>
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
