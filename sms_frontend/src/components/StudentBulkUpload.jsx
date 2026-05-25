import { useState } from 'react';
import { profileAPI } from '../services/api';
import '../pages/admin/CreateDepartment.css'; // Add the CSS import

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
    <div className="json-upload-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="json-upload-modal" style={{ maxWidth: '500px' }}>
        <div className="json-upload-modal__header">
          <h2 style={{ color: '#4f46e5', margin: 0 }}>Bulk Upload Students</h2>
          <button type="button" className="json-upload-modal__close" onClick={onClose}>×</button>
        </div>
        <div className="json-upload-modal__body">
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>
            Upload a CSV or Excel file with columns: <strong>Name, Email, Roll No</strong>
          </p>
          
          {!result ? (
            <>
              <div style={{ border: '2px dashed #cbd5e1', padding: '2rem', textAlign: 'center', borderRadius: '8px', cursor: 'pointer', marginBottom: '1.5rem', background: '#f8fafc', transition: 'all 0.2s' }} onClick={() => document.getElementById('bulk-file').click()}>
                <span style={{ color: '#4f46e5', fontWeight: '500' }}>{file ? file.name : 'Click to select CSV/XLSX file'}</span>
                <input type="file" id="bulk-file" accept=".csv,.xlsx" style={{ display: 'none' }} onChange={handleFileChange} />
              </div>
              
              {errorMsg && <div className="dept-alert dept-alert--error">{errorMsg}</div>}
              
              <div className="json-upload-modal__footer" style={{ borderTop: 'none', padding: 0 }}>
                <button type="button" className="dept-btn dept-btn--secondary" onClick={onClose} disabled={uploading}>Cancel</button>
                <button type="button" className="dept-btn dept-btn--primary" onClick={handleUpload} disabled={!file || uploading}>
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </>
          ) : (
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ color: '#1e293b', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Upload Summary</h3>
              <p style={{ color: '#475569', margin: '0 0 0.5rem' }}>Total Processed: <strong style={{ color: '#1e293b' }}>{result.total}</strong></p>
              <p style={{ color: '#10b981', margin: '0 0 0.5rem' }}>Successfully Created: <strong>{result.created}</strong></p>
              <p style={{ color: '#f59e0b', margin: '0 0 1rem' }}>Skipped: <strong>{result.skipped}</strong></p>
              
              {result.errors && result.errors.length > 0 && (
                <div className="dept-alert dept-alert--error" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                  <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Errors:</strong>
                  <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.85rem' }}>
                    {result.errors.map((err, i) => <li key={i} style={{ marginBottom: '0.25rem' }}>{err}</li>)}
                  </ul>
                </div>
              )}
              
              <div className="json-upload-modal__footer" style={{ borderTop: 'none', padding: 0, marginTop: '1.5rem' }}>
                <button type="button" className="dept-btn dept-btn--primary" onClick={onClose}>Close</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentBulkUpload;
