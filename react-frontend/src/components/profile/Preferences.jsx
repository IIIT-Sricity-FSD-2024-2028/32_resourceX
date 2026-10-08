import React from 'react';

export default function Preferences({ notificationsEnabled, onToggleNotifications }) {
  return (
    <div style={{ padding: '0 2rem 2rem' }}>
      <h2 style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 600 }}>Preferences & Settings</h2>
      
      <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0' }}>
        <div className="setting-info">
          <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>Push Notifications</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Receive alerts for approvals, maintenance, and updates.</p>
        </div>
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={!!notificationsEnabled} 
            onChange={(e) => onToggleNotifications(e.target.checked)}
          />
          <span className="slider"></span>
        </label>
      </div>
    </div>
  );
}
