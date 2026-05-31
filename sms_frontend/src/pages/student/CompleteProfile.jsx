import { useState } from 'react';

import { profileAPI } from '../../services/api';

function CompleteProfile() {
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
      
      // Clear auth tokens and force login with new credentials
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      window.location.href = '/login';
    } catch (err) {
      setErrorMsg(err.message || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ padding: '2rem 1rem' }}>
      <div className="auth-card" style={{ maxWidth: '600px' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Complete Your Profile</h1>
        <p className="auth-link" style={{ marginTop: '0', marginBottom: '2rem', color: 'var(--text-muted)' }}>
          Please update your password and details to continue.
        </p>
        
        <form onSubmit={handleSubmit}>
          {errorMsg && <div className="error-msg">{errorMsg}</div>}
          
          <div className="form-group">
            <label>New Password *</label>
            <input className="form-control" type="password" name="new_password" required value={form.new_password} onChange={handleChange} placeholder="Min 8 chars, 1 uppercase, 1 number" />
          </div>
          <div className="form-group">
            <label>Confirm Password *</label>
            <input className="form-control" type="password" name="confirm_password" required value={form.confirm_password} onChange={handleChange} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 1rem' }}>
            <div className="form-group">
              <label>Phone Number</label>
              <input className="form-control" name="phone" value={form.phone} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Date of Birth</label>
              <input className="form-control" type="date" name="dob" value={form.dob} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select className="form-control" name="gender" value={form.gender} onChange={handleChange}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Blood Group</label>
              <input className="form-control" name="blood_group" value={form.blood_group} onChange={handleChange} placeholder="e.g. O+" />
            </div>
          </div>

          <div className="form-group">
            <label>Address</label>
            <textarea className="form-control" style={{ minHeight: '80px', resize: 'vertical' }} name="address" value={form.address} onChange={handleChange} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 1rem' }}>
             <div className="form-group">
               <label>Guardian Name</label>
               <input className="form-control" name="guardian_name" value={form.guardian_name} onChange={handleChange} />
             </div>
             <div className="form-group">
               <label>Guardian Phone</label>
               <input className="form-control" name="guardian_phone" value={form.guardian_phone} onChange={handleChange} />
             </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Saving Profile...' : 'Complete Profile & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CompleteProfile;
