import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { attendanceAPI } from '../../services/api';

function AttendanceOverrides() {
  const navigate = useNavigate();
  const [overrides, setOverrides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverrides();
  }, []);

  const fetchOverrides = async () => {
    setLoading(true);
    try {
      const data = await attendanceAPI.listOverrides();
      setOverrides(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id, status) => {
    if (!window.confirm(`Are you sure you want to ${status === 'approved' ? 'approve' : 'reject'} this request?`)) return;
    try {
      await attendanceAPI.reviewOverride(id, status);
      alert(`Request ${status} successfully.`);
      fetchOverrides();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading override requests...</div>;

  const token = localStorage.getItem('token');
  let role = '';
  if (token) {
    try {
      role = jwtDecode(token).role;
    } catch {}
  }
  const backTab = role === 'hod' ? 'hod_batches' : role === 'admin' ? 'admin' : 'oversight';

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate(`/dashboard?tab=${backTab}`)}>← Back</button>
      <h2>Attendance Override Requests</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
        Faculty members requesting to mark attendance for slots not in their timetable need your approval.
      </p>

      {overrides.length === 0 ? (
        <div style={{
          background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px',
          padding: '1.5rem', textAlign: 'center', color: '#166534'
        }}>
          No pending override requests. 🎉
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {overrides.map(o => (
            <div key={o.id} style={{
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px',
              padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1.05rem', color: '#1e293b' }}>
                    {o.faculty_name}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                    {o.course_name} ({o.course_code}) — {o.class_name}
                  </div>
                </div>
                <div style={{
                  background: '#fef3c7', color: '#92400e', padding: '0.2rem 0.6rem',
                  borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase'
                }}>
                  Pending
                </div>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.5rem', marginTop: '0.75rem', fontSize: '0.9rem', color: '#334155'
              }}>
                <div><strong>Date:</strong> {new Date(o.requested_date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</div>
                <div><strong>Period:</strong> {o.requested_period}</div>
                <div><strong>Requested:</strong> {new Date(o.created_at).toLocaleString()}</div>
              </div>

              {o.reason && (
                <div style={{
                  background: '#f8fafc', borderRadius: '6px', padding: '0.5rem 0.75rem',
                  marginTop: '0.75rem', fontSize: '0.9rem', color: '#475569'
                }}>
                  <strong>Reason:</strong> {o.reason}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button onClick={() => handleReview(o.id, 'rejected')}
                  style={{
                    padding: '0.4rem 1rem', background: '#fee2e2', color: '#991b1b',
                    border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontWeight: '600'
                  }}>
                  Reject
                </button>
                <button onClick={() => handleReview(o.id, 'approved')}
                  style={{
                    padding: '0.4rem 1rem', background: '#10b981', color: '#fff',
                    border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600'
                  }}>
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AttendanceOverrides;
