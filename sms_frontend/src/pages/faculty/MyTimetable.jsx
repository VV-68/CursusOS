import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { courseAssignmentAPI, timetableAPI } from '../../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function MyTimetable() {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [debug, setDebug] = useState('');

  useEffect(() => {
    buildSchedule();
  }, []);

  const buildSchedule = async () => {
    setLoading(true);
    try {
      // 1. Get faculty's course assignments
      const assignments = await courseAssignmentAPI.getMine();
      if (!assignments || assignments.length === 0) {
        setDebug('You have no course assignments for the active semester.');
        setLoading(false);
        return;
      }

      // Build lookup: course_code → assignment info, and class_id set
      const codeToAssignment = {};
      const classIdSet = new Set();
      assignments.forEach(a => {
        if (a.course_code) codeToAssignment[a.course_code] = a;
        if (a.class_id) classIdSet.add(a.class_id);
        // Also key by course_assignment_id for direct matches
        if (a.course_assignment_id) codeToAssignment[`ca:${a.course_assignment_id}`] = a;
      });

      if (classIdSet.size === 0) {
        setDebug(`Found ${assignments.length} assignment(s) but none have a class_id attached.`);
        setLoading(false);
        return;
      }

      // 2. Fetch timetables for all classes the faculty teaches in
      const allSlots = [];
      await Promise.all(
        [...classIdSet].map(async classId => {
          try {
            const tt = await timetableAPI.get(classId);
            tt.forEach(slot => { slot._classId = classId; });
            allSlots.push(...tt);
          } catch { }
        })
      );

      if (allSlots.length === 0) {
        setDebug(`No timetable uploaded for any of your assigned classes. Contact the advisor.`);
        setLoading(false);
        return;
      }

      // 3. Match slots to this faculty's assignments
      const dayMap = {};
      DAYS.forEach(d => { dayMap[d] = []; });

      let matchCount = 0;
      allSlots.forEach(slot => {
        // Try match by course_assignment_id first
        let assignment = slot.course_assignment_id ? codeToAssignment[`ca:${slot.course_assignment_id}`] : null;
        // Then try match by course_code (from timetable view which resolves via COALESCE)
        if (!assignment && slot.course_code) {
          assignment = codeToAssignment[slot.course_code];
        }

        // Make sure the slot actually belongs to the class the assignment was for!
        if (assignment && assignment.class_id === slot._classId) {
          matchCount++;
          const day = slot.day_of_week;
          if (dayMap[day]) {
            // Check for duplicates
            const exists = dayMap[day].some(s => s.period_no === slot.period_no && s.course_code === assignment.course_code);
            if (!exists) {
                dayMap[day].push({
                  period_no: slot.period_no,
                  course_name: assignment.course_name || slot.course_name,
                  course_code: assignment.course_code || slot.course_code,
                  class_name: `${assignment.class_name}${assignment.section ? '-' + assignment.section : ''}`,
                  faculty_name: slot.faculty_name || '',
                });
            }
          }
        }
      });

      if (matchCount === 0) {
        const assignedCodes = assignments.map(a => `${a.course_name} (${a.course_code})`).join(', ');
        const ttCodes = [...new Set(allSlots.map(s => s.course_code).filter(Boolean))].join(', ');
        setDebug(`Your courses [${assignedCodes}] are not present in the class timetable. The timetable has: [${ttCodes}].`);
      }

      // Sort each day
      DAYS.forEach(d => dayMap[d].sort((a, b) => a.period_no - b.period_no));
      setSchedule(dayMap);
    } catch (err) {
      setDebug(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', color: '#64748b' }}>Loading your timetable…</div>;

  const hasAny = DAYS.some(d => schedule[d]?.length > 0);

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate('/dashboard?tab=general')}>← Back</button>
      <h2>My Teaching Timetable</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
        Shows your assigned courses for each day based on the class timetable.
      </p>

      {debug && (
        <div style={{
          background: '#fffbeb', border: '1px solid #fbbf24', borderRadius: 8,
          padding: '0.75rem 1rem', marginBottom: '1rem', color: '#92400e', fontSize: '0.88rem'
        }}>
          <strong>Note:</strong> {debug}
        </div>
      )}

      {!hasAny && !debug && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
          No timetable slots found for your courses.
        </div>
      )}

      {hasAny && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {DAYS.map(day => (
            <div key={day} style={{
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
              overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <div style={{
                background: '#f1f5f9', padding: '0.6rem 1rem',
                fontWeight: 700, color: '#1e293b', fontSize: '0.95rem',
                borderBottom: '1px solid #e2e8f0'
              }}>
                {day}
              </div>
              {schedule[day]?.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.75rem 1rem' }}>
                  {schedule[day].map((slot, i) => (
                    <div key={i} style={{
                      background: '#e6f2ff', border: '1px solid #b8daff', borderRadius: 8,
                      padding: '0.5rem 0.85rem', minWidth: 140
                    }}>
                      <div style={{ fontSize: '0.72rem', color: '#007bff', fontWeight: 700, marginBottom: '0.1rem' }}>
                        Period {slot.period_no}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1e293b' }}>
                        {slot.course_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {slot.course_code} · {slot.class_name}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '0.75rem 1rem', color: '#cbd5e1', fontSize: '0.85rem' }}>
                  No classes
                </div>
              )}
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

export default MyTimetable;
