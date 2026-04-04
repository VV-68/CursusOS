import { Link } from 'react-router-dom';

function Dashboard() {
  return (
    <div className="dashboard">
      <h1>Welcome to Student Management System</h1>
      <p className="dashboard-subtitle">Manage your students efficiently</p>
      <div className="dashboard-actions">
        <Link to="/students" className="btn btn-primary">
          View Students
        </Link>
        <Link to="/add-student" className="btn btn-secondary">
          Add Student
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;
