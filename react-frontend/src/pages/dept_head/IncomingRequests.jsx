import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import AdminModal from '../../components/dashboards/admin/components/AdminModal';
import FileLink from './components/FileLink';
import EmptyRow from './components/EmptyRow';
import {
  fetchDeptRequests,
  approveDeptRequest,
  rejectDeptRequest,
  fetchDeptProcurements,
  approveDeptProcurement,
  rejectDeptProcurement
} from '../../services/deptHead';

const pad2 = (n) => String(n ?? '').padStart(2, '0');

/**
 * Replica of incoming-requests-view from department_head.html
 * - Pending resource requests from department staff (approve → passed to Staff for allocation)
 * - Procurement requests raised by requestors awaiting department approval (approve → sent to Registrar)
 */
export default function IncomingRequests() {
  const { addToast = () => {} } = useOutletContext() || {};

  const [requests, setRequests] = useState([]);
  const [procurements, setProcurements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  // { kind: 'request' | 'procurement', item }
  const [rejectTarget, setRejectTarget] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [reqs, procs] = await Promise.all([
        fetchDeptRequests({ status: 'Pending' }),
        fetchDeptProcurements({ status: 'Pending Approval' })
      ]);
      setRequests(reqs || []);
      setProcurements(procs || []);
    } catch (err) {
      addToast(err.message || 'Failed to load incoming requests', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const runAction = async (id, action, successMsg, type = 'success') => {
    setBusyId(id);
    try {
      await action(id);
      addToast(successMsg, type);
      await loadData();
    } catch (err) {
      addToast(err.message || 'Action failed', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleApproveRequest = (req) =>
    runAction(req.id, approveDeptRequest, `Request ${req.id} approved. Passed to Staff for allocation.`);

  const handleApproveProcurement = (proc) =>
    runAction(proc.id, approveDeptProcurement, `Procurement ${proc.id} approved. Sent to Registrar.`);

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    const { kind, item } = rejectTarget;
    setRejectTarget(null);
    if (kind === 'request') {
      await runAction(item.id, rejectDeptRequest, `Request ${item.id} rejected.`, 'error');
    } else {
      await runAction(item.id, rejectDeptProcurement, `Procurement ${item.id} rejected.`, 'error');
    }
  };

  return (
    <div className="view-section active">
      <h1 className="page-title">Incoming Requests</h1>
      <p className="page-subtitle">Review pending resource requests from your department staff.</p>

      <div className="data-section">
        <div className="data-section-header">
          <div className="data-section-title">Pending Approvals</div>
          <span className="badge bg-primary">{requests.length} pending</span>
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Req ID</th>
                <th>Requestor</th>
                <th>Resource Type</th>
                <th>Qty</th>
                <th>Priority</th>
                <th>Reason</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <EmptyRow colSpan={7} isLoading={isLoading} message="No pending requests. You're all caught up!" />
              ) : (
                requests.map((req) => (
                  <tr key={req.id}>
                    <td className="td-id">{req.id}</td>
                    <td>{req.requestor}</td>
                    <td>{req.resourceType}</td>
                    <td>{pad2(req.quantity)}</td>
                    <td>{req.priority || 'Normal'}</td>
                    <td className="dh-muted-cell">{req.justification}</td>
                    <td className="dh-action-cell">
                      <button
                        type="button"
                        className="btn-primary dh-btn-sm dh-btn-approve"
                        disabled={busyId === req.id}
                        onClick={() => handleApproveRequest(req)}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="btn-danger dh-btn-sm"
                        disabled={busyId === req.id}
                        onClick={() => setRejectTarget({ kind: 'request', item: req })}
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
          <span className="badge bg-primary">{procurements.length} pending</span>
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
                <EmptyRow colSpan={7} isLoading={isLoading} message="No procurement requests awaiting your approval." />
              ) : (
                procurements.map((p) => (
                  <tr key={p.id}>
                    <td className="td-id">{p.id}</td>
                    <td>{p.requester || p.requestedBy || 'Unknown'}</td>
                    <td>{p.item || p.resourceType}</td>
                    <td>{pad2(p.quantity)}</td>
                    <td className="dh-muted-cell">{p.justification}</td>
                    <td><FileLink name={p.specFileName} dataUrl={p.specFileDataUrl} /></td>
                    <td className="dh-action-cell">
                      <button
                        type="button"
                        className="btn-primary dh-btn-sm dh-btn-approve"
                        disabled={busyId === p.id}
                        onClick={() => handleApproveProcurement(p)}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="btn-danger dh-btn-sm"
                        disabled={busyId === p.id}
                        onClick={() => setRejectTarget({ kind: 'procurement', item: p })}
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

      <AdminModal
        isOpen={Boolean(rejectTarget)}
        title={rejectTarget?.kind === 'procurement' ? 'Reject Procurement Request' : 'Reject Resource Request'}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleConfirmReject}
        confirmText="Reject"
        confirmButtonClass="btn-danger"
      >
        <p style={{ fontSize: '0.9rem', color: '#475569', margin: 0 }}>
          Are you sure you want to reject <strong>{rejectTarget?.item.id}</strong> (
          {rejectTarget?.item.resourceType || rejectTarget?.item.item}) requested by{' '}
          <strong>
            {rejectTarget?.item.requestor || rejectTarget?.item.requester || rejectTarget?.item.requestedBy}
          </strong>
          ? This cannot be undone.
        </p>
      </AdminModal>
    </div>
  );
}
