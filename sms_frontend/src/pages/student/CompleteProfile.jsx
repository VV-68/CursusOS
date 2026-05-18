import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileAPI } from '../../services/api';

const s = {
  page: { padding: '2rem', maxWidth: '600px', margin: '0 auto', minHeight: '80vh', display: 'flex', alignItems: 'center' },
  card: { background: 'rgba(30,41,59,0.8)', padding: '2.5rem', borderRadius: '12px', width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  title: { fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.5rem', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: '0.9rem', color: '#94a3b8', marginBottom: '2rem', textAlign: 'center' },
  formGroup: { marginBottom: '1.2rem' },
  label: { display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#cbd5e1', fontWeight: '600' },
  input: { width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #334155', background: 'rgba(15,23,42,0.6)', color: '#fff', fontSize: '0.95rem', boxSizing: 'border-box' },
  select: { width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #334155', background: 'rgba(15,23,42,0.6)', color: '#fff', fontSize: '0.95rem', boxSizing: 'border-box' },
  btnSubmit: { width: '100%', padding: '0.8rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', marginTop: '1rem', transition: 'all 0.2s' },
  error: { color: '#ef4444', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'center' }
};

function CompleteProfile() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    new_password: '', confirm_password: '', phone: '', dob: '', gender: '', blood_group: '', address: '',
    guardian_name: '', guardian_phone: '', bank_name: '', account_no: '', ifsc_code: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm_password) {
      setErrorMsg("Passwords do not match");
      return;
    }
    
    // Validation for password strength
    if (form.new_password.length < 8 || !/[A-Z]/.test(form.new_password) || !/[0-9]/.test(form.new_password)) {
      setErrorMsg("Password must be at least 8 characters, contain 1 uppercase and 1 number");
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await profileAPI.completeProfile(form);
      
      // Update local storage to remove must_change_password flag
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        userObj.must_change_password = false;
        localStorage.setItem('user', JSON.stringify(userObj));
      }
      
      window.location.href = '/dashboard'; // hard refresh to update App.jsx state
    } catch (err) {
      setErrorMsg(err.message || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>Complete Your Profile</h1>
        <p style={s.subtitle}>Please update your password and details to continue.</p>
        
        <form onSubmit={handleSubmit}>
          {errorMsg && <div style={s.error}>{errorMsg}</div>}
          
          <div style={s.formGroup}>
            <label style={s.label}>New Password *</label>
            <input style={s.input} type="password" name="new_password" required value={form.new_password} onChange={handleChange} placeholder="Min 8 chars, 1 uppercase, 1 number" />
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Confirm Password *</label>
            <input style={s.input} type="password" name="confirm_password" required value={form.confirm_password} onChange={handleChange} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={s.formGroup}>
              <label style={s.label}>Phone Number</label>
              <input style={s.input} name="phone" value={form.phone} onChange={handleChange} />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Date of Birth</label>
              <input style={s.input} type="date" name="dob" value={form.dob} onChange={handleChange} />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Gender</label>
              <select style={s.select} name="gender" value={form.gender} onChange={handleChange}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Blood Group</label>
              <input style={s.input} name="blood_group" value={form.blood_group} onChange={handleChange} placeholder="e.g. O+" />
            </div>
          </div>

          <div style={s.formGroup}>
            <label style={s.label}>Address</label>
            <textarea style={{ ...s.input, minHeight: '80px', resize: 'vertical' }} name="address" value={form.address} onChange={handleChange} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
             <div style={s.formGroup}>
               <label style={s.label}>Guardian Name</label>
               <input style={s.input} name="guardian_name" value={form.guardian_name} onChange={handleChange} />
             </div>
             <div style={s.formGroup}>
               <label style={s.label}>Guardian Phone</label>
               <input style={s.input} name="guardian_phone" value={form.guardian_phone} onChange={handleChange} />
             </div>
          </div>

          <button type="submit" style={s.btnSubmit} disabled={loading}>
            {loading ? 'Saving Profile...' : 'Complete Profile & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CompleteProfile;
