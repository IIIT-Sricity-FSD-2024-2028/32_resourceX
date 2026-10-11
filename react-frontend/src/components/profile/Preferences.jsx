import React from 'react';

export default function Preferences({ notificationsEnabled, onToggleNotifications }) {
  return (
    <div style={{ padding: '0 2rem 1.5rem' }}>
      <style>{`
        .toggle-switch-prof {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 24px;
        }
        .toggle-switch-prof input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider-prof {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #cbd5e1;
          transition: .3s;
          border-radius: 24px;
        }
        .slider-prof:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .3s;
          border-radius: 50%;
        }
        .toggle-switch-prof input:checked + .slider-prof {
          background-color: var(--primary-color, #0F386E);
        }
        .toggle-switch-prof input:checked + .slider-prof:before {
          transform: translateX(24px);
        }
      `}</style>

      <h2 style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 700, margin: '1rem 0 0' }}>
        Preferences & Settings
      </h2>
      
      <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 0', borderBottom: 'none' }}>
        <div className="setting-info">
          <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>Push Notifications</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Receive alerts for approvals, maintenance, and updates.</p>
        </div>
        <label className="toggle-switch-prof">
          <input 
            type="checkbox" 
            checked={!!notificationsEnabled} 
            onChange={(e) => onToggleNotifications(e.target.checked)}
          />
          <span className="slider-prof"></span>
        </label>
      </div>
    </div>
  );
}

