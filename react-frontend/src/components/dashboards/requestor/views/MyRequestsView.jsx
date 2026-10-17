import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  fetchRequests,
  confirmReceipt,
  fetchRequestorSummary
} from '../../../../services/requestor';

export default function MyRequestsView({ addToast, onNavigateToResources }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [summary, setSummary] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reqList, sum] = await Promise.all([
        fetchRequests().catch(() => []),
        fetchRequestorSummary().catch(() => null)
      ]);
      setRequests(reqList || []);
      setSummary(sum || null);
    } catch (err) {
      console.error('Failed to load my requests data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirmReceipt = async (reqId) => {
    setActionLoadingId(reqId);
    try {
      await confirmReceipt(reqId);
      addToast('Item successfully received and confirmed.', 'success');
      await loadData();
      if (onNavigateToResources) {
        onNavigateToResources();
      }
    } catch (err) {
      console.error('Error confirming receipt:', err);
      addToast(err.message || 'Failed to confirm receipt.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Compute metrics
  const myRequests = requests || [];
  const pendingCount = summary?.pendingRequests ?? myRequests.filter((r) => r.status === 'Pending').length;
  const approvedCount = summary?.approvedRequests ?? myRequests.filter((r) => r.status === 'Approved').length;
  const allocatedCount = summary?.allocatedRequests ?? myRequests.filter((r) => r.status === 'Allocated').length;

  // Filter requests
  const filteredRequests = statusFilter === 'All'
    ? myRequests
    : myRequests.filter((r) => r.status === statusFilter);

  return (
    <div className="view-section">
      <h1 className="page-title">My Requests</h1>
      <p className="page-subtitle">
        Track and manage your resource allocation requests. Review statuses, confirm receipts, and audit your history across departments.
      </p>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Total Pending</div>
          <div className="stat-value-row">
            <div className="stat-value">{String(pendingCount).padStart(2, '0')}</div>
            <span className="badge pending">Action Needed</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Approved</div>
          <div className="stat-value-row">
            <div className="stat-value">{String(approvedCount).padStart(2, '0')}</div>
            <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>Processing</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Ready for Pickup</div>
          <div className="stat-value-row" style={{ borderLeft: '4px solid #16a34a', paddingLeft: '1rem' }}>
            <div className="stat-value" style={{ color: '#16a34a' }}>
              {String(allocatedCount).padStart(2, '0')}
            </div>
            <span className="badge allocated">Allocated</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Completion Rate</div>
          <div className="stat-value-row">
            <div className="stat-value" style={{ color: '#0f172a' }}>
              {myRequests.length > 0
                ? `${Math.round(((myRequests.length - pendingCount) / myRequests.length) * 100)}%`
                : '100%'}
            </div>
          </div>
        </div>
      </div>

      {/* Active Requests Table */}
      <div className="data-section">
        <div className="data-section-header">
          <div className="data-section-title">Active Requests</div>
          <div className="data-filters" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: '#64748b' }}>
                filter_list
              </span>
              <select
                id="req-status-filter"
                className="form-control"
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem', borderRadius: '6px', minWidth: '140px' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Allocated">Allocated</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <button
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              onClick={() => setStatusFilter('All')}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Department</th>
                <th>Resource Type</th>
                <th>Quantity</th>
                <th>Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Loading requests...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    No requests found for this filter.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  let statusBadgeClass = `badge ${req.status ? req.status.toLowerCase() : ''}`;

                  let actionEl = (
                    <button className="icon-btn" title="More options" style={{ marginLeft: 'auto' }}>
                      ⋮
                    </button>
                  );

                  if (req.status === 'Allocated') {
                    actionEl = (
                      <button
                        className="btn-primary"
                        style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', whiteSpace: 'nowrap' }}
                        disabled={actionLoadingId === req.id}
                        onClick={() => handleConfirmReceipt(req.id)}
                      >
                        {actionLoadingId === req.id ? 'Confirming...' : 'I RECEIVED'}
                      </button>
                    );
                  } else if (req.status === 'Rejected') {
                    actionEl = (
                      <span title={req.rejectionReason || 'Request Rejected'} style={{ cursor: 'help' }}>
                        ℹ️
                      </span>
                    );
                  }

                  return (
                    <tr key={req.id}>
                      <td className="td-id">{req.id}</td>
                      <td>{req.department}</td>
                      <td>{req.resourceType || req.item}</td>
                      <td>{String(req.quantity).padStart(2, '0')}</td>
                      <td>{req.date}</td>
                      <td>
                        <span className={statusBadgeClass}>{req.status}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>{actionEl}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
