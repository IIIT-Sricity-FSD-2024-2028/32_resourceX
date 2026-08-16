import React from 'react';

function StatusBadge({ status }) {
  const cls = status.toLowerCase().replace(/\s+/g, '-');
  let className = `badge ${cls}`;
  if (status === 'Allocated') className = 'badge allocated';
  else if (status === 'Approved') className = 'badge approved';
  else if (status === 'Pending') className = 'badge pending';
  else if (status === 'Rejected') className = 'badge rejected';
  else if (status === 'Maintenance Requested' || status === 'Maintenance') className = 'badge maintenance';
  return <span className={className}>{status}</span>;
}

export default function RequestorDashboardView({ state, onSwitchView }) {
  const { requests, resources, summary } = state;
  const user = JSON.parse(localStorage.getItem('rx_data') || '{}').currentUser || {};

  const totalReq = summary?.totalRequests ?? requests.length;
  const pendingReq = summary?.pendingRequests ?? requests.filter(r => r.status === 'Pending').length;
  const myRes = summary?.allocatedResources ?? resources.length;
  const maint = summary?.maintenanceItems ?? resources.filter(r => r.status === 'Maintenance Requested' || r.status === 'Maintenance').length;

  return (
    <div className="view-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Welcome back, {user.name ? user.name.split(' ')[0] : ''}</h1>
          <p className="page-subtitle">Here is an overview of your resource activities.</p>
        </div>
        <button className="btn-primary" onClick={() => onSwitchView('request-view')}>+ New Request</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Total Requests</div>
          <div className="stat-value-row">
            <div className="stat-value">{totalReq}</div>
            <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>description</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title" style={{ color: '#d97706' }}>Pending</div>
          <div className="stat-value-row" style={{ borderLeft: '4px solid #f59e0b', paddingLeft: '1rem' }}>
            <div className="stat-value" style={{ color: '#d97706' }}>{pendingReq}</div>
            <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: '#d97706' }}>hourglass_empty</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title" style={{ color: '#16a34a' }}>My Resources</div>
          <div className="stat-value-row" style={{ borderLeft: '4px solid #16a34a', paddingLeft: '1rem' }}>
            <div className="stat-value" style={{ color: '#16a34a' }}>{myRes}</div>
            <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: '#16a34a' }}>inventory_2</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title" style={{ color: '#dc2626' }}>In Maintenance</div>
          <div className="stat-value-row" style={{ borderLeft: '4px solid #ef4444', paddingLeft: '1rem' }}>
            <div className="stat-value" style={{ color: '#dc2626' }}>{maint}</div>
            <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: '#dc2626' }}>warning</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        <div className="data-section" style={{ flex: 1, marginBottom: 0 }}>
          <div className="data-section-header">
            <div className="data-section-title">Recent Requests</div>
            <button className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => onSwitchView('my-requests-view')}>View All</button>
          </div>
          <table className="table">
            <thead><tr><th>ID</th><th>Resource</th><th>Qty</th><th>Status</th></tr></thead>
            <tbody>
              {requests.slice(0, 5).map(req => (
                <tr key={req.id}>
                  <td className="td-id">{req.id}</td>
                  <td>{req.resourceType}</td>
                  <td>{req.quantity}</td>
                  <td><StatusBadge status={req.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="data-section" style={{ flex: 1, marginBottom: 0 }}>
          <div className="data-section-header">
            <div className="data-section-title">My Resources</div>
            <button className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => onSwitchView('my-resources-view')}>View All</button>
          </div>
          <table className="table">
            <thead><tr><th>Code</th><th>Type</th><th>Status</th></tr></thead>
            <tbody>
              {resources.slice(0, 5).map(res => (
                <tr key={res.id}>
                  <td className="td-id">{res.id}</td>
                  <td>{res.type}</td>
                  <td><StatusBadge status={res.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
