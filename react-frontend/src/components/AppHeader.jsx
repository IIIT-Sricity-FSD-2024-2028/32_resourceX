import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchNotifications, markNotificationRead } from '../services/notifications';
import { highlightRecord, resolveNotificationDestination } from './common/notificationFocus';

/**
 * Exact replica of the original AppHeader component from app-header.js
 */
export default function AppHeader() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const name = user?.name || 'yashwath';
  const role = user?.role || 'Administrator';

  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const loadNotifications = useCallback(async () => {
    try {
      const list = await fetchNotifications();
      setNotifications(Array.isArray(list) ? list : []);
    } catch {
      // Notifications are best-effort; ignore failures (e.g. expired session)
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(loadNotifications, 15000);
    return () => clearInterval(timer);
  }, [loadNotifications]);

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setShowNotifMenu(false);
    await Promise.all(unread.map((n) => markNotificationRead(n.id).catch(() => null)));
  };

  const handleMarkRead = async (n) => {
    if (n.read) return;
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    markNotificationRead(n.id).catch(() => null);
  };

  // Open the page (and card, where there is one) for the record the notification is about
  const handleOpenNotification = (n) => {
    handleMarkRead(n);
    const dest = resolveNotificationDestination(user?.role, n);
    if (!dest) return;
    setShowNotifMenu(false);
    navigate(dest.path, { state: { notificationFocus: { type: dest.type, id: dest.id, tab: dest.tab } } });
    highlightRecord(dest.id);
  };

  const handleLogout = (e) => {
    e.preventDefault();

    logout();
    navigate('/login');

  };

  return (
    <header className="top-header">
      {/* Global search removed: each page provides its own search/filters */}
      <div style={{ flex: 1 }} />

      <div className="header-actions">
        {/* Notifications Dropdown */}
        <div className="dropdown-container">
          <button
            type="button"
            className="icon-btn notification-btn"
            title="Notifications"
            onClick={() => {
              if (!showNotifMenu) loadNotifications();
              setShowNotifMenu(!showNotifMenu);
              setShowProfileMenu(false);
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--text-main)' }}>
              notifications
            </span>
            {unreadCount > 0 && (
              <span className="notification-badge" id="notifBadge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>

          {showNotifMenu && (
            <div className="dropdown-menu notifications-dropdown" style={{ display: 'block', opacity: 1, visibility: 'visible', transform: 'none' }}>
              <div className="dropdown-header">Notifications</div>
              <div className="notification-list" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b' }}>No notifications.</div>
                ) : (
                  notifications.map((n) => {
                    const linked = Boolean(resolveNotificationDestination(user?.role, n));
                    return (
                      <div
                        key={n.id}
                        className={`notification-item${linked ? ' linked' : ''}`}
                        role={linked ? 'link' : undefined}
                        tabIndex={0}
                        title={linked ? 'Open' : undefined}
                        onClick={() => handleOpenNotification(n)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleOpenNotification(n);
                        }}
                        style={{
                          padding: '0.75rem 1rem',
                          borderBottom: '1px solid var(--border-color)',
                          cursor: 'pointer',
                          background: n.read ? 'transparent' : '#eff6ff'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: n.read ? 500 : 700, color: 'var(--text-main)' }}>
                              {n.title}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>{n.description}</div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem' }}>{n.time}</div>
                          </div>
                          {linked && (
                            <span className="material-symbols-outlined notification-go" aria-hidden="true">chevron_right</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div
                className="dropdown-footer"
                style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--primary-color)', fontWeight: 600, cursor: 'pointer', borderTop: '1px solid var(--border-color)', background: '#f8fafc' }}
                onClick={handleMarkAllRead}
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
