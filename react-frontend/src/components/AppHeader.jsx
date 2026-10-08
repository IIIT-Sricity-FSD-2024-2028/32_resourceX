import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logoutUser } from '../services/auth';

/**
 * Exact replica of the original AppHeader component from app-header.js
 */
export default function AppHeader({ userName, userRole, onLogout }) {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const name = userName || currentUser?.name || 'yashwath';
  const role = userRole || currentUser?.role || 'Administrator';

  const handleLogout = (e) => {
    e.preventDefault();
    logoutUser();
    if (onLogout) {
      onLogout();
    } else {
      navigate('/login');
    }
  };

  return (
    <header className="top-header">
      {/* Search bar matching original HTML */}
      <div className="search-bar">
        <span className="search-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
        </span>
        <input
          type="text"
          placeholder="Search..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
        {searchValue && (
          <span
            className="clear-btn"
            style={{ display: 'flex' }}
            onClick={() => setSearchValue('')}
          >
            ✕
          </span>
        )}
      </div>

      <div className="header-actions">
        {/* Notifications Dropdown */}
        <div className="dropdown-container">
          <button
            type="button"
            className="icon-btn notification-btn"
            title="Notifications"
            onClick={() => {
              setShowNotifMenu(!showNotifMenu);
              setShowProfileMenu(false);
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--text-main)' }}>
              notifications
            </span>
            <span className="notification-badge" id="notifBadge">0</span>
          </button>

          {showNotifMenu && (
            <div className="dropdown-menu notifications-dropdown" style={{ display: 'block', opacity: 1, visibility: 'visible', transform: 'none' }}>
              <div className="dropdown-header">Notifications</div>
              <div className="notification-list" style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b' }}>
                No unread notifications.
              </div>
              <div
                className="dropdown-footer"
                style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--primary-color)', fontWeight: 600, cursor: 'pointer', borderTop: '1px solid var(--border-color)', background: '#f8fafc' }}
                onClick={() => setShowNotifMenu(false)}
              >
                Mark all as read
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="dropdown-container">
          <button
            type="button"
            className="profile-btn"
            title="Profile"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifMenu(false);
            }}
          >
            <div className="user-avatar-small">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f38ae&color=fff`}
                alt={name}
              />
            </div>
          </button>

          {showProfileMenu && (
            <div
              className="dropdown-menu profile-dropdown"
              style={{ display: 'block', opacity: 1, visibility: 'visible', transform: 'none' }}
            >
              <div className="dropdown-header" style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '0.5rem', textAlign: 'left' }}>
                <strong>{name}</strong>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{role === 'System Admin' ? 'Administrator' : role}</div>
              </div>
              <div
                className="dropdown-item"
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/profile');
                }}
              >
                <span className="material-symbols-outlined dropdown-icon">person</span> My Profile
              </div>
              <div
                className="dropdown-item"
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/profile');
                }}
              >
                <span className="material-symbols-outlined dropdown-icon">settings</span> Settings
              </div>
              <div className="dropdown-divider" />
              <div
                className="dropdown-item text-danger"
                onClick={handleLogout}
              >
                <span className="material-symbols-outlined dropdown-icon">logout</span> Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
