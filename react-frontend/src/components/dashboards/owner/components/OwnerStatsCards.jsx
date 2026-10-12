import React from 'react';

/**
 * Exact replica of the Stats Row from owner.html
 */
export default function OwnerStatsCards({
  activeOrgs = 0,
  pendingOrgs = 0,
  totalRevenue = 0,
  totalEmployees = 0
}) {
  return (
    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
      <div className="stat-card">
        <div className="stat-title">Active Organizations</div>
        <div className="stat-value-row">
          <div className="stat-value" id="statActiveOrgs">{activeOrgs}</div>
          <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: 'var(--primary-color)' }}>
            corporate_fare
          </span>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-title">Pending Registrations</div>
        <div className="stat-value-row">
          <div className="stat-value" id="statPendingOrgs">{pendingOrgs}</div>
          <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: '#92400e' }}>
            pending
          </span>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-title">Total Revenue</div>
        <div className="stat-value-row">
          <div className="stat-value" id="statRevenue">${totalRevenue.toLocaleString()}</div>
          <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: '#166534' }}>
            payments
          </span>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-title">Platform Employees</div>
        <div className="stat-value-row">
          <div className="stat-value" id="statEmployees">{totalEmployees}</div>
          <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: '#1d4ed8' }}>
            group
          </span>
        </div>
      </div>
    </div>
  );
}
