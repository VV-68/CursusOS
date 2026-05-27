import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getMe, logout } from '../services/api';
import Logo from './Logo';
import NotificationBell from './NotificationBell';
import DarkModeToggle from './DarkModeToggle';

const ROLE_COLORS = {
  admin: '#6f42c1',
  hod: '#0d6efd',
  advisor: '#20c997',
  faculty: '#198754',
  student: '#fd7e14',
};

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const hasToken = !!token;

  const [userInfo, setUserInfo] = useState(null);

  let role = '';
  if (hasToken) {
    try {
      role = jwtDecode(token).role;
    } catch (e) {}
  }

  useEffect(() => {
    if (hasToken) {
      getMe()
        .then(setUserInfo)
        .catch(() => {}); // Silent fail — token might be expired
    }
  }, [hasToken]);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      try {
        await logout();
      } catch (e) {}
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  const displayName = userInfo?.full_name || role || '';
  const roleColor = ROLE_COLORS[role] || '#6c757d';

  const linkStyle = { color: '#ecf0f1', textDecoration: 'none', fontSize: '0.9rem' };

  return (
    <nav className="navbar" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 2rem', background: 'var(--nav-bg)', color: '#fff', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <div className="navbar-brand">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Logo size={36} showText={true} textColor="#ffffff" />
        </Link>
      </div>
      <div className="navbar-links" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {hasToken ? (
          <>
            <Link to="/dashboard" style={linkStyle}>Dashboard</Link>
            <Link to="/change-password" style={linkStyle}>Settings</Link>
            <DarkModeToggle />
            <NotificationBell />

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem', padding: '0.2rem 0.6rem', background: 'rgba(255,255,255,0.1)', borderRadius: '16px' }}>
              <span style={{ fontSize: '0.85rem', color: '#ecf0f1' }}>{displayName}</span>
              <span style={{
                background: roleColor,
                color: '#fff',
                padding: '0.1rem 0.5rem',
                borderRadius: '10px',
                fontSize: '0.7rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>{role}</span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              style={{ background: '#e74c3c', color: '#fff', border: 'none', padding: '0.35rem 0.9rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: '#ecf0f1', textDecoration: 'none' }}>Login</Link>
            <Link to="/register" style={{ color: '#ecf0f1', textDecoration: 'none' }}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
