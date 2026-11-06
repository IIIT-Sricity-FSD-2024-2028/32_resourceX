import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  fetchRequests,
  confirmReceipt,
  fetchRequestorSummary
} from '../../../../services/requestor';
import TableToolbar, { matchesSearch, uniqueOptions } from '../../../common/TableToolbar';
import RequestDetailModal from '../components/RequestDetailModal';
import { useNotificationFocus } from '../../../common/notificationFocus';

export default function MyRequestsView({ addToast, onNavigateToResources, onPreviewFile }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [summary, setSummary] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

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

  // A request notification opens that request's tracking card
  useNotificationFocus('request', !loading, (id) => {
    if (requests.some((r) => r.id === id)) setSelectedId(id);
  });

  const handleConfirmReceipt = async (reqId) => {
    setActionLoadingId(reqId);
    try {
      await confirmReceipt(reqId);
      addToast('Item successfully received and confirmed.', 'success');
      setSelectedId(null);
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
  const filteredRequests = myRequests.filter((r) =>
    (statusFilter === 'All' || r.status === statusFilter) &&
    (deptFilter === 'All' || r.department === deptFilter) &&
    matchesSearch(search, r.id, r.department, r.resourceType, r.quantity, r.date, r.status, r.justification)
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
        </div>
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search by Request ID, department, resource type or date..."
          filters={[
            { label: 'All Statuses', value: statusFilter, onChange: setStatusFilter, options: ['Pending', 'Approved', 'Allocated', 'Completed', 'Rejected', 'Cancelled'] },
            { label: 'All Departments', value: deptFilter, onChange: setDeptFilter, options: uniqueOptions(myRequests, 'department') },
          ]}
          resultCount={filteredRequests.length}
          totalCount={myRequests.length}
        />

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
                    No requests match your search or filters.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  let statusBadgeClass = `badge ${req.status ? req.status.toLowerCase() : ''}`;

                  let actionEl = (
                    <button className="icon-btn" title="View details" style={{ marginLeft: 'auto' }}>
                      ⋮
                    </button>
                  );

                  if (req.status === 'Allocated') {
                    actionEl = (
                      <button
                        className="btn-primary"
                        style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', whiteSpace: 'nowrap' }}
                        disabled={actionLoadingId === req.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmReceipt(req.id);
                        }}
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
                    <tr
                      key={req.id}
                      className="rq-row"
                      tabIndex={0}
                      onClick={() => setSelectedId(req.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setSelectedId(req.id);
                      }}
                    >
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

      {selectedId && (
        <RequestDetailModal
          request={myRequests.find((r) => r.id === selectedId)}
          onClose={() => setSelectedId(null)}
          onChanged={loadData}
          onConfirmReceipt={handleConfirmReceipt}
          receiptLoading={actionLoadingId === selectedId}
          addToast={addToast}
          onPreviewFile={onPreviewFile}
        />
      )}
    </div>
  );
}
