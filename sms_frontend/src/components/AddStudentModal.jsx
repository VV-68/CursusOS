import { useState } from 'react';
import { profileAPI } from '../services/api';

const s = {
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#1e293b', padding: '2rem', borderRadius: '12px', width: '400px', maxWidth: '90%', color: '#e2e8f0' },
  title: { margin: '0 0 1.5rem 0', color: '#fff', fontSize: '1.2rem' },
  formGroup: { marginBottom: '1rem' },
  label: { display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#cbd5e1' },
  input: { width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #334155', background: 'rgba(15,23,42,0.6)', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box' },
  btnRow: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' },
  btnCancel: { padding: '0.6rem 1rem', background: 'transparent', border: '1px solid #475569', color: '#94a3b8', borderRadius: '6px', cursor: 'pointer' },
  btnSubmit: { padding: '0.6rem 1.2rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
};

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
    <div style={s.overlay}>
      <div style={s.modal}>
        <h2 style={s.title}>Add Student Manually</h2>
        <form onSubmit={handleSubmit}>
          <div style={s.formGroup}>
            <label style={s.label}>Full Name *</label>
            <input style={s.input} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Email *</label>
            <input style={s.input} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Roll No *</label>
            <input style={s.input} value={form.roll_no} onChange={(e) => setForm({ ...form, roll_no: e.target.value })} required />
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Phone (Optional)</label>
            <input style={s.input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          {errorMsg && <div style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '1rem' }}>{errorMsg}</div>}
          <div style={s.btnRow}>
            <button type="button" style={s.btnCancel} onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" style={s.btnSubmit} disabled={loading}>
              {loading ? 'Saving...' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddStudentModal;
