import { useState } from 'react';
import { profileAPI } from '../services/api';
import '../pages/admin/CreateDepartment.css'; // Add the CSS import

function AddStudentModal({ classId, onClose, onSuccess }) {
  const [form, setForm] = useState({ full_name: '', email: '', roll_no: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.roll_no) {
      setErrorMsg('Name, Email, and Roll No are required');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      await profileAPI.createStudentManually({ ...form, class_id: classId });
      onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Creation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="json-upload-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="json-upload-modal" style={{ maxWidth: '400px' }}>
        <div className="json-upload-modal__header">
          <h2 style={{ color: '#4f46e5', margin: 0 }}>Add Student Manually</h2>
          <button type="button" className="json-upload-modal__close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="json-upload-modal__body">
          <div className="dept-field">
            <label>Full Name *</label>
            <input style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
          </div>
          <div className="dept-field">
            <label>Email *</label>
            <input style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="dept-field">
            <label>Roll No *</label>
            <input style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} value={form.roll_no} onChange={(e) => setForm({ ...form, roll_no: e.target.value })} required />
          </div>
          <div className="dept-field">
            <label>Phone (Optional)</label>
            <input style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          
          {errorMsg && <div className="dept-alert dept-alert--error">{errorMsg}</div>}
          
          <div className="json-upload-modal__footer" style={{ borderTop: 'none', padding: 0, marginTop: '1.5rem' }}>
            <button type="button" className="dept-btn dept-btn--secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="dept-btn dept-btn--primary" disabled={loading}>
              {loading ? 'Saving...' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddStudentModal;
