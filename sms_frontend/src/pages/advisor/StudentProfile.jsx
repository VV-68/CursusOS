import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { profileAPI, documentAPI } from '../../services/api';
import '../admin/CreateDepartment.css';

function StudentProfileViewer() {
  const { student_id } = useParams();
  const navigate = useNavigate();
  
  // Use localStorage instead of useAuthStore
  const role = localStorage.getItem('role');
  
  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [remarks, setRemarks] = useState('');
  const [verifyModal, setVerifyModal] = useState({ open: false, type: '', id: null }); // type: profile or document

  useEffect(() => {
    fetchData();
  }, [student_id]);

  const fetchData = async () => {
    try {
      const data = await profileAPI.getStudentProfile(student_id);
      setProfile(data);
      const docs = await documentAPI.getStudentDocuments(student_id);
      setDocuments(docs);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleVerifyProfile = async (status) => {
    try {
      await profileAPI.verifyProfile(student_id, status, remarks);
      setSuccess(`Profile ${status === 1 ? 'verified' : 'rejected'}.`);
      setVerifyModal({ open: false });
      setRemarks('');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.message); }
  };

  const handleVerifyDocument = async (id, status) => {
    try {
      await documentAPI.verifyDocument(id, status);
      setSuccess(`Document ${status}.`);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.message); }
  };

  const handleViewDoc = async (id) => {
    try {
      const { signed_url } = await documentAPI.getDocumentUrl(id);
      window.open(signed_url, '_blank');
    } catch (err) { setError(err.message); }
  };

  const canVerify = role === 'advisor' || role === 'admin';

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading profile...</div>;
  if (error && !profile) return <div className="dept-alert dept-alert--error" style={{ margin: '1.5rem auto', maxWidth: '800px' }}>{error}</div>;

  const renderField = (label, val) => (
    <div className="dept-field">
      <label style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      <div style={{ color: '#1e293b', fontSize: '0.95rem', padding: '0.5rem 0', fontWeight: 500 }}>
        {val || '—'}
      </div>
    </div>
  );

  return (
    <div className="dept-wizard" style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate(-1)}>← Back</button>
      
      <div className="dept-wizard__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: '#007bff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            👤 Student Profile
          </h1>
          <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '0.95rem' }}>
            {profile?.full_name} — {profile?.class_name} (Roll: {profile?.roll_no})
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
           <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: profile?.isverified === 1 ? '#10b981' : (profile?.isverified === 2 ? '#ef4444' : '#f59e0b') }}>
             {profile?.isverified === 1 ? 'Verified ✅' : (profile?.isverified === 2 ? 'Rejected ❌' : 'Verification Pending ⏳')}
           </div>
           {canVerify && profile?.isverified !== 1 && (
             <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                <button className="dept-btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: '#ecfdf5', color: '#059669' }} onClick={() => setVerifyModal({ open: true, type: 'profile' })}>Verify Profile</button>
             </div>
           )}
        </div>
      </div>

      {error && <div className="dept-alert dept-alert--error" style={{ marginBottom: '1.5rem' }}>{error}</div>}
      {success && <div className="dept-alert dept-alert--success" style={{ marginBottom: '1.5rem', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>{success}</div>}

      <div className="dept-card" style={{ marginBottom: '1.5rem' }}>
        <div className="dept-card__title" style={{ color: '#007bff', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>1. Basic Information</div>
        <div className="dept-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {renderField('Full Name', profile?.full_name)}
          {renderField('Roll Number', profile?.roll_no)}
          {renderField('Admission Number', profile?.admission_no)}
          {renderField('Email', profile?.email)}
          {renderField('Phone', profile?.phone)}
          {renderField('Date of Birth', profile?.dob ? new Date(profile.dob).toLocaleDateString('en-IN') : null)}
          {renderField('Gender', profile?.gender)}
          {renderField('Blood Group', profile?.blood_group)}
        </div>
      </div>

      <div className="dept-card" style={{ marginBottom: '1.5rem' }}>
        <div className="dept-card__title" style={{ color: '#007bff', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>2. Academic Information</div>
        <div className="dept-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {renderField('Batch', profile?.class_name)}
          {renderField('Department', profile?.dept_id)} {/* Might need dept name */}
          {renderField('Current Year', profile?.current_year)}
          {renderField('Current Semester', profile?.current_semester_name || profile?.current_semester)}
          {renderField('Admission Date', profile?.admission_date ? new Date(profile.admission_date).toLocaleDateString('en-IN') : null)}
          {renderField('Previous School', profile?.previous_school)}
          {renderField('Advisor(s)', [profile?.advisor1_name, profile?.advisor2_name].filter(Boolean).join(', ') || 'None')}
        </div>
      </div>

      <div className="dept-card" style={{ marginBottom: '1.5rem' }}>
        <div className="dept-card__title" style={{ color: '#007bff', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>3. Address Information</div>
        {renderField('Address', profile?.address)}
      </div>

      <div className="dept-card" style={{ marginBottom: '1.5rem' }}>
        <div className="dept-card__title" style={{ color: '#007bff', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>4. Guardian Information</div>
        <div className="dept-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {renderField('Father Name', profile?.father_name)}
          {renderField('Father Phone', profile?.father_phone)}
          {renderField('Father Email', profile?.father_email)}
          {renderField('Mother Name', profile?.mother_name)}
          {renderField('Mother Phone', profile?.mother_phone)}
          {renderField('Mother Email', profile?.mother_email)}
          {renderField('Guardian Name', profile?.guardian_name)}
          {renderField('Guardian Phone', profile?.guardian_phone)}
          {renderField('Guardian Email', profile?.guardian_email)}
        </div>
      </div>

      <div className="dept-card" style={{ marginBottom: '1.5rem' }}>
        <div className="dept-card__title" style={{ color: '#007bff', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>5. Emergency Contact</div>
        <div className="dept-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {renderField('Contact Name', profile?.emergency_contact_name)}
          {renderField('Contact Phone', profile?.emergency_contact_phone)}
        </div>
      </div>

      <div className="dept-card" style={{ marginBottom: '1.5rem' }}>
        <div className="dept-card__title" style={{ color: '#007bff', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>6. Medical Information</div>
        <div className="dept-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {renderField('Blood Group', profile?.blood_group)}
          {renderField('Medical Conditions', profile?.medical_conditions)}
          {renderField('Allergies', profile?.allergies)}
        </div>
      </div>

      {(profile?.bank_name || role === 'admin') && (
      <div className="dept-card" style={{ marginBottom: '1.5rem' }}>
        <div className="dept-card__title" style={{ color: '#007bff', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>7. Banking Information</div>
        <div className="dept-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {renderField('Bank Name', profile?.bank_name)}
          {renderField('Branch Name', profile?.branch_name)}
          {renderField('Account Number', profile?.account_no)}
          {renderField('IFSC Code', profile?.ifsc_code)}
        </div>
      </div>
      )}

      <div className="dept-card" style={{ marginBottom: '1.5rem' }}>
        <div className="dept-card__title" style={{ color: '#007bff', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>8. Uploaded Documents</div>
        {documents.length === 0 ? (
           <div style={{ color: '#64748b' }}>No documents uploaded.</div>
        ) : (
           <table className="dept-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
             <thead>
               <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                 <th style={{ padding: '0.5rem' }}>Document Name</th>
                 <th style={{ padding: '0.5rem' }}>Verification Status</th>
                 <th style={{ padding: '0.5rem' }}>Actions</th>
               </tr>
             </thead>
             <tbody>
               {documents.map(d => (
                 <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                   <td style={{ padding: '0.75rem 0.5rem' }}><strong>{d.document_type}</strong><br/><small style={{color: '#64748b'}}>{d.file_name}</small></td>
                   <td style={{ padding: '0.75rem 0.5rem' }}>
                     <span style={{
                        padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                        background: d.verification_status === 'Verified' ? '#ecfdf5' : (d.verification_status === 'Rejected' ? '#fef2f2' : '#fef9c3'),
                        color: d.verification_status === 'Verified' ? '#065f46' : (d.verification_status === 'Rejected' ? '#991b1b' : '#854d0e')
                     }}>
                       {d.verification_status}
                     </span>
                   </td>
                   <td style={{ padding: '0.75rem 0.5rem', display: 'flex', gap: '0.5rem' }}>
                     <button className="dept-btn" style={{ background: '#e0f2fe', color: '#0284c7', padding: '0.3rem 0.6rem' }} onClick={() => handleViewDoc(d.id)}>View/Download</button>
                     {canVerify && d.verification_status === 'Pending' && (
                       <>
                         <button className="dept-btn" style={{ background: '#ecfdf5', color: '#059669', padding: '0.3rem 0.6rem' }} onClick={() => handleVerifyDocument(d.id, 'Verified')}>Approve</button>
                         <button className="dept-btn" style={{ background: '#fef2f2', color: '#dc2626', padding: '0.3rem 0.6rem' }} onClick={() => handleVerifyDocument(d.id, 'Rejected')}>Reject</button>
                       </>
                     )}
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
        )}
      </div>

      {/* Verify Profile Modal */}
      {verifyModal.open && verifyModal.type === 'profile' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 1rem', color: '#1e293b' }}>Verify Profile</h3>
            <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '1rem' }}>Are you sure you want to approve this student's profile? You can also reject it and provide remarks.</p>
            
            <textarea 
               placeholder="Remarks (required if rejecting)"
               value={remarks}
               onChange={e => setRemarks(e.target.value)}
               style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '1.5rem', resize: 'vertical', minHeight: '80px' }}
            />
            
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
               <button className="dept-btn dept-btn--secondary" onClick={() => { setVerifyModal({ open: false }); setRemarks(''); }}>Cancel</button>
               <button className="dept-btn" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }} onClick={() => handleVerifyProfile(2)}>Reject</button>
               <button className="dept-btn" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }} onClick={() => handleVerifyProfile(1)}>Approve</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default StudentProfileViewer;
