import React from 'react';

/**
 * Exact replica of the Stats Row from admin.html
 */
export default function AdminStatsCards({ totalUsers = 0, totalDepts = 0, totalRoles = 5 }) {
  return (
    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
      <div className="stat-card">
        <div className="stat-title">Total Users</div>
        <div className="stat-value-row">
          <div className="stat-value" id="dash-admin-users">{totalUsers}</div>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '1.5rem', color: '#0f38ae' }}
          >
            group
          </span>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-title">Departments</div>
        <div className="stat-value-row">
          <div className="stat-value" id="dash-admin-depts">{totalDepts}</div>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '1.5rem', color: '#0369a1' }}
          >
            domain
          </span>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-title">Active Roles</div>
        <div className="stat-value-row">
          <div className="stat-value" id="dash-admin-roles">{totalRoles}</div>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '1.5rem', color: '#7c3aed' }}
          >
            admin_panel_settings
          </span>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-title" style={{ color: '#16a34a' }}>System Health</div>
        <div className="stat-value-row">
          <div className="stat-value" style={{ color: '#16a34a' }}>100%</div>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '1.5rem', color: '#16a34a' }}
          >
            monitor_heart
          </span>
        </div>
      </div>
    </div>
  );
}
