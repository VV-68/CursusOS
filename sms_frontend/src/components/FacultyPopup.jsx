import { useState } from 'react';

function FacultyPopup({ name, designation, email, phone }) {
  const [show, setShow] = useState(false);

  return (
    <div 
      style={{ position: 'relative', display: 'inline-block' }} 
      onMouseEnter={() => setShow(true)} 
      onMouseLeave={() => setShow(false)}
    >
      <span style={{ color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}>
        {name}
      </span>
      {show && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '8px',
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          zIndex: 100,
          width: 'max-content',
          minWidth: '200px',
          textAlign: 'left'
        }}>
          <div style={{ fontWeight: '600', fontSize: '1rem', color: '#1e293b' }}>{name}</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '8px' }}>{designation || 'Faculty'}</div>
          {email && (
            <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>✉️</span> <a href={`mailto:${email}`} style={{ color: '#007bff', textDecoration: 'none' }}>{email}</a>
            </div>
          )}
          {phone && (
            <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              <span>📞</span> {phone}
            </div>
          )}
          
          {/* Triangle pointer */}
          <div style={{
            position: 'absolute',
            bottom: '-6px',
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: '12px',
            height: '12px',
            background: '#fff',
            borderRight: '1px solid #e2e8f0',
            borderBottom: '1px solid #e2e8f0'
          }} />
        </div>
      )}
    </div>
  );
}

export default FacultyPopup;
