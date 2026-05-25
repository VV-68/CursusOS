import { useState, useEffect } from 'react';
import { userAPI, departmentAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const suggestUsername = (fullName) => {
  const parts = fullName.trim().toLowerCase().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '';
  if (parts.length === 1) return parts[0];
  return `${parts[0]}.${parts[parts.length - 1]}`;
};

function CreateUser() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  let callerRole = '';
  try { callerRole = jwtDecode(token).role; } catch (e) {}

  const isHOD = callerRole === 'hod';

  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    role: isHOD ? 'faculty' : 'hod',
    dept_id: '',
    email: '',
    phone: '',
  });
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!isHOD) {
      departmentAPI.getAll().then(setDepartments).catch(console.error);
    }
  }, [isHOD]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'full_name') {
      setSuggestion(suggestUsername(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const data = { ...formData };
      if (!data.dept_id) data.dept_id = null;
      // HOD: don't send dept_id (backend uses req.user.dept_id)
      if (isHOD) delete data.dept_id;

      const res = await userAPI.create(data);
      setSuccessMsg(res.message || `User "${formData.username}" created. Default password: Welcome@123`);
      setFormData({ username: '', full_name: '', role: isHOD ? 'faculty' : 'hod', dept_id: '', email: '', phone: '' });
      setSuggestion('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' };

  const roleOptions = isHOD
    ? [{ value: 'faculty', label: 'Faculty' }, { value: 'advisor', label: 'Advisor' }]
    : [
        { value: 'admin', label: 'Admin' },
        { value: 'hod', label: 'HOD' },
        { value: 'advisor', label: 'Advisor' },
        { value: 'faculty', label: 'Faculty' },
      ];

  return (
    <div style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate(callerRole === 'admin' ? '/dashboard?tab=admin' : '/dashboard?tab=dept')}>← Back</button>
      <h2>{isHOD ? 'Add Faculty / Advisor' : 'Create User'}</h2>

      {error && <div style={{ color: '#721c24', background: '#f8d7da', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}
      {successMsg && <div style={{ color: '#155724', background: '#d4edda', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>{successMsg}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '500' }}>Full Name *</label>
          <input name="full_name" value={formData.full_name} onChange={handleChange} placeholder="e.g. Dr. Ramesh Kumar" className="form-control" required disabled={loading} />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '500' }}>Username *</label>
          <input name="username" value={formData.username} onChange={handleChange} placeholder="Login ID" className="form-control" required disabled={loading} />
          {suggestion && formData.username !== suggestion && (
            <small style={{ color: '#007bff', cursor: 'pointer' }} onClick={() => setFormData(prev => ({ ...prev, username: suggestion }))}>
              Suggested: <strong>{suggestion}</strong> — click to use
            </small>
          )}
          <small style={{ display: 'block', color: '#666' }}>This will be their login ID</small>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '500' }}>Role *</label>
          <select name="role" value={formData.role} onChange={handleChange} className="form-control" disabled={loading}>
            {roleOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        {!isHOD && (
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '500' }}>Department</label>
            <select name="dept_id" value={formData.dept_id} onChange={handleChange} className="form-control" disabled={loading}>
              <option value="">— No Department —</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
            </select>
          </div>
        )}

        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '500' }}>Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Optional" className="form-control" disabled={loading} />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '500' }}>Phone</label>
          <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Optional" className="form-control" disabled={loading} />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="submit" disabled={loading} style={{ flex: 1, padding: '0.6rem', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>
            {loading ? 'Creating...' : 'Create User'}
          </button>

        </div>
      </form>
    </div>
  );
}

export default CreateUser;
