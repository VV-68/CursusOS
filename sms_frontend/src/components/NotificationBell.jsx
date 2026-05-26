import { useState, useEffect, useRef, useCallback } from 'react';
import { notificationAPI } from '../services/api';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const bellRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await notificationAPI.getMine();
      setNotifications(data || []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleClearAll = async () => {
    setClearing(true);
    try {
      await notificationAPI.clearAll();
      setNotifications([]);
    } catch { }
    setClearing(false);
  };

  const handleDismiss = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationAPI.deleteOne(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch { }
  };

  const count = notifications.length;

  return (
    <div ref={bellRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Notifications"
        style={{
          background: open ? 'rgba(255,255,255,0.2)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          padding: '0.35rem',
          borderRadius: '8px',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ecf0f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {count > 0 && (
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-4px',
            background: '#ef4444',
            color: '#fff',
            fontSize: '0.6rem',
            fontWeight: 700,
            minWidth: '17px',
            height: '17px',
            borderRadius: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            boxShadow: '0 2px 6px rgba(239,68,68,0.4)',
            animation: 'notifPulse 2s ease-in-out infinite',
          }}>
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          right: '-8px',
          width: '360px',
          maxHeight: '460px',
          background: '#ffffff',
          borderRadius: '14px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column',
          animation: 'notifSlideDown 0.2s ease-out',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.85rem 1.1rem',
            borderBottom: '1px solid #f1f5f9',
            background: '#fafbfd',
          }}>
            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1e293b' }}>
              Notifications
              {count > 0 && (
                <span style={{
                  marginLeft: '0.5rem',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '10px',
                }}>{count}</span>
              )}
            </span>
            {count > 0 && (
              <button
                onClick={handleClearAll}
                disabled={clearing}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '6px',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.target.style.background = '#fef2f2'}
                onMouseLeave={e => e.target.style.background = 'none'}
              >
                {clearing ? 'Clearing…' : 'Clear all'}
              </button>
            )}
          </div>

          {/* List */}
          <div style={{
            overflowY: 'auto',
            flex: 1,
            maxHeight: '380px',
          }}>
            {count === 0 ? (
              <div style={{
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                color: '#94a3b8',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔔</div>
                <p style={{ fontSize: '0.88rem', fontWeight: 500 }}>No notifications yet</p>
                <p style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>You're all caught up!</p>
              </div>
            ) : (
              notifications.map((n, i) => (
                <div
                  key={n.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.7rem',
                    padding: '0.85rem 1.1rem',
                    borderBottom: i < notifications.length - 1 ? '1px solid #f8fafc' : 'none',
                    transition: 'background 0.15s',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Avatar dot */}
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary), #0056b3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}>
                    <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
                      {(n.creator_name || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: '0.84rem',
                      color: '#334155',
                      lineHeight: 1.45,
                      margin: 0,
                      wordBreak: 'break-word',
                    }}>
                      {n.creator_name && (
                        <strong style={{ color: '#1e293b' }}>{n.creator_name}: </strong>
                      )}
                      {n.message}
                    </p>
                    <time style={{
                      fontSize: '0.7rem',
                      color: '#94a3b8',
                      marginTop: '0.2rem',
                      display: 'block',
                    }}>
                      {timeAgo(n.created_at)}
                    </time>
                  </div>

                  {/* Dismiss */}
                  <button
                    onClick={(e) => handleDismiss(n.id, e)}
                    title="Dismiss"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#cbd5e1',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      padding: '0.15rem',
                      borderRadius: '4px',
                      lineHeight: 1,
                      flexShrink: 0,
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => e.target.style.color = '#94a3b8'}
                    onMouseLeave={e => e.target.style.color = '#cbd5e1'}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Keyframe animations (injected once) */}
      <style>{`
        @keyframes notifPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.12); }
        }
        @keyframes notifSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default NotificationBell;
