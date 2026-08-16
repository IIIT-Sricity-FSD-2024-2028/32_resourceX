import React from 'react';

export default function Sidebar({ navItems, activeView, onNavigate, userName, userRole, onLogout }) {
  return (
    <div className="sidebar">
      <div className="logo-container">
        <div className="logo-icon">R</div>
        <span className="logo-text">ResourceX</span>
      </div>
      <ul className="nav-menu">
        {navItems.map(item => (
          <li
            key={item.id}
            className={`nav-item${activeView === item.id ? ' active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            {item.label}
          </li>
        ))}
      </ul>
      <div className="user-profile-widget">
        <div className="user-avatar">
          <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#64748b', display: 'block', textAlign: 'center', lineHeight: '36px' }}>person</span>
        </div>
        <div className="user-info">
          <span className="user-name">{userName}</span>
          <span className="user-role">{userRole}</span>
        </div>
      </div>
      <div style={{ padding: '1rem 1.5rem 0' }}>
        <button className="btn-secondary" style={{ width: '100%', marginTop: '0.75rem', fontSize: '0.875rem' }} onClick={onLogout}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '6px', verticalAlign: 'middle' }}>logout</span>
          Logout
        </button>
      </div>
    </div>
  );
}
