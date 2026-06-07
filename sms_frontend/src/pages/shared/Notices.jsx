import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { noticeAPI, getMe } from '../../services/api';
import '../admin/CreateDepartment.css';

function audienceDisplay(notice) {
  if (notice.audience_label) return notice.audience_label;
  if (notice.scope === 'global') return 'All users';
  if (notice.scope === 'dept') return 'Department';
  if (notice.scope === 'class') return 'Class';
  return '';
}

function Notices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(null);
  const [role, setRole] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const canPost = ['admin', 'hod'].includes(role);

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [data, me] = await Promise.all([noticeAPI.getAll(), getMe()]);
      setNotices(data);
      setUserId(me.id);
      setRole(me.role);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        setRole(jwtDecode(token).role);
      } catch {
        /* ignore */
      }
    }
    fetchNotices();
  }, [fetchNotices]);

  const handleDelete = async (noticeId) => {
    if (!window.confirm('Delete this notice? This cannot be undone.')) return;
    setDeletingId(noticeId);
    try {
      await noticeAPI.remove(noticeId);
      setNotices(prev => prev.filter(n => n.id !== noticeId));
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="dept-wizard" style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem' }}>
      <div className="dept-wizard__header">
        <h1>📋 Notice Board</h1>
        <div className="dept-wizard__header-actions">
          {canPost && (
            <Link to="/notices/post" className="dept-btn dept-btn--primary">+ Post Notice</Link>
          )}
          <Link to={role === 'admin' ? '/dashboard?tab=admin_inst_dept' : '/dashboard'} className="dept-btn dept-btn--secondary">← Dashboard</Link>
        </div>
      </div>

      {error && (
        <div className="dept-alert dept-alert--error">
          <span className="dept-alert__icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#64748b' }}>Loading notices…</p>
      ) : notices.length === 0 ? (
        <div className="dept-card">
          <p style={{ color: '#64748b', margin: 0 }}>No notices at this time.</p>
          {canPost && (
            <Link to="/notices/post" className="dept-btn dept-btn--outline" style={{ marginTop: '1rem', display: 'inline-block' }}>
              Post the first notice
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notices.map(n => {
            const isAuthor = userId && n.posted_by === userId;
            return (
              <article
                key={n.id}
                className="dept-card"
                style={{
                  borderLeft: n.is_pinned ? '4px solid #f59e0b' : '4px solid #e2e8f0'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b' }}>
                    {n.is_pinned && <span title="Pinned">📌 </span>}
                    {n.title}
                  </h2>
                  <time style={{ fontSize: '.8rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {new Date(n.created_at).toLocaleString()}
                  </time>
                </div>

                <p style={{ margin: '0.75rem 0', whiteSpace: 'pre-wrap', color: '#475569', lineHeight: 1.55 }}>
                  {n.body}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ fontSize: '.85rem', color: '#64748b' }}>
                    <span>Posted by <strong>{n.author_name}</strong></span>
                    {audienceDisplay(n) && (
                      <span style={{ marginLeft: '0.5rem' }}>· For: {audienceDisplay(n)}</span>
                    )}
                  </div>
                  {isAuthor && canPost && (
                    <button
                      type="button"
                      className="dept-btn dept-btn--secondary"
                      style={{ padding: '0.3rem 0.75rem', fontSize: '.8rem', color: '#dc2626' }}
                      disabled={deletingId === n.id}
                      onClick={() => handleDelete(n.id)}
                    >
                      {deletingId === n.id ? 'Deleting…' : 'Delete'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Notices;
