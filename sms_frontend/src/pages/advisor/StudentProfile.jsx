import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { profileAPI } from '../../services/api';

const s = {
  page: { padding: '2rem', maxWidth: '800px', margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' },
  backBtn: { background: 'none', border: '1px solid #475569', color: '#94a3b8', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' },
  title: { fontSize: '1.5rem', fontWeight: '700', background: 'linear-gradient(135deg, #20c997, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  completionBadge: (ok) => ({
    display: 'inline-block', padding: '0.25rem 0.8rem', borderRadius: '12px',
    fontSize: '0.8rem', fontWeight: '600', marginBottom: '1.5rem',
    background: ok ? 'rgba(34,197,94,0.15)' : 'rgba(251,191,36,0.15)',
    color: ok ? '#4ade80' : '#fbbf24',
  }),
  section: {
    background: 'rgba(30,41,59,0.8)', borderRadius: '12px', padding: '1.5rem',
    border: '1px solid rgba(100,116,139,0.3)', marginBottom: '1rem',
  },
  sectionTitle: { fontSize: '1rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(51,65,85,0.5)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' },
  field: {},
  label: { display: 'block', color: '#64748b', fontSize: '0.78rem', marginBottom: '0.15rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.3px' },
  value: { color: '#f1f5f9', fontSize: '0.95rem' },
  loading: { textAlign: 'center', padding: '3rem', color: '#94a3b8' },
  error: { padding: '0.75rem', background: 'rgba(239,68,68,0.1)', color: '#f87171', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' },
};

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
    <div style={s.field}>
      <div style={s.label}>{label}</div>
      <div style={s.value}>{val || '—'}</div>
    </div>
  );

  if (loading) return <div style={s.loading}>Loading profile...</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate(-1)}>← Back</button>
        <h1 style={s.title}>{profile?.full_name || 'Student Profile'}</h1>
      </div>

      {error && <div style={s.error}>{error}</div>}

      {profile && (
        <>
          <span style={s.completionBadge(profile.profile_completed)}>
            {profile.profile_completed ? '✅ Profile Complete' : '⚠️ Profile Incomplete'}
          </span>

          <div style={s.section}>
            <div style={s.sectionTitle}>Basic Info</div>
            <div style={s.grid}>
              {renderField('Full Name', profile.full_name)}
              {renderField('Roll No', profile.roll_no)}
              {renderField('Class', profile.class_name)}
              {renderField('Date of Birth', formatDate(profile.dob))}
              {renderField('Gender', profile.gender)}
              {renderField('Blood Group', profile.blood_group)}
              {renderField('Email', profile.email)}
              {renderField('Phone', profile.phone)}
            </div>
          </div>

          <div style={s.section}>
            <div style={s.sectionTitle}>Address</div>
            <div style={s.value}>{profile.address || '—'}</div>
          </div>

          <div style={s.section}>
            <div style={s.sectionTitle}>Guardian Details</div>
            <div style={s.grid}>
              {renderField('Guardian Name', profile.guardian_name)}
              {renderField('Guardian Phone', profile.guardian_phone)}
              {renderField('Guardian Email', profile.guardian_email)}
              {renderField('Mother Name', profile.mother_name)}
              {renderField('Mother Phone', profile.mother_phone)}
            </div>
          </div>

          <div style={s.section}>
            <div style={s.sectionTitle}>Emergency Contact</div>
            <div style={s.grid}>
              {renderField('Contact Name', profile.emergency_contact_name)}
              {renderField('Contact Phone', profile.emergency_contact_phone)}
            </div>
          </div>

          <div style={s.section}>
            <div style={s.sectionTitle}>Academic Background</div>
            <div style={s.grid}>
              {renderField('Previous School', profile.previous_school)}
            </div>
          </div>

          <div style={s.section}>
            <div style={s.sectionTitle}>Other Details</div>
            <div style={s.grid}>
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
