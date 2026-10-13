import React, { useState, useEffect } from 'react';
import {
  fetchRegistrarDashboardOverview,
  approveRegistrarProcurement,
  rejectRegistrarProcurement
} from '../../../../services/registrar';

/**
 * RegistrarOverview View
 * Displays high-level platform statistics, recent pending procurements,
 * and recent global requests across all departments.
 */
export default function RegistrarOverview({ onSwitchView, addToast }) {
  // State variables - simple, readable React hooks
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalAssets: 0,
    pendingRequests: 0,
    pendingProcurements: 0,
    approvedToday: 0
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [actionableProcurements, setActionableProcurements] = useState([]);

  // Fetch initial dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchRegistrarDashboardOverview();
      const summary = data.summary || {};
      const procs = data.procurements || [];
      const reqs = data.requests || [];
      const resources = data.resources || [];

      // Calculate statistics from summary API or loaded arrays
      setStats({
        totalAssets: summary.totalAssets ?? summary.activeAssets ?? resources.length,
        pendingRequests: summary.pendingRequests ?? reqs.filter((r) => r.status === 'Pending').length,
        pendingProcurements: summary.pendingProcurements ?? procs.filter((p) => p.status === 'Pending').length,
        approvedToday:
          summary.approvedToday ??
          (reqs.filter((r) => r.status === 'Approved').length + procs.filter((p) => p.status === 'Approved').length)
      });

      // Filter actionable procurements (Pending ones first)
      const pendingProcs = procs.filter((p) => p.status === 'Pending').slice(0, 5);
      setActionableProcurements(pendingProcs);

      // Recent requests (up to 5 items)
      setRecentRequests(reqs.slice(0, 5));
    } catch (err) {
      console.error('Failed to load registrar dashboard data:', err);
      setError('Unable to load registrar dashboard. Please check backend connection.');
      if (addToast) {
        addToast('Failed to load overview data.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Run on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Quick action: Approve procurement right from overview
  const handleQuickApprove = async (procId) => {
    try {
      await approveRegistrarProcurement(procId);
      if (addToast) {
        addToast(`Procurement ${procId} approved successfully!`, 'success');
      }
      // Refresh data
      loadDashboardData();
    } catch (err) {
      console.error(err);
      if (addToast) {
        addToast(`Approval failed: ${err.message || 'Error'}`, 'error');
      }
    }
  };

  // Quick action: Reject procurement right from overview
  const handleQuickReject = async (procId) => {
    const confirmed = window.confirm(`Are you sure you want to reject procurement ${procId}?`);
    if (!confirmed) return;

    try {
      await rejectRegistrarProcurement(procId);
      if (addToast) {
        addToast(`Procurement ${procId} rejected.`, 'warning');
      }
      loadDashboardData();
    } catch (err) {
      console.error(err);
      if (addToast) {
        addToast(`Rejection failed: ${err.message || 'Error'}`, 'error');
      }
    }
  };

  // Helper for status badge class
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
      case 'Allocated':
      case 'Fulfilled':
        return <span className="badge badge-allocated">{status}</span>;
      case 'Pending':
      case 'Pending Approval':
        return <span className="badge badge-pending">{status}</span>;
      case 'Rejected':
        return <span className="badge badge-rejected">{status}</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', animation: 'spin 1s linear infinite' }}>
          sync
        </span>
        <p style={{ marginTop: '0.75rem', fontWeight: 500 }}>Loading Registrar Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
        <p style={{ fontWeight: 600 }}>{error}</p>
        <button
          type="button"
          className="btn-primary"
          style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}
          onClick={loadDashboardData}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Page Title & Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-color, #0F386E)', marginBottom: '0.25rem' }}>
            Registrar Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.9rem' }}>
            Global overview of university hardware assets, departmental requisitions, and procurement approvals.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={loadDashboardData}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>refresh</span>
            Refresh
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => onSwitchView && onSwitchView('procurements')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>checklist</span>
            Review Procurements
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        {/* Total Active Assets */}
        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Active Assets
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--primary-color, #0F386E)' }}>
              {stats.totalAssets.toLocaleString()}
            </span>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#93c5fd' }}>
              inventory_2
            </span>
          </div>
        </div>

        {/* Pending Requests */}
        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ color: '#0284c7', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Pending Requests
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#0284c7' }}>
              {stats.pendingRequests}
            </span>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#7dd3fc' }}>
              assignment
            </span>
          </div>
        </div>

        {/* Pending Procurements */}
        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ color: '#d97706', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Pending Procurements
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#d97706' }}>
              {stats.pendingProcurements}
            </span>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#fde68a' }}>
              shopping_cart
            </span>
          </div>
        </div>

        {/* Approved Today */}
        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ color: '#16a34a', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Approved Total
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#16a34a' }}>
              {stats.approvedToday}
            </span>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#86efac' }}>
              verified
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Actionable Procurements & Recent Requests */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Actionable Procurements */}
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: 'var(--shadow-sm)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#0f172a' }}>
                Actionable Procurements
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Awaiting registrar verification</p>
            </div>
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
              onClick={() => onSwitchView && onSwitchView('procurements')}
            >
              View All
            </button>
          </div>

          {actionableProcurements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.875rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#cbd5e1' }}>
                check_circle
              </span>
              <p style={{ marginTop: '0.5rem' }}>No pending procurements require approval!</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Proc ID</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Resource Type</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Dept</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {actionableProcurements.map((proc) => (
                    <tr key={proc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600, color: '#0F386E' }}>{proc.id}</td>
                      <td style={{ padding: '0.75rem' }}>{proc.resourceType || proc.item}</td>
                      <td style={{ padding: '0.75rem', color: '#64748b' }}>{proc.department}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => handleQuickApprove(proc.id)}
                            style={{
                              backgroundColor: '#16a34a',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '0.25rem 0.55rem',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              fontWeight: 500
                            }}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickReject(proc.id)}
                            style={{
                              backgroundColor: '#fee2e2',
                              color: '#b91c1c',
                              border: '1px solid #fecaca',
                              borderRadius: '4px',
                              padding: '0.25rem 0.55rem',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              fontWeight: 500
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Requests */}
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: 'var(--shadow-sm)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#0f172a' }}>
                Recent Requests
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Latest requisitions across departments</p>
            </div>
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
              onClick={() => onSwitchView && onSwitchView('requests')}
            >
              View All
            </button>
          </div>

          {recentRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.875rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#cbd5e1' }}>
                inbox
              </span>
              <p style={{ marginTop: '0.5rem' }}>No recent requests found.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Req ID</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Department</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Item</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequests.map((req) => (
                    <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600, color: '#0F386E' }}>{req.id}</td>
                      <td style={{ padding: '0.75rem' }}>{req.department}</td>
                      <td style={{ padding: '0.75rem', color: '#64748b' }}>{req.resourceType}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        {getStatusBadge(req.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
