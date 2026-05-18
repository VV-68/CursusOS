import { useState } from 'react';
import { profileAPI } from '../services/api';

const s = {
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#1e293b', padding: '2rem', borderRadius: '12px', width: '500px', maxWidth: '90%', color: '#e2e8f0' },
  title: { margin: '0 0 1rem 0', color: '#fff', fontSize: '1.2rem' },
  fileBox: { border: '2px dashed #334155', padding: '2rem', textAlign: 'center', borderRadius: '8px', cursor: 'pointer', marginBottom: '1rem', background: 'rgba(15,23,42,0.5)' },
  btnRow: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' },
  btnCancel: { padding: '0.6rem 1rem', background: 'transparent', border: '1px solid #475569', color: '#94a3b8', borderRadius: '6px', cursor: 'pointer' },
  btnSubmit: { padding: '0.6rem 1.2rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  summary: { background: 'rgba(15,23,42,0.8)', padding: '1rem', borderRadius: '8px', marginTop: '1rem', fontSize: '0.9rem' },
  error: { color: '#ef4444', marginTop: '0.5rem', fontSize: '0.85rem', maxHeight: '100px', overflowY: 'auto' }
};

function StudentBulkUpload({ classId, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMsg('');
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('class_id', classId);

      const res = await profileAPI.bulkUploadStudents(formData);
      setResult(res);
      if (res.created > 0) {
         setTimeout(() => {
           onSuccess();
           onClose();
         }, 3000);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <h2 style={s.title}>Bulk Upload Students</h2>
        <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '1rem' }}>
          Upload a CSV or Excel file with columns: <strong>Name, Email, Roll No</strong>
        </p>
        
        {!result ? (
          <>
            <div style={s.fileBox} onClick={() => document.getElementById('bulk-file').click()}>
              {file ? file.name : 'Click to select CSV/XLSX file'}
              <input type="file" id="bulk-file" accept=".csv,.xlsx" style={{ display: 'none' }} onChange={handleFileChange} />
            </div>
            {errorMsg && <div style={{ color: '#ef4444', fontSize: '0.9rem' }}>{errorMsg}</div>}
            <div style={s.btnRow}>
              <button style={s.btnCancel} onClick={onClose} disabled={uploading}>Cancel</button>
              <button style={s.btnSubmit} onClick={handleUpload} disabled={!file || uploading}>
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </>
        ) : (
          <div style={s.summary}>
            <h3 style={{ color: '#fff', margin: '0 0 0.5rem 0' }}>Upload Summary</h3>
            <p>Total Processed: {result.total}</p>
            <p style={{ color: '#4ade80' }}>Successfully Created: {result.created}</p>
            <p style={{ color: '#fbbf24' }}>Skipped: {result.skipped}</p>
            {result.errors && result.errors.length > 0 && (
              <div style={s.error}>
                <strong>Errors:</strong>
                <ul style={{ paddingLeft: '1.2rem', margin: '0.5rem 0' }}>
                  {result.errors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}
            <div style={s.btnRow}>
              <button style={s.btnSubmit} onClick={onClose}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentBulkUpload;
