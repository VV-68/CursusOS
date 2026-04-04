import { Link, useNavigate } from 'react-router-dom';

const AUTH_LOGOUT_URL = 'http://localhost:3000/auth/logout';

function Navbar({ isAuthenticated }) {
  const navigate = useNavigate();
  const hasToken = !!localStorage.getItem('token');

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch(AUTH_LOGOUT_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (e) {
        // ignore
      }
      localStorage.removeItem('token');
    }
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">SMS</Link>
      </div>
      <div className="navbar-links">
        {hasToken ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/students">Students</Link>
            <Link to="/add-student">Add Student</Link>
            <button type="button" className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
