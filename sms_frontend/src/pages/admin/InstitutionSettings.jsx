import { useState, useEffect } from 'react';
import { institutionAPI } from '../../services/api';
import { Link } from 'react-router-dom';

function InstitutionSettings() {
  const [institution, setInstitution] = useState({ name: '', location: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInstitution();
  }, []);

  const fetchInstitution = async () => {
    try {
      const data = await institutionAPI.getMine();
      setInstitution({ name: data.name || '', location: data.location || '' });
    } catch (err) {
      setError('Failed to load institution details');
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
      const updated = await institutionAPI.updateMine(institution);
      setInstitution({ name: updated.name || '', location: updated.location || '' });
      setMessage('Institution details updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dept-wizard" style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem' }}>
      <button 
        style={{ 
          background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', 
          padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', 
          fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', 
          display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' 
        }} 
        onClick={() => window.history.back()}
      >
        ← Back
      </button>

      <div className="dept-wizard__header">
        <h1>🏫 Institution Settings</h1>
        <div className="dept-wizard__header-actions">
          <Link to="/dashboard?tab=admin_inst_dept" className="dept-btn dept-btn--secondary">← Dashboard</Link>
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
                <label>Institution Name *</label>
                <input
                  type="text"
                  value={institution.name}
                  onChange={e => setInstitution({ ...institution, name: e.target.value })}
                  placeholder="e.g. ABC College of Engineering"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  required
                />
              </div>

              <div className="dept-field">
                <label>Location *</label>
                <input
                  type="text"
                  value={institution.location}
                  onChange={e => setInstitution({ ...institution, location: e.target.value })}
                  placeholder="e.g. New York, USA"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  required
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

export default InstitutionSettings;
