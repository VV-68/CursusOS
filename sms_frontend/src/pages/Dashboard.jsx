import { Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function Dashboard() {
  const token = localStorage.getItem('token');
  let role = '';
  if (token) {
    try {
      role = jwtDecode(token).role;
    } catch(e) {}
  }

  return (
    <div className="dashboard" style={{ padding: '2rem' }}>
      <h1>Dashboard - Role: {role.toUpperCase()}</h1>
      <div className="dashboard-actions" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '2rem' }}>
        
        {role === 'admin' && (
          <>
            <Link to="/admin/users" className="btn btn-primary">Manage Users</Link>
            <Link to="/admin/departments" className="btn btn-primary">Manage Departments</Link>
          </>
        )}

        {role === 'hod' && (
          <>
            <Link to="/admin/users/create" className="btn btn-primary">Add Faculty / Advisor</Link>
            <Link to="/admin/users" className="btn btn-primary">View Dept Users</Link>
            <Link to="/hod/classes" className="btn btn-primary">Manage Dept Classes</Link>
            <Link to="/hod/department/edit" className="btn btn-primary">Edit Dept Courses</Link>
            <Link to="/hod/courses" className="btn btn-primary">Manage Dept Courses</Link>
            <Link to="/approvals/leave" className="btn btn-secondary">Pending Leaves</Link>
          </>
        )}

        {role === 'advisor' && (
          <>
            <Link to="/advisor/timetable" className="btn btn-primary">Manage Class Timetable</Link>
            <Link to="/advisor/attendance/low" className="btn btn-secondary">Low Attendance Report</Link>
            <Link to="/approvals/leave" className="btn btn-secondary">Pending Leaves</Link>
          </>
        )}

        {role === 'faculty' && (
          <>
            <Link to="/faculty/attendance/mark" className="btn btn-primary">Mark Attendance</Link>
            <Link to="/faculty/marks/update" className="btn btn-primary">Update Grades</Link>
          </>
        )}

        {role === 'student' && (
          <>
            <Link to="/student/attendance" className="btn btn-primary">My Attendance</Link>
            <Link to="/student/marks" className="btn btn-primary">My Grades</Link>
          </>
        )}

        <Link to="/timetable" className="btn btn-secondary">View Timetable</Link>
        <Link to="/notices" className="btn btn-secondary">Notice Board</Link>
        
        {['admin', 'hod'].includes(role) && (
          <Link to="/admin/notices/create" className="btn btn-primary">Post Notice</Link>
        )}

        {['student', 'faculty', 'advisor', 'hod'].includes(role) && (
          <Link to="/leave" className="btn btn-secondary">My Leaves</Link>
        )}

      </div>
    </div>
  );
}

export default Dashboard;
