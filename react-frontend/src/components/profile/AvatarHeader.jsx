import React from 'react';

export default function AvatarHeader({ name, role }) {
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=fff&color=0f38ae`;

  return (
    <div className="profile-header" style={{ background: 'linear-gradient(135deg, var(--primary-color) 0%, #1e40af 100%)', padding: '3rem 2rem', color: 'white', textAlign: 'center', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
      <div className="profile-avatar-large" style={{ width: '96px', height: '96px', borderRadius: '50%', border: '4px solid white', margin: '0 auto 1rem', overflow: 'hidden', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>{name || 'User Name'}</h1>
      <p style={{ margin: '0.25rem 0 0', opacity: 0.8, fontSize: '0.875rem' }}>{role || 'Role'}</p>
    </div>
  );
}
