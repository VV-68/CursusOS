import { useState, useEffect } from 'react';
import { userAPI, getMe } from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';

function FacultyProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ email: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await getMe();
      setProfile({ email: data.email || '', phone: data.phone || '' });
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const updated = await userAPI.updateProfile(profile);
      setProfile({ email: updated.email || '', phone: updated.phone || '' });
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dept-wizard" style={{ maxWidth: '600px', margin: '0 auto', padding: '1.5rem' }}>
      <button 
        style={{ 
          background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', 
          padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', 
          fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', 
          display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' 
        }} 
        onClick={() => navigate('/dashboard?tab=profile')}
      >
        ← Back
      </button>

      <div className="dept-wizard__header">
        <h1>👤 Edit Profile</h1>
        <div className="dept-wizard__header-actions">
          <Link to="/dashboard?tab=profile" className="dept-btn dept-btn--secondary">← Dashboard</Link>
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#64748b' }}>Loading...</p>
      ) : (
        <div className="dept-card">
          <form onSubmit={handleSubmit}>
            {error && <div className="dept-alert dept-alert--error"><span className="dept-alert__icon">⚠️</span><span>{error}</span></div>}
            {message && <div className="dept-alert dept-alert--success"><span className="dept-alert__icon">✅</span><span>{message}</span></div>}
            
            <div className="dept-form-grid" style={{ gridTemplateColumns: '1fr', gap: '1.5rem' }}>
              <div className="dept-field">
                <label>Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={e => setProfile({ ...profile, email: e.target.value })}
                  placeholder="name@example.com"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div className="dept-field">
                <label>Phone Number</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={e => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+1 234 567 890"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="submit" 
                className="dept-btn dept-btn--primary" 
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default FacultyProfile;
