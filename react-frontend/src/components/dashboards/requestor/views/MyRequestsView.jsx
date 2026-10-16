import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  fetchRequests,
  confirmReceipt,
  fetchProcurements,
  fetchRequestorSummary
} from '../../../../services/requestor';

export default function MyRequestsView({ addToast, onNavigateToResources }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [procurements, setProcurements] = useState([]);
  const [summary, setSummary] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [procLoading, setProcLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reqList, procList, sum] = await Promise.all([
        fetchRequests().catch(() => []),
        fetchProcurements().catch(() => []),
        fetchRequestorSummary().catch(() => null)
      ]);
      setRequests(reqList || []);
      setProcurements(procList || []);
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

  const handleRefreshProcurement = async () => {
    setProcLoading(true);
    try {
      const procList = await fetchProcurements();
      setProcurements(procList || []);
      addToast('Procurement status refreshed.', 'success');
    } catch (err) {
      console.error('Failed to refresh procurements:', err);
      addToast('Could not refresh procurements.', 'error');
    } finally {
      setProcLoading(false);
    }
  };

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

  // Filter user's procurements
  const myProcs = procurements.filter(
    (p) => p.requester === user?.name || p.requestedById === user?.id
  );

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

      {/* Procurement Status Table */}
      <div className="data-section" style={{ marginTop: '2rem' }}>
        <div className="data-section-header">
          <div className="data-section-title">
            <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', fontSize: '1.2rem', marginRight: '0.4rem' }}>
              local_shipping
            </span>
            My Procurement Status
          </div>
          <button
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            onClick={handleRefreshProcurement}
            disabled={procLoading}
          >
            {procLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <p style={{ fontSize: '0.8rem', color: '#64748b', padding: '0 1.5rem', marginTop: '0.75rem', marginBottom: '1rem' }}>
          Track the progress of your procurement requests through the approval and fulfillment pipeline.
        </p>

        {/* Status Progress Legend */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '0 1.5rem 1rem', fontSize: '0.72rem', color: '#64748b', alignItems: 'center' }}>
          <span>Progress:</span>
          <span style={{ background: '#fef9c3', color: '#854d0e', padding: '2px 8px', borderRadius: '999px' }}>Pending Approval</span>
          <span>→</span>
          <span style={{ background: '#fef9c3', color: '#854d0e', padding: '2px 8px', borderRadius: '999px' }}>Pending (Registrar)</span>
          <span>→</span>
          <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '999px' }}>Approved</span>
          <span>→</span>
          <span style={{ background: '#ede9fe', color: '#6d28d9', padding: '2px 8px', borderRadius: '999px' }}>Fulfilled</span>
          <span>→</span>
          <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '999px' }}>Registered</span>
          <span>→</span>
          <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '999px' }}>Allocated ✅</span>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Procurement ID</th>
                <th>Resource Type</th>
                <th>Qty</th>
                <th>Date Submitted</th>
                <th>Current Stage</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {myProcs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem', fontSize: '0.875rem' }}>
                    No procurement requests submitted yet.
                  </td>
                </tr>
              ) : (
                myProcs.map((proc) => {
                  const stageMap = {
                    'Pending Approval': { stage: '1 of 5 — Awaiting Dept Head', bg: '#fef9c3', color: '#854d0e' },
                    'Pending': { stage: '2 of 5 — Awaiting Registrar', bg: '#fef9c3', color: '#854d0e' },
                    'Approved': { stage: '3 of 5 — Inventory Officer Allocating', bg: '#dbeafe', color: '#1d4ed8' },
                    'Fulfilled': { stage: '4 of 5 — Asset Registration', bg: '#ede9fe', color: '#6d28d9' },
                    'Registered': { stage: '5 of 5 — Pending Allocation', bg: '#dcfce7', color: '#166534' },
                    'Rejected': { stage: 'Rejected', bg: '#fee2e2', color: '#b91c1c' }
                  };

                  const cleanProcId = (proc.id || '').replace(/[^a-zA-Z0-9]/g, '');
                  const allocationReqId = `REQ-PRC-${cleanProcId}`;
                  const allocationReq = requests.find((r) => r.id === allocationReqId);

                  let stageInfo = stageMap[proc.status] || { stage: proc.status, bg: '#f1f5f9', color: '#64748b' };

                  if (allocationReq && (allocationReq.status === 'Allocated' || allocationReq.status === 'Completed')) {
                    stageInfo = { stage: '✅ Allocated — Check My Resources', bg: '#dcfce7', color: '#166534' };
                  } else if (allocationReq && allocationReq.status === 'Approved') {
                    stageInfo = { stage: '5 of 5 — Inventory Officer Allocating Now', bg: '#dcfce7', color: '#166534' };
                  }

                  return (
                    <tr key={proc.id}>
                      <td className="td-id">{proc.id}</td>
                      <td>{proc.item || proc.resourceType}</td>
                      <td>{String(proc.quantity).padStart(2, '0')}</td>
                      <td>{proc.date}</td>
                      <td>
                        <span style={{ fontSize: '0.78rem', color: stageInfo.color, fontWeight: 500 }}>
                          {stageInfo.stage}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            background: stageInfo.bg,
                            color: stageInfo.color,
                            padding: '3px 10px',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}
                        >
                          {proc.status}
                        </span>
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
  );
}
