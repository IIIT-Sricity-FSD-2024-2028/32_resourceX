import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import AdminModal from '../../admin/components/AdminModal';
import {
  fetchDeptRequests,
  approveDeptRequest,
  rejectDeptRequest,
  fetchDeptProcurements,
  approveDeptProcurement,
  rejectDeptProcurement
} from '../../../../services/deptHead';
import { EmptyRow, FileLink, LoadingBlock, ErrorBlock, padQty } from '../components/deptHeadUtils';

/**
 * #incoming-requests-view from department_head.html
 * - Pending resource requests (approve -> Staff allocation, reject)
 * - Incoming procurement requests from requestors (approve -> Registrar, reject)
 */
export default function DeptHeadIncomingRequests() {
  const { addToast = () => {}, openProcurementFile = () => {} } = useOutletContext() || {};

  const [requests, setRequests] = useState([]);
  const [procurements, setProcurements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [confirm, setConfirm] = useState(null); // { kind: 'request'|'procurement', id }

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [reqs, procs] = await Promise.all([
        fetchDeptRequests({ status: 'Pending' }),
        fetchDeptProcurements({ status: 'Pending Approval' })
      ]);
      setRequests(reqs || []);
      setProcurements(procs || []);
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

  // ---- Resource requests ----
  const handleApproveRequest = async (id) => {
    setBusyId(id);
    try {
      await approveDeptRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      addToast('Request approved. It has been passed to Staff for allocation.', 'success');
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

  // ---- Procurements ----
  const handleApproveProcurement = async (id) => {
    setBusyId(id);
    try {
      await approveDeptProcurement(id);
      setProcurements((prev) => prev.filter((p) => p.id !== id));
      addToast('Procurement approved! Sent to Registrar.', 'success');
    } catch (err) {
      addToast(`Approval failed: ${err.message}`, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleRejectProcurement = async (id) => {
    setBusyId(id);
    try {
      await rejectDeptProcurement(id);
      setProcurements((prev) => prev.filter((p) => p.id !== id));
      addToast('Procurement request rejected.', 'error');
    } catch (err) {
      addToast(`Rejection failed: ${err.message}`, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const onConfirmReject = async () => {
    const c = confirm;
    setConfirm(null);
    if (!c) return;
    if (c.kind === 'request') await handleRejectRequest(c.id);
    else await handleRejectProcurement(c.id);
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
        <>
          <div className="data-section">
            <div className="data-section-header">
              <div className="data-section-title">Pending Approvals</div>
              <button type="button" className="btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }} onClick={loadData}>
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
                    <th>Reason</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.length === 0 ? (
                    <EmptyRow colSpan={6} text="No pending resource requests. 🎉" />
                  ) : (
                    requests.map((req) => (
                      <tr key={req.id}>
                        <td className="td-id">{req.id}</td>
                        <td>{req.requestor}</td>
                        <td>{req.resourceType}</td>
                        <td>{padQty(req.quantity)}</td>
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
                            onClick={() => setConfirm({ kind: 'request', id: req.id })}
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

          <div className="data-section" style={{ marginTop: '2rem' }}>
            <div className="data-section-header">
              <div className="data-section-title">Incoming Procurement Requests</div>
            </div>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Proc ID</th>
                    <th>Requestor</th>
                    <th>Resource/Item</th>
                    <th>Qty</th>
                    <th>Justification</th>
                    <th>Spec File</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {procurements.length === 0 ? (
                    <EmptyRow colSpan={7} text="No procurement requests awaiting your approval." />
                  ) : (
                    procurements.map((p) => (
                      <tr key={p.id}>
                        <td className="td-id">{p.id}</td>
                        <td>{p.requester || p.requestedBy || 'Unknown'}</td>
                        <td>{p.item || p.resourceType}</td>
                        <td>{padQty(p.quantity)}</td>
                        <td style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.justification}</td>
                        <td>
                          <FileLink name={p.specFileName} onClick={() => openProcurementFile(p, 'spec')} />
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button
                            type="button"
                            className="btn-primary btn-approve"
                            disabled={busyId === p.id}
                            onClick={() => handleApproveProcurement(p.id)}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="btn-danger btn-reject-sm"
                            disabled={busyId === p.id}
                            onClick={() => setConfirm({ kind: 'procurement', id: p.id })}
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
        isOpen={Boolean(confirm)}
        title={confirm?.kind === 'procurement' ? 'Reject Procurement Request' : 'Reject Request'}
        onClose={() => setConfirm(null)}
        onConfirm={onConfirmReject}
        confirmText="Reject"
        confirmButtonClass="btn-danger"
      >
        <p style={{ color: '#475569', fontSize: '0.9rem' }}>
          Are you sure you want to reject {confirm?.kind === 'procurement' ? 'this procurement request' : 'this request'}{' '}
          <strong>{confirm?.id}</strong>? This cannot be undone.
        </p>
      </AdminModal>
    </div>
  );
}
