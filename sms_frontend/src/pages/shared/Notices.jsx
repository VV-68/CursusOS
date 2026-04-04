import { useState, useEffect } from 'react';
import { noticeAPI } from '../../services/api';

function Notices() {
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const data = await noticeAPI.getAll();
      setNotices(data);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Notice Board</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' }}>
        {notices.length === 0 ? (
          <p>No notices at this time.</p>
        ) : (
          notices.map(n => (
            <div key={n.id} style={{
              background: '#fcfcfc',
              border: n.is_pinned ? '2px solid #f0ad4e' : '1px solid #e0e0e0',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: '#333' }}>
                  {n.is_pinned && '📌 '}{n.title}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#888' }}>
                  {new Date(n.created_at).toLocaleDateString()}
                </span>
              </div>
              <p style={{ margin: '0 0 1rem 0', whiteSpace: 'pre-wrap', color: '#555' }}>
                {n.body}
              </p>
              <div style={{ fontSize: '0.85rem', color: '#777', fontStyle: 'italic' }}>
                Posted by: {n.author_name}
                {n.scope && n.scope !== 'global' && ` | Scope: ${n.scope}`}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Notices;
