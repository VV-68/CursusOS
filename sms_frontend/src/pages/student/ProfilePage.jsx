import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileAPI } from '../../services/api';
import '../admin/CreateDepartment.css'; // Add the CSS import

const REQUIRED_FIELDS = ['dob', 'gender', 'guardian_name', 'guardian_phone', 'address'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const GENDERS = ['Male', 'Female', 'Other'];

function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState('personal');
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const data = await profileAPI.getMyProfile();
      setProfile(data);
      setForm(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setError(''); setSuccess('');
    try {
      const updated = await profileAPI.updateMyProfile(form);
      setProfile(updated);
      setForm(updated);
      setEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.message); }
  };

  const handleCancel = () => {
    setForm(profile);
    setEditing(false);
    setError('');
  };

  const maskValue = (val, show = 4) => {
    if (!val) return '—';
    if (val.length <= show) return val;
    return '•'.repeat(val.length - show) + val.slice(-show);
  };

  const missingFields = profile ? REQUIRED_FIELDS.filter((f) => !profile[f]) : [];

  const renderField = (label, key, opts = {}) => {
    const { type = 'text', options, rows, readOnly } = opts;
    const val = form[key] || '';

    if (!editing || readOnly) {
      let displayVal = profile?.[key] || '—';
      if (opts.masked && profile?.[key]) displayVal = maskValue(profile[key]);
      if (key === 'dob' && profile?.[key]) displayVal = new Date(profile[key]).toLocaleDateString('en-IN');
      return (
        <div className="dept-field">
          <label style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
          <div style={{ color: '#1e293b', fontSize: '0.95rem', padding: '0.5rem 0', fontWeight: 500, fontFamily: opts.masked ? 'monospace' : 'inherit' }}>
            {displayVal}
          </div>
        </div>
      );
    }

    if (options) {
      return (
        <div className="dept-field">
          <label>{label}</label>
          <select value={val} onChange={(e) => setForm({ ...form, [key]: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <option value="">Select...</option>
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      );
    }

    if (rows) {
      return (
        <div className="dept-field">
          <label>{label}</label>
          <textarea value={val} onChange={(e) => setForm({ ...form, [key]: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }} rows={4} />
        </div>
      );
    }

    return (
      <div className="dept-field">
        <label>{label}</label>
        <input
          type={type}
          value={type === 'date' && val ? val.substring(0, 10) : val}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
        />
      </div>
    );
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading profile...</div>;

  return (
    <div className="dept-wizard" style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate('/dashboard?tab=academics')}>← Back</button>
      
      <div className="dept-wizard__header">
        <h1 style={{ color: '#007bff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          👤 My Profile
        </h1>
        <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '0.95rem' }}>
          {profile?.full_name} — {profile?.class_name} (Roll: {profile?.roll_no})
          {profile?.current_semester_name ? ` • ${profile.current_semester_name} (Year ${profile.current_year})` : ''}
        </p>
      </div>

      {!profile?.profile_completed && missingFields.length > 0 && (
        <div className="dept-alert dept-alert--error" style={{ marginBottom: '1.5rem' }}>
          <span className="dept-alert__icon">⚠️</span>
          <span>Profile incomplete — missing: {missingFields.join(', ')}</span>
        </div>
      )}

      {profile?.profile_completed && (
        <div className="dept-alert dept-alert--success" style={{ marginBottom: '1.5rem', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
          <span className="dept-alert__icon">✅</span>
          <span>Profile is complete</span>
        </div>
      )}

      {error && <div className="dept-alert dept-alert--error" style={{ marginBottom: '1.5rem' }}>{error}</div>}
      {success && <div className="dept-alert dept-alert--success" style={{ marginBottom: '1.5rem', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>{success}</div>}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: '#f1f5f9', padding: '0.35rem', borderRadius: '10px', width: 'fit-content' }}>
        <button 
          style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600', background: tab === 'personal' ? '#fff' : 'transparent', color: tab === 'personal' ? '#007bff' : '#64748b', boxShadow: tab === 'personal' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s ease' }} 
          onClick={() => setTab('personal')}
        >
          Personal Details
        </button>
        <button 
          style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600', background: tab === 'bank' ? '#fff' : 'transparent', color: tab === 'bank' ? '#007bff' : '#64748b', boxShadow: tab === 'bank' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s ease' }} 
          onClick={() => setTab('bank')}
        >
          Bank Details
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {!editing ? (
          <button className="dept-btn dept-btn--primary" onClick={() => setEditing(true)}>✏️ Edit Profile</button>
        ) : (
          <>
            <button className="dept-btn dept-btn--success" onClick={handleSave}>💾 Save</button>
            <button className="dept-btn dept-btn--secondary" onClick={handleCancel}>Cancel</button>
          </>
        )}
      </div>

      <div className="dept-card">
        {tab === 'personal' && (
          <>
            <div className="dept-card__title" style={{ color: '#007bff', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>Basic Information</div>
            <div className="dept-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', marginBottom: '2rem' }}>
              {renderField('Full Name', 'full_name', { readOnly: true })}
              {renderField('Email', 'email', { readOnly: true })}
              {renderField('Phone', 'phone', { readOnly: true })}
              {renderField('Date of Birth', 'dob', { type: 'date' })}
              {renderField('Gender', 'gender', { options: GENDERS })}
              {renderField('Blood Group', 'blood_group', { options: BLOOD_GROUPS })}
            </div>

            <div className="dept-card__title" style={{ color: '#007bff', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>Address</div>
            <div style={{ marginBottom: '2rem' }}>
              {renderField('Address', 'address', { rows: true })}
            </div>

            <div className="dept-card__title" style={{ color: '#007bff', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>Guardian Details</div>
            <div className="dept-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              {renderField('Guardian Name', 'guardian_name')}
              {renderField('Guardian Phone', 'guardian_phone')}
            </div>
          </>
        )}

        {tab === 'bank' && (
          <>
            <div className="dept-card__title" style={{ color: '#007bff', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>Bank Account</div>
            <div className="dept-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              {renderField('Account Number', 'bank_account_no', { masked: true })}
              {renderField('IFSC Code', 'bank_ifsc', { masked: true })}
              {renderField('Bank Name', 'bank_name')}
              {renderField('Branch Name', 'bank_branch')}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
