import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import AdminModal from '../../admin/components/AdminModal';
import {
  fetchDeptRequests,
  approveDeptRequest,
  rejectDeptRequest,
  fetchDeptResources,
  approveResourceExtension,
  rejectResourceExtension
} from '../../../../services/deptHead';
import { EmptyRow, LoadingBlock, ErrorBlock, padQty } from '../components/deptHeadUtils';
import TableToolbar, { matchesSearch, uniqueOptions } from '../../../common/TableToolbar';

/**
 * Incoming Requests View for Department Head
 * Allows review and approval/rejection of pending resource requests submitted
 * by departmental staff/requestors before passing them to the Inventory Officer for allocation.
 */
export default function DeptHeadIncomingRequests() {
  const { addToast = () => {} } = useOutletContext() || {};

  const [requests, setRequests] = useState([]);
  const [extensionRequests, setExtensionRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [rejectRequestId, setRejectRequestId] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [extSearch, setExtSearch] = useState('');
  const [extTypeFilter, setExtTypeFilter] = useState('All');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [reqs, resList] = await Promise.all([
        fetchDeptRequests({ status: 'Pending' }).catch(() => []),
        fetchDeptResources().catch(() => [])
      ]);
      const isExpired = (req) => {
        if (!req.requirementDate) return false;
        const parsed = Date.parse(req.requirementDate);
        if (isNaN(parsed)) return false;
        const deadline = new Date(parsed);
        deadline.setHours(23, 59, 59, 999);
        return Date.now() > deadline.getTime();
      };
      setRequests((reqs || []).filter(r => !isExpired(r)));

      // Pending resource extension requests
      const extPending = (resList || []).filter(r => r.extensionStatus === 'Pending');
      setExtensionRequests(extPending);
    } catch (err) {
      setError(err.message || 'Failed to load incoming requests.');
      addToast(err.message || 'Error loading incoming requests', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---- Resource requests actions ----
  const handleApproveRequest = async (id) => {
    setBusyId(id);
    try {
      await approveDeptRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      addToast('Request approved. It has been passed to the Inventory Officer for allocation.', 'success');
    } catch (err) {
      addToast(`Approval failed: ${err.message}`, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleRejectRequest = async (id) => {
    setBusyId(id);
    try {
      await rejectDeptRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      addToast(`Request ${id} rejected.`, 'error');
    } catch (err) {
      addToast(`Rejection failed: ${err.message}`, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleApproveExtension = async (id) => {
    setBusyId(id);
    try {
      await approveResourceExtension(id);
      setExtensionRequests((prev) => prev.filter((r) => r.id !== id));
      addToast('Deadline extension approved. Return deadline has been updated.', 'success');
    } catch (err) {
      addToast(`Extension approval failed: ${err.message}`, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleRejectExtension = async (id) => {
    setBusyId(id);
    try {
      await rejectResourceExtension(id, { reason: 'Department scheduling constraints' });
      setExtensionRequests((prev) => prev.filter((r) => r.id !== id));
      addToast('Deadline extension rejected.', 'info');
    } catch (err) {
      addToast(`Extension rejection failed: ${err.message}`, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const visibleRequests = requests.filter((req) =>
    (typeFilter === 'All' || req.resourceType === typeFilter) &&
    matchesSearch(search, req.id, req.requestor, req.resourceType, req.justification, req.requirementDateDisplay, req.returnDateDisplay)
  );
  const extensionType = (item) => item.name || item.type;
  const visibleExtensions = extensionRequests.filter((item) =>
    (extTypeFilter === 'All' || extensionType(item) === extTypeFilter) &&
    matchesSearch(extSearch, item.id, extensionType(item), item.extensionRequestedBy, item.assignedTo, item.extensionReason)
  );

  const onConfirmReject = async () => {
    const id = rejectRequestId;
    setRejectRequestId(null);
    if (!id) return;
    await handleRejectRequest(id);
  };

  return (
    <div className="view-section">
      <h1 className="page-title">Incoming Requests</h1>
      <p className="page-subtitle">Review pending resource requests and extension requests from your department staff.</p>

      {isLoading ? (
        <LoadingBlock text="Loading incoming requests..." />
      ) : error ? (
        <ErrorBlock text={error} onRetry={loadData} />
      ) : (
        <>
          {/* Pending Resource Extension Requests */}
          {extensionRequests.length > 0 && (
            <div className="data-section" style={{ marginBottom: '2rem', border: '1.5px solid #fcd34d', background: '#fffdf5' }}>
              <div className="data-section-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#d97706' }}>
                    schedule
                  </span>
                  <div>
                    <div className="data-section-title" style={{ color: '#92400e' }}>
                      Pending Resource Extension Requests ({extensionRequests.length})
                    </div>
                    <div style={{ fontSize: 12, color: '#b45309', marginTop: 2 }}>
                      Requesters requesting additional days for allocated departmental equipment
                    </div>
                  </div>
                </div>
              </div>
              <TableToolbar
                search={extSearch}
                onSearchChange={setExtSearch}
                placeholder="Search by resource code, type, requestor or justification..."
                filters={[
                  { label: 'All Resource Types', value: extTypeFilter, onChange: setExtTypeFilter, options: uniqueOptions(extensionRequests, extensionType) },
                ]}
                resultCount={visibleExtensions.length}
                totalCount={extensionRequests.length}
              />

              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Resource Code</th>
                      <th>Resource Type</th>
                      <th>Requestor</th>
                      <th>Current Deadline</th>
                      <th>Requested Extension</th>
                      <th>Justification</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleExtensions.length === 0 && (
                      <EmptyRow colSpan={7} text="No extension requests match your search." />
                    )}
                    {visibleExtensions.map((item) => (
                      <tr key={item.id}>
                        <td className="td-id">{item.id}</td>
                        <td style={{ fontWeight: 600 }}>{item.name || item.type}</td>
                        <td>{item.extensionRequestedBy || item.assignedTo || '—'}</td>
                        <td style={{ color: '#64748b' }}>{item.returnDateDisplay || item.returnDate || '—'}</td>
                        <td>
                          <span style={{ fontWeight: 700, color: '#0F386E', background: '#e0f2fe', padding: '3px 8px', borderRadius: 6, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>event</span>
                            {item.extensionProposedReturnDateDisplay || item.extensionProposedReturnDate}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.78rem', color: '#475569', maxWidth: 260 }}>
                          {item.extensionReason || '—'}
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button
                            type="button"
                            className="btn-primary btn-approve"
                            disabled={busyId === item.id}
                            onClick={() => handleApproveExtension(item.id)}
                            style={{ background: '#059669', borderColor: '#059669', marginRight: 6 }}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="btn-danger btn-reject"
                            disabled={busyId === item.id}
                            onClick={() => handleRejectExtension(item.id)}
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="data-section">
            <div className="data-section-header">
              <div className="data-section-title">Pending Approvals</div>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
              onClick={loadData}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>refresh</span> Refresh
            </button>
          </div>
          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder="Search by Req ID, requestor, resource type or reason..."
            filters={[
              { label: 'All Resource Types', value: typeFilter, onChange: setTypeFilter, options: uniqueOptions(requests, 'resourceType') },
            ]}
            resultCount={visibleRequests.length}
            totalCount={requests.length}
          />
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Req ID</th>
                  <th>Requestor</th>
                  <th>Resource Type</th>
                  <th>Qty</th>
                  <th>Usage Period</th>
                  <th>Reason</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRequests.length === 0 ? (
                  <EmptyRow colSpan={7} text={requests.length === 0 ? 'No pending resource requests. 🎉' : 'No requests match your search.'} />
                ) : (
                  visibleRequests.map((req) => (
                    <tr key={req.id}>
                      <td className="td-id">{req.id}</td>
                      <td>{req.requestor}</td>
                      <td>{req.resourceType}</td>
                      <td>{padQty(req.quantity)}</td>
                      <td>
                        {req.requirementDate || req.requirementDateDisplay ? (
                          <div style={{ fontSize: '0.78rem', lineHeight: 1.6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#0F386E', fontWeight: 600 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>event</span>
                              {req.requirementDateDisplay || new Date(req.requirementDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#64748b', marginTop: '0.1rem' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>event_available</span>
                              {req.returnDateDisplay || (req.returnDate ? new Date(req.returnDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—')}
                            </div>
                            {req.requirementDate && req.returnDate && (
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                                {Math.ceil((new Date(req.returnDate) - new Date(req.requirementDate)) / (1000 * 60 * 60 * 24))} day(s)
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#64748b' }}>{req.justification || '—'}</td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          className="btn-primary btn-approve"
                          disabled={busyId === req.id}
                          onClick={() => handleApproveRequest(req.id)}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="btn-danger btn-reject-sm"
                          disabled={busyId === req.id}
                          onClick={() => setRejectRequestId(req.id)}
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}

      <AdminModal
        isOpen={Boolean(rejectRequestId)}
        title="Reject Resource Request"
        onClose={() => setRejectRequestId(null)}
        onConfirm={onConfirmReject}
        confirmText="Reject"
        confirmButtonClass="btn-danger"
      >
        <p style={{ color: '#475569', fontSize: '0.9rem' }}>
          Are you sure you want to reject resource request <strong>{rejectRequestId}</strong>? This cannot be undone.
        </p>
      </AdminModal>
    </div>
  );
}
