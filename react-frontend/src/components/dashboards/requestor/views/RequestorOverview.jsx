import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { fetchRequestorDashboardOverview } from '../../../../services/requestor';

export default function RequestorOverview({ onSwitchView }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    requests: [],
    resources: [],
    summary: null
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchRequestorDashboardOverview();
      setData({
        requests: res.requests || [],
        resources: res.resources || [],
        summary: res.summary || null
      });
    } catch (err) {
      console.error('Failed to load overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const myRequests = data.requests || [];
  const myResources = data.resources || [];
  const summary = data.summary || {};

  const totalReq = summary.totalRequests ?? myRequests.length;
  const pendingReq = summary.pendingRequests ?? myRequests.filter((r) => r.status === 'Pending').length;
  const myResCount = summary.allocatedResources ?? myResources.length;
  const maintCount =
    summary.maintenanceItems ??
    myResources.filter((r) => r.status === 'Maintenance Requested' || r.status === 'Maintenance').length;

  const firstName = user?.name ? user.name.split(' ')[0] : 'User';

  return (
    <div className="view-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Welcome back, {firstName}</h1>
          <p className="page-subtitle">Here is an overview of your resource activities.</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => onSwitchView ? onSwitchView('request') : null}
        >
          + New Request
        </button>
      </div>

      {/* Stats Cards */}
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
            <div className="stat-value" style={{ color: '#16a34a' }}>{myResCount}</div>
            <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: '#16a34a' }}>inventory_2</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title" style={{ color: '#dc2626' }}>In Maintenance</div>
          <div className="stat-value-row" style={{ borderLeft: '4px solid #ef4444', paddingLeft: '1rem' }}>
            <div className="stat-value" style={{ color: '#dc2626' }}>{maintCount}</div>
            <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: '#dc2626' }}>warning</span>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Left Column - Recent Requests */}
        <div className="data-section" style={{ flex: '1 1 450px', marginBottom: 0 }}>
          <div className="data-section-header">
            <div className="data-section-title">Recent Requests</div>
            <button
              className="btn-secondary"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              onClick={() => onSwitchView ? onSwitchView('my-requests') : null}
            >
              View All
            </button>
          </div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Resource</th>
                  <th>Qty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                      Loading requests...
                    </td>
                  </tr>
                ) : myRequests.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                      No recent requests found.
                    </td>
                  </tr>
                ) : (
                  myRequests.slice(0, 5).map((req) => (
                    <tr key={req.id}>
                      <td className="td-id">{req.id}</td>
                      <td>{req.resourceType || req.item}</td>
                      <td>{req.quantity}</td>
                      <td>
                        <span className={`badge ${req.status ? req.status.toLowerCase() : ''}`}>
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column - My Resources */}
        <div className="data-section" style={{ flex: '1 1 450px', marginBottom: 0 }}>
          <div className="data-section-header">
            <div className="data-section-title">My Resources</div>
            <button
              className="btn-secondary"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              onClick={() => onSwitchView ? onSwitchView('my-resources') : null}
            >
              View All
            </button>
          </div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                      Loading allocated resources...
                    </td>
                  </tr>
                ) : myResources.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                      No allocated resources found.
                    </td>
                  </tr>
                ) : (
                  myResources.slice(0, 5).map((res) => {
                    let badgeClass = 'badge';
                    if (res.status === 'Allocated') badgeClass = 'badge allocated';
                    else if (res.status === 'Maintenance Requested' || res.status === 'Maintenance') badgeClass = 'badge maintenance';
                    else if (res.status === 'Repaired') badgeClass = 'badge allocated';

                    return (
                      <tr key={res.id}>
                        <td className="td-id">{res.id}</td>
                        <td>{res.type}</td>
                        <td>
                          <span className={badgeClass}>{res.status}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
