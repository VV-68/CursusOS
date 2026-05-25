import React from 'react';

function Logo({ size = 120, showText = true, textColor = '#fff', className = '' }) {
  return (
    <div className={`logo-container ${className}`} style={{ display: 'flex', alignItems: 'center', gap: `${size / 8}px`, justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 10px rgba(0, 123, 255, 0.3))' }}>
        <defs>
          <linearGradient id={`grad-c-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d2ff" />
            <stop offset="50%" stopColor="#007bff" />
            <stop offset="100%" stopColor="#023e8a" />
          </linearGradient>
          <style>
            {`
              @keyframes rotateCube {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </defs>
        {/* Outer C Shape */}
        <path 
          d="M 50 5 L 89 27.5 L 72 37.5 L 50 25 L 28 37.5 L 28 62.5 L 50 75 L 72 62.5 L 89 72.5 L 50 95 L 11 72.5 L 11 27.5 Z" 
          fill={`url(#grad-c-${size})`} 
        />
        {/* Rotating Cube in the Center */}
        <g style={{ transformOrigin: '50px 51.5px', animation: 'rotateCube 6s infinite linear' }}>
          <polygon points="50,40 60,45.7 50,51.5 40,45.7" fill="#48cae4"/>
          <polygon points="40,45.7 50,51.5 50,63 40,57.3" fill="#0096c7"/>
          <polygon points="60,45.7 50,51.5 50,63 60,57.3" fill="#023e8a"/>
        </g>
      </svg>
      {showText && (
        <div style={{ fontSize: `${size / 25}rem`, fontWeight: 400, letterSpacing: '-1px', margin: 0, color: textColor, fontFamily: "'Eurostile Extended', 'Eurostile', 'Michroma', sans-serif" }}>
          cursus<span style={{ color: '#007bff' }}>OS</span>
        </div>
      )}
    </div>
  );
}

export default Logo;
