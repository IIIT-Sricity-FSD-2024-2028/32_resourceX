import React from 'react';

/**
 * Exact replica of the Stats Row from employee.html
 */
export default function EmployeeStatsCards({
  assignedInstitutions = 0,
  openTickets = 0,
  resolvedTickets = 0,
  announcementsSent = 0
}) {
  return (
    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
      <div className="stat-card">
        <div className="stat-title">Assigned Institutions</div>
        <div className="stat-value-row">
          <div className="stat-value" id="statOrgs">{assignedInstitutions}</div>
          <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: 'var(--primary-color)' }}>
            corporate_fare
          </span>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-title">Open Tickets</div>
        <div className="stat-value-row">
          <div className="stat-value" id="statOpenTickets">{openTickets}</div>
          <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: '#92400e' }}>
            confirmation_number
          </span>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-title">Resolved Tickets</div>
        <div className="stat-value-row">
          <div className="stat-value" id="statResolvedTickets">{resolvedTickets}</div>
          <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: '#166534' }}>
            task_alt
          </span>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-title">Announcements Sent</div>
        <div className="stat-value-row">
          <div className="stat-value" id="statAnnouncements">{announcementsSent}</div>
          <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: '#1d4ed8' }}>
            campaign
          </span>
        </div>
      </div>
    </div>
  );
}
