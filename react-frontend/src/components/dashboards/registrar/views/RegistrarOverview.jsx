import React, { useState, useEffect } from 'react';
import {
  fetchRegistrarSummary,
  fetchRequests,
  fetchProcurements,
  fetchResources
} from '../../../../services/registrar';

/**
 * 0. Dashboard View (replicates dashboard-view from registrar.html & registrar.js)
 */
export default function RegistrarOverview({ onSwitchView }) {
  // Simple state variables matching previous registrar
  const [summary, setSummary] = useState(null);
  const [requests, setRequests] = useState([]);
  const [procurements, setProcurements] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load all initial data simultaneously (like refreshData() in registrar.js)
  const refreshData = async () => {
    try {
      setLoading(true);
      const [sumData, reqData, procData, resData] = await Promise.all([
        fetchRegistrarSummary().catch(() => null),
        fetchRequests().catch(() => []),
        fetchProcurements().catch(() => []),
        fetchResources().catch(() => [])
      ]);

      setSummary(sumData || {});
      setRequests(Array.isArray(reqData) ? reqData : []);
      setProcurements(Array.isArray(procData) ? procData : []);
      setResources(Array.isArray(resData) ? resData : []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Compute stat values matching original registrar.js logic
  const totalAssets = summary?.activeAssets ?? summary?.totalAssets ?? resources.length;
  const pendingRequests = summary?.pendingRequests ?? requests.filter((r) => r.status === 'Pending').length;
  const pendingProcurements = summary?.pendingProcurements ?? procurements.filter((p) => p.status === 'Pending').length;
  const approvedToday =
    summary?.approvedTotals ??
    summary?.approvedToday ??
    requests.filter((r) => r.status === 'Approved').length +
      procurements.filter((p) => p.status === 'Approved').length;

  // Filter 5 recent requests and 5 actionable procurements
  const recentRequests = requests.slice(0, 5);
  const actionableProcurements = procurements.filter((p) => p.status === 'Pending').slice(0, 5);

  return (
    <div id="dashboard-view" className="view-section active">
      <h1 className="page-title">Registrar Dashboard</h1>
      <p className="page-subtitle">Global overview of university assets, requests, and procurements.</p>

      {/* Stats Grid matching exact registrar.html */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-title">Total Active Assets</div>
          <div className="stat-value-row">
            <div className="stat-value" id="dash-main-assets">{loading ? '...' : totalAssets}</div>
            <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>inventory_2</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title" style={{ color: '#0284c7' }}>Pending Requests</div>
          <div className="stat-value-row">
            <div className="stat-value" style={{ color: '#0284c7' }} id="dash-main-reqs">{loading ? '...' : pendingRequests}</div>
            <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: '#0284c7' }}>assignment</span>
          </div>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onSwitchView && onSwitchView('procurements')}>
          <div className="stat-title" style={{ color: '#d97706' }}>Pending Indents</div>
          <div className="stat-value-row">
            <div className="stat-value" style={{ color: '#d97706' }} id="dash-main-procs">{loading ? '...' : pendingProcurements}</div>
            <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: '#d97706' }}>assignment</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title" style={{ color: '#16a34a' }}>Approved Today</div>
          <div className="stat-value-row">
            <div className="stat-value" style={{ color: '#16a34a' }} id="dash-main-approved">{loading ? '...' : approvedToday}</div>
            <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: '#16a34a' }}>verified</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout matching exact registrar.html */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Recent Requests Section */}
        <div className="data-section" style={{ margin: 0 }}>
          <div className="data-section-header">
            <div className="data-section-title">Recent Requests</div>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              onClick={() => onSwitchView && onSwitchView('requests')}
            >
              View All
            </button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Dept</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentRequests.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '1rem', color: '#64748b' }}>
                    {loading ? 'Loading...' : 'No recent requests.'}
                  </td>
                </tr>
              ) : (
                recentRequests.map((r) => {
                  const badgeClass =
                    r.status === 'Approved' || r.status === 'Allocated'
                      ? 'allocated'
                      : r.status === 'Rejected'
                      ? 'rejected'
                      : 'pending';

                  return (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.department}</td>
                      <td>
                        <span className={`badge ${badgeClass}`}>{r.status}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Actionable Department Indents Section */}
        <div className="data-section" style={{ margin: 0 }}>
          <div className="data-section-header">
            <div className="data-section-title">Actionable Department Indents</div>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              onClick={() => onSwitchView && onSwitchView('procurements')}
            >
              View All
            </button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Indent ID</th>
                <th>Dept</th>
                <th>Requested Resource</th>
                <th>Qty</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {actionableProcurements.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '1rem', color: '#64748b' }}>
                    {loading ? 'Loading...' : 'No pending department indents.'}
                  </td>
                </tr>
              ) : (
                actionableProcurements.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span style={{ fontWeight: 600, color: '#0F386E' }}>{p.id}</span>
                    </td>
                    <td>{p.department}</td>
                    <td><strong>{p.resourceType || p.item}</strong></td>
                    <td>{p.quantity}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                        onClick={() => onSwitchView && onSwitchView('procurements')}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
