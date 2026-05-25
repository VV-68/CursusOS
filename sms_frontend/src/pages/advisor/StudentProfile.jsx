import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { profileAPI } from '../../services/api';
import '../admin/CreateDepartment.css'; // Add the CSS import

function StudentProfile() {
  const { student_id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchProfile(); }, [student_id]);

  const fetchProfile = async () => {
    try {
      const data = await profileAPI.getStudentProfile(student_id);
      setProfile(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const renderField = (label, val) => (
    <div className="dept-field">
      <div style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: '0.15rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ color: '#1e293b', fontSize: '0.95rem', fontWeight: '500' }}>{val || '—'}</div>
    </div>
  );

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading profile...</div>;

  return (
    <div className="dept-wizard" style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate(-1)}>← Back</button>
      
      <div className="dept-wizard__header">
        <h1 style={{ color: '#007bff', margin: 0 }}>
          {profile?.full_name || 'Student Profile'}
        </h1>
      </div>

      {error && <div className="dept-alert dept-alert--error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {profile && (
        <>
          <div className={`dept-alert ${profile.profile_completed ? 'dept-alert--success' : 'dept-alert--error'}`} style={{ marginBottom: '1.5rem', width: 'fit-content' }}>
            <span className="dept-alert__icon">{profile.profile_completed ? '✅' : '⚠️'}</span>
            <span>{profile.profile_completed ? 'Profile Complete' : 'Profile Incomplete'}</span>
          </div>

          <div className="dept-card">
            <div className="dept-card__title" style={{ color: '#007bff', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>Basic Info</div>
            <div className="dept-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', marginBottom: '2rem' }}>
              {renderField('Full Name', profile.full_name)}
              {renderField('Roll No', profile.roll_no)}
              {renderField('Class', profile.class_name)}
              {renderField('Date of Birth', formatDate(profile.dob))}
              {renderField('Gender', profile.gender)}
              {renderField('Blood Group', profile.blood_group)}
              {renderField('Email', profile.email)}
              {renderField('Phone', profile.phone)}
            </div>

            <div className="dept-card__title" style={{ color: '#007bff', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>Address</div>
            <div style={{ color: '#1e293b', fontSize: '0.95rem', fontWeight: '500', marginBottom: '2rem' }}>
              {profile.address || '—'}
            </div>

            <div className="dept-card__title" style={{ color: '#007bff', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>Guardian Details</div>
            <div className="dept-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', marginBottom: '2rem' }}>
              {renderField('Guardian Name', profile.guardian_name)}
              {renderField('Guardian Phone', profile.guardian_phone)}
              {renderField('Guardian Email', profile.guardian_email)}
              {renderField('Mother Name', profile.mother_name)}
              {renderField('Mother Phone', profile.mother_phone)}
            </div>

            <div className="dept-card__title" style={{ color: '#007bff', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>Emergency Contact</div>
            <div className="dept-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', marginBottom: '2rem' }}>
              {renderField('Contact Name', profile.emergency_contact_name)}
              {renderField('Contact Phone', profile.emergency_contact_phone)}
            </div>

            <div className="dept-card__title" style={{ color: '#007bff', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>Academic Background</div>
            <div className="dept-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', marginBottom: '2rem' }}>
              {renderField('Previous School', profile.previous_school)}
            </div>

            <div className="dept-card__title" style={{ color: '#007bff', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>Other Details</div>
            <div className="dept-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              {renderField('Nationality', profile.nationality)}
              {renderField('Religion', profile.religion)}
              {renderField('Caste Category', profile.caste_category)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default StudentProfile;
