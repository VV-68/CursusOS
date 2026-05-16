import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useState, useEffect } from 'react';
import { departmentCreationAPI, departmentAPI, logout } from '../services/api';

function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  let role = '';
  if (token) {
    try {
      role = jwtDecode(token).role;
    } catch(e) {}
  }

  const [dept, setDept] = useState(null);

  useEffect(() => {
    if (role === 'hod' && token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.dept_id) {
          departmentCreationAPI.getDetails(decoded.dept_id)
            .then(data => setDept(data))
            .catch(() => {});
        }
      } catch(e) {}
    }
  }, [role, token]);

  const handleApproveHOD = async () => {
    try {
      await departmentAPI.approveHOD(dept.id);
      alert('HOD change approved successfully. You will be logged out to reflect the role changes.');
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRejectHOD = async () => {
    try {
      await departmentAPI.rejectHOD(dept.id);
      alert('HOD change rejected');
      window.location.reload();
    } catch (err) {
      alert(err.message);
    }
  };

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
            <Link to="/hod/courses" className="btn btn-primary">Manage Dept Courses</Link>
            <Link to="/approvals/leave" className="btn btn-secondary">Pending Leaves</Link>
          </>
        )}

        {role === 'hod' && dept && dept.pending_hod_id && (
          <div style={{ width: '100%', background: '#fff3cd', padding: '1rem', borderRadius: '4px', border: '1px solid #ffeeba', marginTop: '1rem' }}>
            <h3 style={{ marginTop: 0, color: '#856404' }}>Pending HOD Transfer</h3>
            <p style={{ color: '#856404' }}>Admin has requested to transfer HOD role to <strong>{dept.pending_hod_name}</strong>.</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button onClick={handleApproveHOD} style={{ padding: '0.5rem 1rem', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Approve</button>
              <button onClick={handleRejectHOD} style={{ padding: '0.5rem 1rem', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Reject</button>
            </div>
          </div>
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

        {role !== 'hod' && (
          <Link to="/timetable" className="btn btn-secondary">View Timetable</Link>
        )}
        <Link to="/notices" className="btn btn-secondary">Notice Board</Link>
        
        {['admin', 'hod'].includes(role) && (
          <Link to="/notices/post" className="btn btn-primary">Post Notice</Link>
        )}

        {['student', 'faculty', 'advisor', 'hod'].includes(role) && (
          <Link to="/leave" className="btn btn-secondary">My Leaves</Link>
        )}

      </div>
    </div>
  );
}

export default Dashboard;
