import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attendanceAPI, getStudentById } from '../../services/api';
import { jwtDecode } from 'jwt-decode';
import './DailyAttendance.css';

const STATUS_COLORS = {
  present: { bg: '#4ade80', text: '#064e3b', label: 'Present' },
  absent: { bg: '#f87171', text: '#7f1d1d', label: 'Absent' },
  leave: { bg: '#facc15', text: '#713f12', label: 'Leave' },
  'n/a': { bg: 'var(--na-bg, #cbd5e1)', text: 'var(--na-text, #0f172a)', label: 'N/A' }
};

export default function DailyAttendance() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState('Student');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [records, setRecords] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Month options (1-12)
  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  // Year options (e.g., from 2023 to current year + 1)
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  useEffect(() => {
    fetchStudentInfo();
  }, [studentId]);

  useEffect(() => {
    fetchAttendance();
    // eslint-disable-next-line
  }, [studentId, month, year]);

  const fetchStudentInfo = async () => {
    try {
      const decoded = jwtDecode(localStorage.getItem('token'));
      const targetId = studentId || decoded.id;
      if (targetId) {
        const student = await getStudentById(targetId);
        setStudentName(student.full_name || student.name || 'Student');
      }
    } catch (err) {
      console.error('Failed to load student info:', err);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const decoded = jwtDecode(localStorage.getItem('token'));
      const targetId = studentId || decoded.id;
      
      const qs = new URLSearchParams({ month, year }).toString();
      const data = await attendanceAPI.getDaily(targetId, qs);
      if (Array.isArray(data)) {
        setRecords(data);
        setLeaves([]);
      } else {
        setRecords(data.attendance || []);
        setLeaves(data.leaves || []);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load daily attendance');
    } finally {
      setLoading(false);
    }
  };

  // Group records by day
  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyGrid = {};

  for (let d = 1; d <= daysInMonth; d++) {
    dailyGrid[d] = {};
  }

  records.forEach(r => {
    const d = new Date(r.date).getDate();
    if (dailyGrid[d]) {
      dailyGrid[d][r.period_no] = r;
    }
  });

  const periods = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="daily-attendance-container">
      <div className="daily-attendance-header">
        <button className="daily-back-btn" onClick={() => navigate(-1)}>← Back</button>
        <h2 className="daily-title">View Attendance of {studentName.toUpperCase()}</h2>
      </div>

      <div className="daily-filters">
        <div className="daily-filter-group">
          <select value={month} onChange={e => setMonth(Number(e.target.value))}>
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="daily-legend">
        {Object.entries(STATUS_COLORS).map(([status, config]) => (
          <div key={status} className="legend-item" style={{ background: config.bg, color: config.text }}>
            {config.label}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="daily-loading">Loading...</div>
      ) : (
        <div className="daily-table-wrapper">
          <table className="daily-table">
            <thead>
              <tr>
                <th>Date</th>
                {periods.map(p => <th key={p}>Period {p}</th>)}
              </tr>
            </thead>
            <tbody>
              {Object.keys(dailyGrid).map(day => {
                const hasAttendanceLeave = Object.values(dailyGrid[day]).some(
                  record => record && record.status && record.status.toLowerCase() === 'leave'
                );

                const currentDayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const hasRequestedLeave = leaves.some(leave => {
                  if (leave.status !== 'approved') return false;
                  const from = new Date(leave.from_date).toISOString().split('T')[0];
                  const to = new Date(leave.to_date).toISOString().split('T')[0];
                  return currentDayStr >= from && currentDayStr <= to;
                });

                const hasLeave = hasAttendanceLeave || hasRequestedLeave;

                return (
                <tr key={day}>
                  <td className={`daily-date-cell ${hasLeave ? 'date-leave-applied' : ''}`}>
                    {day}<sup>{getOrdinalIndicator(day)}</sup>
                  </td>
                  {periods.map(p => {
                    const record = dailyGrid[day][p];
                    
                    let displayStatus = record ? record.status.toLowerCase() : 'n/a';
                    // If there's an approved leave for today and teacher marked them absent, override to leave
                    if (record && displayStatus === 'absent' && hasRequestedLeave) {
                      displayStatus = 'leave';
                    }

                    const statusConfig = STATUS_COLORS[displayStatus] || STATUS_COLORS['n/a'];

                    return (
                      <td 
                        key={p} 
                        className="daily-period-cell"
                        style={displayStatus !== 'n/a' ? { background: statusConfig.bg, color: statusConfig.text } : {}}
                      >
                        {record ? (
                          <div className="daily-cell-content">
                            <span className="course-code">{record.course_code}</span>
                            <span className="course-name">{record.course_name}</span>
                          </div>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function getOrdinalIndicator(d) {
  const n = parseInt(d);
  if (n > 3 && n < 21) return 'th';
  switch (n % 10) {
    case 1:  return "st";
    case 2:  return "nd";
    case 3:  return "rd";
    default: return "th";
  }
}
