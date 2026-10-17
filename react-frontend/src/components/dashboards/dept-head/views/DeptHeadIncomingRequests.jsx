import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import AdminModal from '../../admin/components/AdminModal';
import {
  fetchDeptRequests,
  approveDeptRequest,
  rejectDeptRequest
} from '../../../../services/deptHead';
import { EmptyRow, LoadingBlock, ErrorBlock, padQty } from '../components/deptHeadUtils';

/**
 * Incoming Requests View for Department Head
 * Allows review and approval/rejection of pending resource requests submitted
 * by departmental staff/requestors before passing them to the Inventory Officer for allocation.
 */
export default function DeptHeadIncomingRequests() {
  const { addToast = () => {} } = useOutletContext() || {};

  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [rejectRequestId, setRejectRequestId] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const reqs = await fetchDeptRequests({ status: 'Pending' });
      const isExpired = (req) => {
        if (!req.requirementDate) return false;
        const parsed = Date.parse(req.requirementDate);
        if (isNaN(parsed)) return false;
        const deadline = new Date(parsed);
        deadline.setHours(23, 59, 59, 999);
        return Date.now() > deadline.getTime();
      };
      setRequests((reqs || []).filter(r => !isExpired(r)));
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

  const onConfirmReject = async () => {
    const id = rejectRequestId;
    setRejectRequestId(null);
    if (!id) return;
    await handleRejectRequest(id);
  };

  return (
    <div className="view-section">
      <h1 className="page-title">Incoming Requests</h1>
      <p className="page-subtitle">Review pending resource requests from your department staff.</p>

      {isLoading ? (
        <LoadingBlock text="Loading incoming requests..." />
      ) : error ? (
        <ErrorBlock text={error} onRetry={loadData} />
      ) : (
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
                {requests.length === 0 ? (
                  <EmptyRow colSpan={7} text="No pending resource requests. 🎉" />
                ) : (
                  requests.map((req) => (
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
