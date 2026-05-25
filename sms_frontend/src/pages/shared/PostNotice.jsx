import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { noticeAPI } from '../../services/api';
import '../admin/CreateDepartment.css';

const ADMIN_RECIPIENTS = [
  { key: 'hod', label: 'HODs' },
  { key: 'faculty', label: 'Faculty' },
  { key: 'student', label: 'Students' }
];

const HOD_RECIPIENTS = [
  { key: 'faculty', label: 'Faculty' },
  { key: 'student', label: 'Students' }
];

const defaultAudienceState = (recipientList) =>
  Object.fromEntries(recipientList.map(r => [r.key, false]));

function PostNotice() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  let role = '';
  try {
    if (token) role = jwtDecode(token).role;
  } catch {
    /* ignore */
  }

  const recipients = role === 'admin' ? ADMIN_RECIPIENTS : HOD_RECIPIENTS;

  const [form, setForm] = useState({
    title: '',
    body: '',
    audience: defaultAudienceState(recipients),
    is_pinned: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const toggleAudience = (key) => {
    setForm(prev => ({
      ...prev,
      audience: { ...prev.audience, [key]: !prev.audience[key] }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const audience = Object.entries(form.audience)
      .filter(([, checked]) => checked)
      .map(([key]) => key);

    if (!audience.length) {
      setError('Select at least one recipient group.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await noticeAPI.create({
        title: form.title,
        body: form.body,
        audience,
        is_pinned: form.is_pinned
      });
      navigate(role === 'admin' ? '/dashboard?tab=admin' : '/dashboard?tab=general');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!['admin', 'hod'].includes(role)) {
    return (
      <div className="dept-wizard" style={{ maxWidth: '560px', margin: '2rem auto', padding: '1.5rem' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate('/dashboard?tab=general')}>← Back</button>
        <div className="dept-alert dept-alert--error">You do not have permission to post notices.</div>
      </div>
    );
  }

  return (
    <div className="dept-wizard" style={{ maxWidth: '640px', margin: '0 auto', padding: '1.5rem' }}>
      <div className="dept-wizard__header">
        <h1>📢 Post Notice</h1>
        <button type="button" className="dept-btn dept-btn--secondary" onClick={() => navigate(role === 'admin' ? '/dashboard?tab=admin' : '/dashboard?tab=general')}>← Back</button>
      </div>

      {error && (
        <div className="dept-alert dept-alert--error">
          <span className="dept-alert__icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="dept-card">
        <div className="dept-field">
          <label>Title *</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            maxLength={200}
            placeholder="Notice title"
          />
        </div>

        <div className="dept-field" style={{ marginTop: '1rem' }}>
          <label>Message *</label>
          <textarea
            name="body"
            value={form.body}
            onChange={handleChange}
            required
            rows={6}
            placeholder="Write your notice here…"
            style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }}
          />
        </div>

        <div className="dept-field" style={{ marginTop: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.65rem' }}>Recipients *</label>
          <div
            className="dept-audience-checkboxes"
            style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}
          >
            {recipients.map(r => (
              <label
                key={r.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  cursor: 'pointer',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: form.audience[r.key] ? '#eef2ff' : '#fff'
                }}
              >
                <input
                  type="checkbox"
                  checked={!!form.audience[r.key]}
                  onChange={() => toggleAudience(r.key)}
                />
                <span style={{ fontWeight: 500, color: '#334155' }}>{r.label}</span>
              </label>
            ))}
          </div>
          <p style={{ fontSize: '.8rem', color: '#64748b', margin: '0.5rem 0 0' }}>
            {role === 'admin'
              ? 'College-wide notice. Notices for Faculty are also delivered to all HODs.'
              : 'Notice is limited to your department.'}
          </p>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', cursor: 'pointer' }}>
          <input type="checkbox" name="is_pinned" checked={form.is_pinned} onChange={handleChange} />
          Pin to top of notice board
        </label>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" className="dept-btn dept-btn--secondary" onClick={() => navigate(role === 'admin' ? '/dashboard?tab=admin' : '/dashboard?tab=general')}>
            Cancel
          </button>
          <button type="submit" className="dept-btn dept-btn--primary" disabled={submitting}>
            {submitting ? 'Posting…' : 'Post Notice'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PostNotice;
