import { useState, useEffect } from 'react';
import { courseAssignmentAPI, attendanceAPI } from '../../services/api';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

function MarkAttendance() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState('1');
  const [students, setStudents] = useState([]);

  // Validation state
  const [slotStatus, setSlotStatus] = useState(null); // null | { allowed, reason }
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);

  const token = localStorage.getItem('token');
  const userRole = token ? jwtDecode(token).role : null;

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    setSlotStatus(null);
    setStudents([]);
    if (selectedAssignment && date && period) {
      validateAndFetch();
    }
  }, [selectedAssignment, date, period]);

  const fetchAssignments = async () => {
    try {
      const data = await courseAssignmentAPI.getMine();
      setAssignments(data);
    } catch (err) {
      alert(err.message);
    }
  };

  const validateAndFetch = async () => {
    try {
      const qs = new URLSearchParams({
        course_assignment_id: selectedAssignment, date, period_no: period
      }).toString();

      const validation = await attendanceAPI.validate(qs);
      setSlotStatus(validation);

      if (validation.allowed) {
        fetchSheet();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchSheet = async () => {
    try {
      const qs = new URLSearchParams({
        course_assignment_id: selectedAssignment, date, period_no: period
      }).toString();
      const sheet = await attendanceAPI.getSheet(qs);

      const initialized = sheet.map(s => ({
        ...s,
        status: s.status || 'Present'
      }));
      setStudents(initialized);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStatusChange = (student_id, newStatus) => {
    setStudents(prev => prev.map(s => s.student_id === student_id ? { ...s, status: newStatus } : s));
  };

  const handleSave = async () => {
    const records = students.map(s => ({ student_id: s.student_id, status: s.status }));
    try {
      await attendanceAPI.mark({
        course_assignment_id: selectedAssignment, date, period_no: period, records
      });
      alert('Attendance saved successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRequestOverride = async () => {
    if (!overrideReason.trim()) {
      alert('Please provide a reason for the override request.');
      return;
    }
    setOverrideLoading(true);
    try {
      await attendanceAPI.requestOverride({
        course_assignment_id: selectedAssignment,
        date,
        period_no: parseInt(period, 10),
        reason: overrideReason
      });
      alert('Override request sent to advisor. You will be able to mark attendance once approved.');
      setShowOverrideModal(false);
      setOverrideReason('');
      // Re-validate to show pending status
      validateAndFetch();
    } catch (err) {
      alert(err.message);
    } finally {
      setOverrideLoading(false);
    }
  };

  // Derive day name from date for display
  const getDayName = (dateStr) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date(dateStr + 'T00:00:00').getDay()];
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate('/dashboard?tab=teaching')}>← Back</button>
      <h2>Mark Attendance</h2>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={selectedAssignment} onChange={e => setSelectedAssignment(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}>
          <option value="">Select Course Assignment...</option>
          {assignments.map(a => (
            <option key={a.course_assignment_id} value={a.course_assignment_id}>
              {a.course_name} ({a.course_code}) - {a.class_name}
            </option>
          ))}
        </select>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} />
        <select value={period} onChange={e => setPeriod(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}>
          {[1,2,3,4,5,6,7,8].map(p => (
            <option key={p} value={p}>Period {p}</option>
          ))}
        </select>

        {selectedAssignment && date && (
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {getDayName(date)}
          </span>
        )}
      </div>

      {/* Status Messages */}
      {slotStatus && !slotStatus.allowed && slotStatus.reason === 'not_in_timetable' && (
        <div style={{
          background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px',
          padding: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <strong style={{ color: '#92400e' }}>⚠ Not in your timetable</strong>
            <p style={{ margin: '0.25rem 0 0', color: '#78350f', fontSize: '0.9rem' }}>
              Period {period} on {getDayName(date)} is not scheduled for this course in the timetable.
              You need advisor permission to mark attendance for this slot.
            </p>
          </div>
          {userRole === 'faculty' && (
            <button onClick={() => setShowOverrideModal(true)}
              style={{
                padding: '0.5rem 1rem', background: '#f59e0b', color: '#fff',
                border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600',
                whiteSpace: 'nowrap', marginLeft: '1rem'
              }}>
              Request Permission
            </button>
          )}
        </div>
      )}

      {slotStatus && !slotStatus.allowed && slotStatus.reason === 'override_pending' && (
        <div style={{
          background: '#e0f2fe', border: '1px solid #0ea5e9', borderRadius: '8px',
          padding: '1rem', marginBottom: '1.5rem'
        }}>
          <strong style={{ color: '#0369a1' }}>⏳ Waiting for Advisor Approval</strong>
          <p style={{ margin: '0.25rem 0 0', color: '#0c4a6e', fontSize: '0.9rem' }}>
            Your override request for this slot is pending advisor review. You'll be able to mark attendance once approved.
          </p>
        </div>
      )}

      {slotStatus && slotStatus.allowed && slotStatus.reason === 'override_approved' && (
        <div style={{
          background: '#d1fae5', border: '1px solid #10b981', borderRadius: '8px',
          padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#065f46'
        }}>
          ✅ Override approved — marking attendance via special permission.
        </div>
      )}

      {/* Student Table */}
      {students.length > 0 && (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left',
            background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            borderRadius: '8px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #dee2e6' }}>Roll No</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #dee2e6' }}>Name</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #dee2e6' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.student_id} style={{ borderBottom: '1px solid #ccc' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>{s.roll_no}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{s.student_name}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <select value={s.status} onChange={e => handleStatusChange(s.student_id, e.target.value)}
                      style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}>
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Excused">Excused</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={handleSave}
            style={{
              marginTop: '1.5rem', padding: '0.75rem 1.5rem', background: '#0d6efd', color: 'white',
              border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem'
            }}>
            Save Attendance
          </button>
        </>
      )}

      {/* Override Request Modal */}
      {showOverrideModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#fff', borderRadius: '12px', padding: '2rem',
            width: '90%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ marginTop: 0 }}>Request Attendance Override</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
              You are requesting permission to mark attendance for <strong>Period {period}</strong> on <strong>{getDayName(date)}, {date}</strong>,
              which is not in your scheduled timetable.
            </p>
            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Reason *</label>
            <textarea
              value={overrideReason}
              onChange={e => setOverrideReason(e.target.value)}
              placeholder="e.g., Extra class taken as makeup for holiday..."
              rows={3}
              style={{
                width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc',
                marginTop: '0.25rem', marginBottom: '1rem', resize: 'vertical', fontFamily: 'inherit'
              }}
            />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowOverrideModal(false); setOverrideReason(''); }}
                style={{
                  padding: '0.5rem 1rem', background: '#e2e8f0', color: '#334155',
                  border: 'none', borderRadius: '6px', cursor: 'pointer'
                }}>
                Cancel
              </button>
              <button onClick={handleRequestOverride} disabled={overrideLoading}
                style={{
                  padding: '0.5rem 1rem', background: '#f59e0b', color: '#fff',
                  border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600'
                }}>
                {overrideLoading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarkAttendance;
