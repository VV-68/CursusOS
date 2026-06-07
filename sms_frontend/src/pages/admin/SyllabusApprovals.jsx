import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { syllabusAPI } from '../../services/api';
import '../admin/CreateDepartment.css';

function SyllabusApprovals() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [pendingSyllabuses, setPendingSyllabuses] = useState([]);
  const [pendingCourseGroups, setPendingCourseGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ status: '', remarks: '' });
  const [reviewing, setReviewing] = useState(false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [reqData, syllData, coursesData] = await Promise.all([
        syllabusAPI.listRequests(filter || undefined).catch(e => { console.error('Req error', e); return []; }),
        syllabusAPI.getSyllabusesByStatus(filter || 'all').catch(e => { console.error('Syll error', e); return []; }),
        syllabusAPI.getCourseGroupsByStatus(filter || 'all').catch(e => { console.error('Courses error', e); return []; })
      ]);
      setRequests(reqData);
      setPendingSyllabuses(syllData);
      setPendingCourseGroups(coursesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const openReview = (req, action) => {
    setReviewModal(req);
    setReviewForm({ status: action, remarks: '' });
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!reviewModal) return;
    setReviewing(true);
    try {
      await syllabusAPI.reviewRequest(reviewModal.id, reviewForm.status, reviewForm.remarks);
      setReviewModal(null);
      loadRequests();
    } catch (err) {
      alert(err.message);
    } finally {
      setReviewing(false);
    }
  };

  const statusColors = {
    pending: { bg: '#fef3c7', color: '#d97706', cardBg: 'rgba(217, 119, 6, 0.06)' },
    approved: { bg: '#dcfce7', color: '#16a34a', cardBg: 'rgba(22, 163, 74, 0.06)' },
    rejected: { bg: '#fef2f2', color: '#dc2626', cardBg: 'rgba(220, 38, 38, 0.06)' }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="dept-wizard" style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }}
        onClick={() => navigate('/dashboard?tab=admin_batches_syl')}>← Back</button>

      <div className="dept-wizard__header">
        <h1>📑 Syllabus Assignment Approvals</h1>
        {pendingCount > 0 && (
          <span style={{
            background: '#fef3c7', color: '#d97706', padding: '0.4rem 1rem',
            borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700
          }}>
            {pendingCount} pending
          </span>
        )}
      </div>

      {error && (
        <div className="dept-alert dept-alert--error">
          <span className="dept-alert__icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Filter bar */}
      <div className="dept-card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}>Filter:</span>
          {['pending', 'approved', 'rejected', ''].map(s => (
            <button key={s || 'all'} onClick={() => setFilter(s)}
              style={{
                padding: '0.35rem 0.85rem', borderRadius: '20px', border: '1px solid',
                cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                background: filter === s ? 'var(--primary)' : '#fff',
                color: filter === s ? '#fff' : '#64748b',
                borderColor: filter === s ? 'var(--primary)' : '#e2e8f0',
                transition: 'all 0.2s'
              }}>
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Pending Syllabuses ── */}
      {pendingSyllabuses.length > 0 && (
        <div className="dept-card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #8b5cf6' }}>
          <div className="dept-card__title" style={{ color: '#8b5cf6' }}><span className="icon">🆕</span> {filter === 'approved' ? 'Approved' : filter === 'rejected' ? 'Rejected' : 'New'} Syllabus Approvals</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pendingSyllabuses.map(s => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1rem', border: '1px solid var(--dm-table-border, #e2e8f0)', borderRadius: '8px', background: s.is_rejected ? statusColors.rejected.cardBg : s.is_active ? statusColors.approved.cardBg : statusColors.pending.cardBg }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--dm-text, #1e293b)', fontSize: '1.05rem', marginBottom: '0.2rem' }}>{s.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--dm-text-muted, #64748b)' }}>
                    Department: <strong style={{ color: 'var(--dm-text-sub, #475569)' }}>{s.dept_name} ({s.dept_code})</strong><br />
                    Requested by: <strong style={{ color: 'var(--dm-text, #1e293b)' }}>{s.created_by_name}</strong> on {new Date(s.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {!s.is_active && !s.is_rejected && (
                    <button className="dept-btn dept-btn--success" style={{ padding: '0.4rem 1rem' }}
                      onClick={async () => {
                        if (!window.confirm(`Approve syllabus "${s.name}"?`)) return;
                        try {
                          await syllabusAPI.update(s.id, { is_active: true, is_rejected: false });
                          loadRequests();
                        } catch (e) { alert(e.message); }
                      }}>✅ Approve Syllabus</button>
                  )}
                  {!s.is_active && !s.is_rejected && (
                    <button className="dept-btn dept-btn--secondary" style={{ padding: '0.4rem 1rem', color: '#dc2626' }}
                      onClick={async () => {
                        if (!window.confirm(`Reject syllabus "${s.name}"?`)) return;
                        try {
                          await syllabusAPI.update(s.id, { is_rejected: true, is_active: false });
                          loadRequests();
                        } catch (e) { alert(e.message); }
                      }}>❌ Reject</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Pending Course Groups ── */}
      {pendingCourseGroups.length > 0 && (
        <div className="dept-card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #ec4899' }}>
          <div className="dept-card__title" style={{ color: '#ec4899' }}><span className="icon">📚</span> {filter === 'approved' ? 'Approved' : filter === 'rejected' ? 'Rejected' : 'Pending'} Course Configurations</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pendingCourseGroups.map((g, i) => (
              <div key={`cg-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1rem', border: '1px solid var(--dm-table-border, #e2e8f0)', borderRadius: '8px', background: statusColors[filter || 'pending']?.cardBg || 'rgba(148, 163, 184, 0.05)' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--dm-text, #1e293b)', fontSize: '1.05rem', marginBottom: '0.2rem' }}>
                    {g.syllabus_name || 'Default Syllabus'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--dm-text-muted, #64748b)' }}>
                    Department: <strong style={{ color: 'var(--dm-text-sub, #475569)' }}>{g.dept_name} ({g.dept_code})</strong>
                  </div>
                </div>
                <button className="dept-btn dept-btn--primary" style={{ padding: '0.4rem 1rem' }}
                  onClick={() => navigate(`/admin/departments/${g.dept_id}/edit${g.syllabus_id ? `?syllabus_id=${g.syllabus_id}` : ''}`)}>
                  {filter === 'pending' ? '🔍 Review & Approve Courses' : '🔍 View Courses'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Requests list */}
      <div className="dept-card">
        <div className="dept-card__title"><span className="icon">📨</span> Assignment Requests</div>
        {loading ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '1.5rem' }}>Loading...</p>
        ) : requests.length === 0 ? (
          <div className="dept-alert dept-alert--info">
            <span className="dept-alert__icon">ℹ️</span>
            <span>No {filter || ''} requests found.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {requests.map(r => (
              <div key={r.id} style={{
                border: '1px solid var(--dm-table-border, #e2e8f0)', borderRadius: '12px', padding: '1.25rem',
                background: statusColors[r.status]?.cardBg || 'rgba(148, 163, 184, 0.05)',
                borderLeft: `4px solid ${statusColors[r.status]?.color || '#e2e8f0'}`,
                transition: 'all 0.2s'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--dm-text, #1e293b)' }}>
                        {r.batch_name} {r.batch_section}
                      </span>
                      <span style={{
                        padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600,
                        background: 'var(--dm-table-hover, #e0e7ff)', color: 'var(--dm-accent-glow, #3730a3)'
                      }}>
                        {r.dept_name} ({r.dept_code})
                      </span>
                      <span style={{
                        padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600,
                        background: statusColors[r.status]?.bg,
                        color: statusColors[r.status]?.color
                      }}>
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--dm-text-muted, #475569)', lineHeight: 1.6 }}>
                      <span>🔄 <strong>Current:</strong> {r.current_syllabus_name || <em style={{ color: 'var(--dm-text-muted, #94a3b8)' }}>None</em>}</span>
                      <span style={{ margin: '0 0.75rem', color: 'var(--dm-table-border, #cbd5e1)' }}>→</span>
                      <span>🆕 <strong>Requested:</strong> <span style={{ color: 'var(--dm-accent-glow, #1d4ed8)', fontWeight: 600 }}>{r.syllabus_name}</span></span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.35rem' }}>
                      Requested by <strong>{r.requested_by_name}</strong> on {new Date(r.requested_at).toLocaleDateString()}
                      {r.remarks && <span> — <em>"{r.remarks}"</em></span>}
                    </div>
                    {r.reviewed_by_name && (
                      <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                        Reviewed by <strong>{r.reviewed_by_name}</strong> on {new Date(r.reviewed_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {r.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                      <button className="dept-btn dept-btn--success" style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
                        onClick={() => openReview(r, 'approved')}>✅ Approve</button>
                      <button className="dept-btn dept-btn--secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem', color: '#dc2626' }}
                        onClick={() => openReview(r, 'rejected')}>❌ Reject</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── REVIEW MODAL ── */}
      {reviewModal && (
        <div className="json-upload-overlay" onClick={(e) => e.target === e.currentTarget && setReviewModal(null)}>
          <div className="json-upload-modal" style={{ maxWidth: '480px' }}>
            <div className="json-upload-modal__header">
              <h2>{reviewForm.status === 'approved' ? '✅ Approve' : '❌ Reject'} Request</h2>
              <button type="button" className="json-upload-modal__close" onClick={() => setReviewModal(null)}>×</button>
            </div>
            <form onSubmit={handleReview} className="json-upload-modal__body">
              <p style={{ margin: '0 0 0.5rem', color: '#475569' }}>
                <strong>{reviewModal.batch_name} {reviewModal.batch_section}</strong> → <strong style={{ color: '#1d4ed8' }}>{reviewModal.syllabus_name}</strong>
              </p>
              <p style={{ margin: '0 0 1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                Requested by {reviewModal.requested_by_name}
              </p>

              {reviewForm.status === 'approved' && (
                <div className="dept-alert dept-alert--info" style={{ marginBottom: '1rem' }}>
                  <span className="dept-alert__icon">ℹ️</span>
                  <span>Approving will immediately update the batch's syllabus.</span>
                </div>
              )}

              <div className="dept-field">
                <label>Remarks (Optional)</label>
                <textarea placeholder="Add remarks..." value={reviewForm.remarks}
                  onChange={e => setReviewForm({ ...reviewForm, remarks: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '60px', resize: 'vertical' }}
                />
              </div>
              <div className="json-upload-modal__footer" style={{ padding: 0, border: 'none', marginTop: '1rem' }}>
                <button type="button" className="dept-btn dept-btn--secondary" onClick={() => setReviewModal(null)}>Cancel</button>
                <button type="submit" className="dept-btn dept-btn--success" disabled={reviewing}
                  style={reviewForm.status === 'rejected' ? { background: '#dc2626' } : {}}>
                  {reviewing ? 'Processing…' : reviewForm.status === 'approved' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SyllabusApprovals;
