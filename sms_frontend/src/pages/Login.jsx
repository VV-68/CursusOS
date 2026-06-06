import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { login } from '../services/api';
import Logo from '../components/Logo';
import DarkModeToggle from '../components/DarkModeToggle';
import { Eye, EyeOff } from 'lucide-react';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username.trim() || !password) {
      setError('Username and password are required');
      setLoading(false);
      return;
    }

    try {
      const data = await login({ username: username.trim(), password });
      if (data.token) {
        localStorage.setItem('token', data.token);

        // Check if user must change password first
        if (data.must_change_password) {
          navigate('/change-password', { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 50 }}>
        <DarkModeToggle />
      </div>
      <Logo size={100} />
      <div className="auth-card">
        <h1>Login</h1>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-msg">{error}</div>}
          <div className="form-group">
            <label htmlFor="username">Username or Email</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username or email"
              autoComplete="username"
              disabled={loading}
            />
          </div>
          <div className="form-group" style={{ position: 'relative' }}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              disabled={loading}
              style={{ paddingRight: '2.5rem' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '2.3rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--dm-input-ph)', // Uses placeholder color variable
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <p className="auth-link">
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
