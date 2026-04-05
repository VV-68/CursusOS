import { useState, useEffect } from 'react';
import { profileAPI } from '../../services/api';

const REQUIRED_FIELDS = ['dob', 'gender', 'guardian_name', 'guardian_phone', 'address'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const GENDERS = ['Male', 'Female', 'Other'];

const s = {
  page: { padding: '2rem', maxWidth: '800px', margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: '700', background: 'linear-gradient(135deg, #f97316, #fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' },
  subtitle: { color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' },
  banner: (type) => ({
    padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.9rem',
    background: type === 'warning' ? 'rgba(251,191,36,0.1)' : 'rgba(34,197,94,0.1)',
    color: type === 'warning' ? '#fbbf24' : '#4ade80',
    border: `1px solid ${type === 'warning' ? 'rgba(251,191,36,0.3)' : 'rgba(34,197,94,0.3)'}`,
  }),
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' },
  tab: (active) => ({
    padding: '0.55rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
    fontSize: '0.9rem', fontWeight: '600',
    background: active ? 'rgba(102,126,234,0.3)' : 'rgba(51,65,85,0.3)',
    color: active ? '#a5b4fc' : '#94a3b8',
    transition: 'all 0.2s ease',
  }),
  section: {
    background: 'rgba(30,41,59,0.8)', borderRadius: '12px', padding: '1.5rem',
    border: '1px solid rgba(100,116,139,0.3)', marginBottom: '1rem',
  },
  sectionTitle: { fontSize: '1rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(51,65,85,0.5)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' },
  field: { marginBottom: '0' },
  label: { display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem', fontWeight: '500' },
  value: { color: '#f1f5f9', fontSize: '0.95rem', padding: '0.5rem 0' },
  input: { width: '100%', padding: '0.55rem 0.75rem', background: 'rgba(15,23,42,0.8)', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box' },
  select: { width: '100%', padding: '0.55rem 0.75rem', background: 'rgba(15,23,42,0.8)', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.9rem' },
  textarea: { width: '100%', padding: '0.55rem 0.75rem', background: 'rgba(15,23,42,0.8)', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.9rem', minHeight: '80px', resize: 'vertical', boxSizing: 'border-box' },
  actions: { display: 'flex', gap: '0.75rem', marginTop: '1.5rem' },
  editBtn: { padding: '0.55rem 1.25rem', borderRadius: '8px', border: '1px solid rgba(102,126,234,0.4)', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', background: 'rgba(102,126,234,0.15)', color: '#a5b4fc' },
  saveBtn: { padding: '0.55rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff' },
  cancelBtn: { padding: '0.55rem 1.25rem', borderRadius: '8px', border: '1px solid #475569', cursor: 'pointer', fontWeight: '500', fontSize: '0.85rem', background: 'transparent', color: '#94a3b8' },
  error: { padding: '0.75rem', background: 'rgba(239,68,68,0.1)', color: '#f87171', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' },
  success: { padding: '0.75rem', background: 'rgba(34,197,94,0.1)', color: '#4ade80', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' },
  masked: { fontFamily: 'monospace', letterSpacing: '1px' },
};

function ProfilePage() {
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
        <div style={s.field}>
          <label style={s.label}>{label}</label>
          <div style={{ ...s.value, ...(opts.masked ? s.masked : {}) }}>{displayVal}</div>
        </div>
      );
    }

    if (options) {
      return (
        <div style={s.field}>
          <label style={s.label}>{label}</label>
          <select style={s.select} value={val} onChange={(e) => setForm({ ...form, [key]: e.target.value })}>
            <option value="">Select...</option>
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      );
    }

    if (rows) {
      return (
        <div style={s.field}>
          <label style={s.label}>{label}</label>
          <textarea style={s.textarea} value={val} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
        </div>
      );
    }

    return (
      <div style={s.field}>
        <label style={s.label}>{label}</label>
        <input
          style={s.input}
          type={type}
          value={type === 'date' && val ? val.substring(0, 10) : val}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
      </div>
    );
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading profile...</div>;

  return (
    <div style={s.page}>
      <h1 style={s.title}>My Profile</h1>
      <p style={s.subtitle}>{profile?.full_name} — {profile?.class_name} (Roll: {profile?.roll_no})</p>

      {!profile?.profile_completed && missingFields.length > 0 && (
        <div style={s.banner('warning')}>
          ⚠️ Profile incomplete — missing: {missingFields.join(', ')}
        </div>
      )}

      {profile?.profile_completed && (
        <div style={s.banner('success')}>✅ Profile is complete</div>
      )}

      {error && <div style={s.error}>{error}</div>}
      {success && <div style={s.success}>{success}</div>}

      <div style={s.tabs}>
        <button style={s.tab(tab === 'personal')} onClick={() => setTab('personal')}>Personal Details</button>
        <button style={s.tab(tab === 'bank')} onClick={() => setTab('bank')}>Bank Details</button>
      </div>

      <div style={s.actions}>
        {!editing ? (
          <button style={s.editBtn} onClick={() => setEditing(true)}>✏️ Edit Profile</button>
        ) : (
          <>
            <button style={s.saveBtn} onClick={handleSave}>💾 Save</button>
            <button style={s.cancelBtn} onClick={handleCancel}>Cancel</button>
          </>
        )}
      </div>

      {tab === 'personal' && (
        <>
          <div style={{ ...s.section, marginTop: '1rem' }}>
            <div style={s.sectionTitle}>Basic Information</div>
            <div style={s.grid}>
              {renderField('Full Name', 'full_name', { readOnly: true })}
              {renderField('Email', 'email', { readOnly: true })}
              {renderField('Phone', 'phone', { readOnly: true })}
              {renderField('Date of Birth', 'dob', { type: 'date' })}
              {renderField('Gender', 'gender', { options: GENDERS })}
              {renderField('Blood Group', 'blood_group', { options: BLOOD_GROUPS })}
            </div>
          </div>

          <div style={s.section}>
            <div style={s.sectionTitle}>Address</div>
            {renderField('Address', 'address', { rows: true })}
          </div>

          <div style={s.section}>
            <div style={s.sectionTitle}>Guardian Details</div>
            <div style={s.grid}>
              {renderField('Guardian Name', 'guardian_name')}
              {renderField('Guardian Phone', 'guardian_phone')}
              {renderField('Guardian Email', 'guardian_email', { type: 'email' })}
              {renderField('Mother Name', 'mother_name')}
              {renderField('Mother Phone', 'mother_phone')}
            </div>
          </div>

          <div style={s.section}>
            <div style={s.sectionTitle}>Emergency Contact</div>
            <div style={s.grid}>
              {renderField('Emergency Contact Name', 'emergency_contact_name')}
              {renderField('Emergency Contact Phone', 'emergency_contact_phone')}
            </div>
          </div>

          <div style={s.section}>
            <div style={s.sectionTitle}>Other Details</div>
            <div style={s.grid}>
              {renderField('Nationality', 'nationality')}
              {renderField('Religion', 'religion')}
              {renderField('Caste Category', 'caste_category')}
              {renderField('Previous School', 'previous_school')}
            </div>
          </div>
        </>
      )}

      {tab === 'bank' && (
        <div style={{ ...s.section, marginTop: '1rem' }}>
          <div style={s.sectionTitle}>Bank & Identity Details</div>
          <div style={s.grid}>
            {renderField('Bank Name', 'bank_name')}
            {renderField('Account Number', 'account_no', { masked: !editing })}
            {renderField('IFSC Code', 'ifsc_code')}
            {renderField('Aadhar Number', 'aadhar_no', { masked: !editing })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
