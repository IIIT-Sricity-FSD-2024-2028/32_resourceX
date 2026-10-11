import React from 'react';

/**
 * Summary metrics header matching staff.html stats row
 */
export default function StaffStatsHeader({ stats = {} }) {
  const {
    pendingAllocations = 0,
    totalResources = 0,
    activeMaintenance = 0,
    pendingReturns = 0
  } = stats;

  return (
    <div className="staff-stats-grid">
      <div className="staff-stat-card">
        <div className="staff-stat-title">Pending Allocations</div>
        <div className="staff-stat-value-row">
          <div className="staff-stat-value" style={{ color: '#0F386E' }}>
            {pendingAllocations}
          </div>
          <span className="material-symbols-outlined staff-stat-icon" style={{ color: '#0F386E' }}>
            sync_alt
          </span>
        </div>
      </div>

      <div className="staff-stat-card">
        <div className="staff-stat-title">Total Resources</div>
        <div className="staff-stat-value-row">
          <div className="staff-stat-value" style={{ color: '#0F386E' }}>
            {totalResources}
          </div>
          <span className="material-symbols-outlined staff-stat-icon" style={{ color: '#64748b' }}>
            inventory_2
          </span>
        </div>
      </div>

      <div className="staff-stat-card">
        <div className="staff-stat-title" style={{ color: '#d97706' }}>
          Maintenance
        </div>
        <div className="staff-stat-value-row">
          <div className="staff-stat-value" style={{ color: '#d97706' }}>
            {activeMaintenance}
          </div>
          <span className="material-symbols-outlined staff-stat-icon" style={{ color: '#d97706' }}>
            build
          </span>
        </div>
      </div>

      <div className="staff-stat-card">
        <div className="staff-stat-title" style={{ color: '#8b5cf6' }}>
          Returns Pending
        </div>
        <div className="staff-stat-value-row">
          <div className="staff-stat-value" style={{ color: '#8b5cf6' }}>
            {pendingReturns}
          </div>
          <span className="material-symbols-outlined staff-stat-icon" style={{ color: '#8b5cf6' }}>
            assignment_return
          </span>
        </div>
      </div>
    </div>
  );
}
