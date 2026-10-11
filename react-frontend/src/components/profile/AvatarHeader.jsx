import React from 'react';

export default function AvatarHeader({ name, role }) {
  const displayName = name || 'yaswanth kumar';
  const displayRole = role || 'Staff';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'YK';

  return (
    <div
      className="profile-header"
      style={{
        background: 'linear-gradient(135deg, var(--primary-color, #0F386E) 0%, #1e40af 100%)',
        padding: '3rem 2rem',
        color: 'white',
        textAlign: 'center',
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px'
      }}
    >
      <div
        className="profile-avatar-large"
        style={{
          width: '96px',
          height: '96px',
          borderRadius: '50%',
          border: '4px solid white',
          margin: '0 auto 1rem',
          backgroundColor: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary-color, #0F386E)',
          fontSize: '2rem',
          fontWeight: 700,
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
        }}
      >
        {initials}
      </div>
      <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{displayName}</h1>
      <p style={{ margin: '0.25rem 0 0', opacity: 0.85, fontSize: '0.875rem' }}>{displayRole}</p>
    </div>
  );
}

