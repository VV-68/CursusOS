import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileAPI, documentAPI } from '../../services/api';
import '../admin/CreateDepartment.css'; 

const REQUIRED_FIELDS = ['dob', 'gender', 'guardian_name', 'guardian_phone', 'address'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const GENDERS = ['Male', 'Female', 'Other'];
const DOCUMENT_TYPES = [
  'Aadhaar Card', 'Passport Photo', 'Signature', 'SSLC Certificate', 
  'Plus Two Certificate', 'Transfer Certificate', 'Income Certificate', 
  'Community Certificate', 'Other Documents'
];

function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState('personal');
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // document upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadType, setUploadType] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchProfileAndDocs(); }, []);

  const fetchProfileAndDocs = async () => {
    try {
      const data = await profileAPI.getMyProfile();
      const docs = await documentAPI.getMyDocuments();
      setProfile(data);
      setForm(data);
      setDocuments(docs);
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

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadType) {
      setError('Please select a file and document type.');
      return;
    }
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      await documentAPI.uploadDocument(uploadFile, uploadType);
      const docs = await documentAPI.getMyDocuments();
      setDocuments(docs);
      setSuccess('Document uploaded successfully!');
      setUploadFile(null);
      setUploadType('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await documentAPI.deleteMyDocument(id);
      setDocuments(documents.filter(d => d.id !== id));
      setSuccess('Document deleted.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.message); }
  };

  const handleViewDoc = async (id) => {
    try {
      const { signed_url } = await documentAPI.getDocumentUrl(id);
      window.open(signed_url, '_blank');
    } catch (err) { setError(err.message); }
  };

  const maskValue = (val, show = 4) => {
    if (!val) return '—';
    if (val.length <= show) return val;
    return '•'.repeat(val.length - show) + val.slice(-show);
  };

  const renderField = (label, key, opts = {}) => {
    const { type = 'text', options, rows, readOnly, masked } = opts;
    const val = form[key] || '';

    if (!editing || readOnly) {
      let displayVal = profile?.[key] || '—';
      if (masked && profile?.[key]) displayVal = maskValue(profile[key]);
      if (type === 'date' && profile?.[key]) displayVal = new Date(profile[key]).toLocaleDateString('en-IN');
      return (
        <div className="dept-field">
          <label style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
          <div style={{ color: '#1e293b', fontSize: '0.95rem', padding: '0.5rem 0', fontWeight: 500, fontFamily: masked ? 'monospace' : 'inherit' }}>
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
          readOnly={readOnly}
        />
      </div>
    );
  };

  // Completion calculation
  const calcCompletion = () => {
    if (!profile) return 0;
    const groups = [
      { fields: ['full_name', 'email', 'phone', 'dob', 'gender', 'blood_group', 'aadhaar_no', 'address', 'nationality', 'religion', 'caste_category'] },
      { fields: ['guardian_name', 'guardian_phone', 'father_name', 'mother_name', 'annual_income'] },
      { fields: ['emergency_contact_name', 'emergency_contact_phone'] },
      { fields: ['previous_school'] },
      { fields: ['bank_name', 'branch_name', 'account_no', 'ifsc_code'] }
    ];
    let score = 0;
    let total = groups.length + 1; // groups + documents
    groups.forEach(g => {
        if (g.fields.some(f => !!profile[f])) score++;
    });
    if (documents && documents.length > 0) score++;
    
    return Math.round((score / total) * 100);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading profile...</div>;

  const completionPct = calcCompletion();

  return (
    <div className="dept-wizard" style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate('/dashboard?tab=academics')}>← Back</button>
      
      <div className="dept-wizard__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: '#007bff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            👤 My Profile
          </h1>
          <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '0.95rem' }}>
            {profile?.full_name} — {profile?.class_name} (Roll: {profile?.roll_no})
            {profile?.current_semester_name ? ` • ${profile.current_semester_name} (Year ${profile.current_year})` : ''}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
           <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: completionPct === 100 ? '#10b981' : '#f59e0b' }}>
             {completionPct}% Complete
           </div>
           <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
             Status: {profile?.isverified === 1 ? 'Verified ✅' : (profile?.isverified === 2 ? 'Rejected ❌' : 'Pending ⏳')}
           </div>
        </div>
      </div>

      {error && <div className="dept-alert dept-alert--error" style={{ marginBottom: '1.5rem' }}>{error}</div>}
      {success && <div className="dept-alert dept-alert--success" style={{ marginBottom: '1.5rem', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>{success}</div>}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: '#f1f5f9', padding: '0.35rem', borderRadius: '10px', width: 'fit-content', flexWrap: 'wrap' }}>
        {['personal', 'family', 'academic', 'bank', 'documents'].map(t => (
          <button 
            key={t}
            style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600', background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#007bff' : '#64748b', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s ease', textTransform: 'capitalize' }} 
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab !== 'documents' && (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {!editing ? (
            <button className="dept-btn dept-btn--primary" onClick={() => setEditing(true)}>✏️ Edit Profile</button>
          ) : (
            <>
              <button className="dept-btn dept-btn--success" onClick={handleSave}>💾 Save Changes</button>
              <button className="dept-btn dept-btn--secondary" onClick={handleCancel}>Cancel</button>
            </>
          )}
        </div>
      )}

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
              {renderField('Aadhaar Number', 'aadhaar_no')}
              {renderField('Nationality', 'nationality')}
              {renderField('Religion', 'religion')}
              {renderField('Caste Category', 'caste_category')}
            </div>

            <div className="dept-card__title" style={{ color: '#007bff', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>Address Details</div>
            <div style={{ marginBottom: '2rem' }}>
              {renderField('Address', 'address', { rows: true })}
            </div>
            
            <div className="dept-card__title" style={{ color: '#007bff', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>Medical & Student Life</div>
            <div className="dept-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', marginBottom: '2rem' }}>
              {renderField('Medical Conditions', 'medical_conditions', { rows: true })}
              {renderField('Allergies', 'allergies', { rows: true })}
              {renderField('Hostel Status', 'hostel_status', { options: ['Hosteller', 'Day Scholar'] })}
              {renderField('Transportation Mode', 'transportation_mode', { options: ['College Bus', 'Public Transport', 'Own Vehicle', 'Walking'] })}
            </div>
          </>
        )}

        {tab === 'family' && (
          <>
            <div className="dept-card__title" style={{ color: '#007bff', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>Guardian/Parent Details</div>
            <div className="dept-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', marginBottom: '2rem' }}>
              {renderField('Father Name', 'father_name')}
              {renderField('Father Phone', 'father_phone')}
              {renderField('Father Email', 'father_email', { type: 'email' })}
              {renderField('Mother Name', 'mother_name')}
              {renderField('Mother Phone', 'mother_phone')}
              {renderField('Mother Email', 'mother_email', { type: 'email' })}
              {renderField('Guardian Name', 'guardian_name')}
              {renderField('Guardian Phone', 'guardian_phone')}
              {renderField('Guardian Email', 'guardian_email', { type: 'email' })}
              {renderField('Annual Income (₹)', 'annual_income', { type: 'number' })}
            </div>

            <div className="dept-card__title" style={{ color: '#007bff', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>Emergency Contact</div>
            <div className="dept-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              {renderField('Emergency Contact Name', 'emergency_contact_name')}
              {renderField('Emergency Contact Phone', 'emergency_contact_phone')}
            </div>
          </>
        )}

        {tab === 'academic' && (
          <>
            <div className="dept-card__title" style={{ color: '#007bff', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>Academic Background</div>
            <div className="dept-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', marginBottom: '2rem' }}>
              {renderField('Admission Number', 'admission_no')}
              {renderField('Admission Date', 'admission_date', { type: 'date' })}
              {renderField('Previous School/College', 'previous_school')}
              <div className="dept-field" style={{ gridColumn: '1 / -1' }}>
                 <label style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Advisor(s)</label>
                 <div style={{ color: '#1e293b', fontSize: '0.95rem', padding: '0.5rem 0', fontWeight: 500 }}>
                    {[profile?.advisor1_name, profile?.advisor2_name].filter(Boolean).join(', ') || 'None assigned'}
                 </div>
              </div>
            </div>
          </>
        )}

        {tab === 'bank' && (
          <>
            <div className="dept-card__title" style={{ color: '#007bff', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>Bank Account</div>
            <div className="dept-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              {renderField('Account Number', 'account_no', { masked: true })}
              {renderField('IFSC Code', 'ifsc_code')}
              {renderField('Bank Name', 'bank_name')}
              {renderField('Branch Name', 'branch_name')}
            </div>
          </>
        )}

        {tab === 'documents' && (
          <>
             <div className="dept-card__title" style={{ color: '#007bff', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>Upload New Document</div>
             <form onSubmit={handleUpload} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Document Type</label>
                  <select value={uploadType} onChange={e => setUploadType(e.target.value)} required style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <option value="">Select Type...</option>
                    {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ flex: '2', minWidth: '250px' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>File</label>
                  <input type="file" onChange={e => setUploadFile(e.target.files[0])} required style={{ width: '100%', padding: '0.55rem', background: '#fff', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <button type="submit" disabled={uploading} className="dept-btn dept-btn--primary">
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
             </form>

             <div className="dept-card__title" style={{ color: '#007bff', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>Uploaded Documents</div>
             {documents.length === 0 ? (
               <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>No documents uploaded yet.</div>
             ) : (
               <div style={{ overflowX: 'auto' }}>
                 <table className="dept-table">
                   <thead>
                     <tr>
                       <th>Document Type</th>
                       <th>File Name</th>
                       <th>Uploaded At</th>
                       <th>Status</th>
                       <th>Actions</th>
                     </tr>
                   </thead>
                   <tbody>
                     {documents.map(d => (
                       <tr key={d.id}>
                         <td><strong>{d.document_type}</strong></td>
                         <td>{d.file_name}</td>
                         <td>{new Date(d.uploaded_at).toLocaleDateString('en-IN')}</td>
                         <td>
                           <span style={{
                              padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                              background: d.verification_status === 'Verified' ? '#ecfdf5' : (d.verification_status === 'Rejected' ? '#fef2f2' : '#fef9c3'),
                              color: d.verification_status === 'Verified' ? '#065f46' : (d.verification_status === 'Rejected' ? '#991b1b' : '#854d0e')
                           }}>
                             {d.verification_status}
                           </span>
                         </td>
                         <td style={{ display: 'flex', gap: '0.5rem' }}>
                           <button className="dept-btn" style={{ background: '#e0f2fe', color: '#0284c7', padding: '0.3rem 0.6rem' }} onClick={() => handleViewDoc(d.id)}>View</button>
                           {d.verification_status === 'Pending' && (
                             <button className="dept-btn" style={{ background: '#fee2e2', color: '#ef4444', padding: '0.3rem 0.6rem' }} onClick={() => handleDeleteDoc(d.id)}>Delete</button>
                           )}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
          </>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
