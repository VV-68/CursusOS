import { useState } from 'react';
import { changePassword } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check if user was forced here
  const token = localStorage.getItem('token');
  let isForced = false;
  if (token) {
    try {
      isForced = jwtDecode(token).must_change_password;
    } catch (e) {}
  }

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters long';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter';
    if (!/[0-9]/.test(pwd)) return 'Password must contain at least one number';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    const validationError = validatePassword(newPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await changePassword({ current_password: currentPassword, new_password: newPassword });
      setSuccess('Password changed successfully!');

      if (isForced) {
        // Clear old token and redirect to login to get a fresh token without must_change_password
        setTimeout(() => {
          localStorage.removeItem('token');
          navigate('/login', { replace: true });
        }, 1500);
      } else {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.6rem 0.8rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '0.95rem',
    boxSizing: 'border-box',
  };

  const toggleBtnStyle = {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#666',
    fontSize: '0.85rem',
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '440px', margin: '0 auto' }}>
      <h2>{isForced ? '⚠️ You must change your password' : 'Change Password'}</h2>
      {isForced && (
        <p style={{ color: '#856404', background: '#fff3cd', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>
          Your account requires a password change before you can continue.
        </p>
      )}

      {error && <div style={{ color: '#721c24', background: '#f8d7da', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}
      {success && <div style={{ color: '#155724', background: '#d4edda', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>{success}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '500' }}>Current Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showCurrent ? 'text' : 'password'}
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="form-control"
              disabled={loading}
              required
            />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} style={toggleBtnStyle}>
              {showCurrent ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '500' }}>New Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showNew ? 'text' : 'password'}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="form-control"
              disabled={loading}
              required
            />
            <button type="button" onClick={() => setShowNew(!showNew)} style={toggleBtnStyle}>
              {showNew ? 'Hide' : 'Show'}
            </button>
          </div>
          <small style={{ color: '#666', fontSize: '0.8rem' }}>Min 8 characters, one uppercase, one number</small>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '500' }}>Confirm New Password</label>
          <input
            type="password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="form-control"
            disabled={loading}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '0.7rem',
            background: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
          }}
        >
          {loading ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}

export default ChangePassword;
