import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function Navbar({ isAuthenticated }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const hasToken = !!token;
  
  let role = '';
  if (hasToken) {
    try {
      role = jwtDecode(token).role;
    } catch(e) {}
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="navbar" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 2rem', background: '#333', color: '#fff' }}>
      <div className="navbar-brand">
        <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold' }}>SMS Hub</Link>
      </div>
      <div className="navbar-links" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {hasToken ? (
          <>
            <Link to="/dashboard" style={{ color: '#fff' }}>Dashboard</Link>
            <Link to="/timetable" style={{ color: '#fff' }}>Timetable</Link>
            
            {['student', 'faculty', 'advisor', 'hod'].includes(role) && (
              <Link to="/leave" style={{ color: '#fff' }}>Leaves</Link>
            )}
            
            <Link to="/change-password" style={{ color: '#fff' }}>Settings</Link>
            
            <button type="button" className="btn-logout" onClick={handleLogout} style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: '#fff' }}>Login</Link>
            <Link to="/register" style={{ color: '#fff' }}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
