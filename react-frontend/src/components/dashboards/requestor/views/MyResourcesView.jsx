import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  fetchResources,
  fetchProcurements,
  requestResourceMaintenance,
  initiateResourceReturn,
  confirmRepairedAllocation,
  requestResourceExtension
} from '../../../../services/requestor';

export default function MyResourcesView({ addToast, onPreviewFile }) {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [procurements, setProcurements] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resList, procList] = await Promise.all([
        fetchResources({ status: 'Allocated,Maintenance Requested,Maintenance,Repaired' }).catch(() => []),
        fetchProcurements().catch(() => [])
      ]);

      // Strictly ensure only allocated resources belonging to the active requestor are shown
      const uName = user?.name ? user.name.trim().toLowerCase() : '';
      const uId = user?.id;

      const myAllocatedList = (resList || []).filter((r) => {
        // Exclude unallocated or closed states
        if (!['Allocated', 'Maintenance Requested', 'Maintenance', 'Repaired'].includes(r.status)) {
          return false;
        }
        if (!r.assignedTo || r.assignedTo === 'None') {
          return false;
        }
        // Match by id OR match by name
        const idMatches = Boolean(uId && r.assignedToId && r.assignedToId === uId);
        const nameMatches = Boolean(uName && r.assignedTo && r.assignedTo.trim().toLowerCase() === uName);
        return idMatches || nameMatches;
      });

      setResources(myAllocatedList);
      setProcurements(procList || []);
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const [maintenanceModalItem, setMaintenanceModalItem] = useState(null);
  const [maintIssue, setMaintIssue] = useState('');
  const [maintPriority, setMaintPriority] = useState('Medium');

  const [returnModalItem, setReturnModalItem] = useState(null);
  const [returnReason, setReturnReason] = useState('Project Completed');
  const [returnNotes, setReturnNotes] = useState('');

  const [extensionModalItem, setExtensionModalItem] = useState(null);
  const [proposedReturnDate, setProposedReturnDate] = useState('');
  const [extensionReason, setExtensionReason] = useState('');

  const handleOpenMaintenance = (res) => {
    setMaintenanceModalItem(res);
    setMaintIssue('');
    setMaintPriority('Medium');
  };

  const handleOpenReturn = (res) => {
    setReturnModalItem(res);
    setReturnReason('Project Completed');
    setReturnNotes('');
  };

  const handleOpenExtension = (res) => {
    setExtensionModalItem(res);
    // Suggest default extended date: 7 days after current returnDate, or 7 days from now
    const base = res.returnDate ? new Date(res.returnDate) : new Date();
    base.setDate(base.getDate() + 7);
    setProposedReturnDate(base.toISOString().split('T')[0]);
    setExtensionReason('');
  };

  const handleConfirmExtensionSubmit = async (e) => {
    e.preventDefault();
    if (!extensionModalItem) return;
    if (!proposedReturnDate) {
      addToast('Please select a proposed return date.', 'error');
      return;
    }
    if (!extensionReason.trim()) {
      addToast('Please provide a justification for the extension request.', 'error');
      return;
    }
    const resId = extensionModalItem.id;
    setActionLoadingId(resId);
    try {
      await requestResourceExtension(resId, {
        proposedReturnDate,
        reason: extensionReason.trim(),
      });
      addToast('Extension request submitted to Department Head for review.', 'success');
      setExtensionModalItem(null);
      await loadData();
    } catch (err) {
      console.error('Extension request failed:', err);
      addToast(err.message || 'Failed to submit extension request.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmMaintenanceSubmit = async (e) => {
    e.preventDefault();
    if (!maintenanceModalItem) return;
    if (!maintIssue.trim()) {
      addToast('Please provide a description of the issue.', 'error');
      return;
    }
    const resId = maintenanceModalItem.id;
    setActionLoadingId(resId);
    try {
      await requestResourceMaintenance(resId, {
        issue: maintIssue.trim(),
        priority: maintPriority,
      });
      addToast('Maintenance request submitted successfully.', 'success');
      setMaintenanceModalItem(null);
      await loadData();
    } catch (err) {
      console.error('Maintenance request failed:', err);
      addToast(err.message || 'Failed to submit maintenance request.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnModalItem) return;
    const resId = returnModalItem.id;
    setActionLoadingId(resId);
    try {
      await initiateResourceReturn(resId, {
        reason: returnReason,
        notes: returnNotes.trim(),
      });
      addToast('Resource returned successfully and sent for inspection.', 'success');
      setReturnModalItem(null);
      await loadData();
    } catch (err) {
      console.error('Resource return failed:', err);
      addToast(err.message || 'Failed to initiate resource return.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmRepaired = async (resId) => {
    setActionLoadingId(resId);
    try {
      await confirmRepairedAllocation(resId);
      addToast('Repaired allocation confirmed.', 'success');
      await loadData();
    } catch (err) {
      console.error('Confirm repaired allocation failed:', err);
      addToast(err.message || 'Failed to confirm repaired allocation.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getDeadlineStatus = (res) => {
    if (res.status !== 'Allocated') {
      return { isOverdue: false, isApproaching: false, daysLeft: null };
    }
    const dStr = res.returnDate;
    if (!dStr) {
      return { isOverdue: false, isApproaching: false, daysLeft: null };
    }
    const parsed = Date.parse(dStr);
    if (isNaN(parsed)) {
      return { isOverdue: false, isApproaching: false, daysLeft: null };
    }
    const deadline = new Date(parsed);
    deadline.setHours(23, 59, 59, 999);
    const diffMs = deadline.getTime() - Date.now();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffMs < 0) {
      return { isOverdue: true, isApproaching: false, daysLeft };
    } else if (daysLeft <= 3) {
      return { isOverdue: false, isApproaching: true, daysLeft };
    }
    return { isOverdue: false, isApproaching: false, daysLeft };
  };

  const overdueItems = resources.filter((r) => getDeadlineStatus(r).isOverdue);
  const approachingItems = resources.filter((r) => getDeadlineStatus(r).isApproaching && r.extensionStatus !== 'Pending');

  const filteredResources = resources.filter((res) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (res.id && res.id.toLowerCase().includes(term)) ||
      (res.name && res.name.toLowerCase().includes(term)) ||
      (res.type && res.type.toLowerCase().includes(term)) ||
      (res.department && res.department.toLowerCase().includes(term)) ||
      (res.status && res.status.toLowerCase().includes(term))
    );
  });

  return (
    <div className="view-section">
      <h1 className="page-title">My Resources</h1>
      <p className="page-subtitle">Currently allocated resources to you.</p>

      {/* Urgent Overdue Return Alert Banner */}
      {overdueItems.length > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            border: '2px solid #ef4444',
            borderRadius: 14,
            padding: '1.1rem 1.35rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            boxShadow: '0 4px 14px rgba(220,38,38,0.15)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#dc2626' }}>
              warning
            </span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#991b1b' }}>
                🚨 ACTION REQUIRED: {overdueItems.length} Allocated Resource{overdueItems.length > 1 ? 's are' : ' is'} Past Return Deadline
              </div>
              <div style={{ fontSize: 12, color: '#b91c1c', marginTop: 3 }}>
                University policy requires prompt return once allocated duration expires. If you still need this resource, please click "Request Extension" or return it now.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => handleOpenExtension(overdueItems[0])}
              style={{
                background: '#f59e0b',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(245,158,11,0.3)'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>update</span>
              Request Extension
            </button>
            <button
              onClick={() => handleOpenReturn(overdueItems[0])}
              style={{
                background: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(220,38,38,0.3)'
              }}
            >
              Return Overdue Asset →
            </button>
          </div>
        </div>
      )}

      {/* Proactive Approaching Deadline Alert Banner */}
      {approachingItems.length > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '2px solid #f59e0b',
            borderRadius: 14,
            padding: '1.1rem 1.35rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            boxShadow: '0 4px 14px rgba(245,158,11,0.15)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#d97706' }}>
              schedule
            </span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#92400e' }}>
                ⏰ DEADLINE APPROACHING: {approachingItems.length} Allocated Resource{approachingItems.length > 1 ? 's are' : ' is'} Due Within 3 Days
              </div>
              <div style={{ fontSize: 12, color: '#b45309', marginTop: 3 }}>
                Return deadlines are approaching soon. Need more time to finish your tasks? You can request an extension for Department Head review.
              </div>
            </div>
          </div>

          <button
            onClick={() => handleOpenExtension(approachingItems[0])}
            style={{
              background: '#d97706',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 18px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(217,119,6,0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>update</span>
            Request Extension →
          </button>
        </div>
      )}

      <div className="data-section">
        <div className="data-section-header">
          <div className="data-section-title">Allocated Assets</div>
          <div className="search-bar" style={{ width: '260px' }}>
            <span className="material-symbols-outlined search-icon" style={{ fontSize: '18px' }}>
              search
            </span>
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <span
                className="clear-btn"
                style={{ display: 'inline-flex' }}
                onClick={() => setSearchTerm('')}
              >
                ✕
              </span>
            )}
          </div>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Resource Code</th>
                <th>Resource Type</th>
                <th>Department</th>
                <th>Allocated Date</th>
                <th>Return Deadline</th>
                <th>Status</th>
                <th>Invoice</th>
                <th style={{ textAlign: 'right', minWidth: '240px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Loading allocated resources...
                  </td>
                </tr>
              ) : filteredResources.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    {searchTerm ? 'No resources match your search.' : 'No resources currently allocated to you.'}
                  </td>
                </tr>
              ) : (
                filteredResources.map((res) => {
                  const { isOverdue: overdue, isApproaching, daysLeft } = getDeadlineStatus(res);
                  let statusBadge = <span className="badge">{res.status}</span>;
                  let actions = null;

                  if (res.status === 'Allocated') {
                    if (res.extensionStatus === 'Pending') {
                      statusBadge = (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <span className="badge allocated">{res.status}</span>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: 6,
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1.5px solid #93c5fd',
                              fontWeight: 700,
                              fontSize: 11,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#2563eb' }}>hourglass_top</span>
                            Extension Pending
                          </span>
                        </div>
                      );
                      actions = (
                        <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 600, padding: '4px 8px', background: '#eff6ff', borderRadius: 6, border: '1px solid #bfdbfe' }}>
                            ⏳ Under Dept Review
                          </span>
                          <button
                            className="btn-danger"
                            style={{ fontSize: '0.82rem', padding: '0.3rem 0.8rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}
                            disabled={actionLoadingId === res.id}
                            onClick={() => handleOpenReturn(res)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>assignment_return</span>
                            Return
                          </button>
                        </div>
                      );
                    } else if (overdue) {
                      statusBadge = (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              background: '#fef2f2',
                              color: '#b91c1c',
                              border: '1.5px solid #f87171',
                              fontWeight: 800,
                              fontSize: 11,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#dc2626' }}>warning</span>
                            OVERDUE RETURN
                          </span>
                        </div>
                      );
                      actions = (
                        <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button
                            style={{
                              background: '#f59e0b',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: 7,
                              padding: '6px 12px',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              cursor: 'pointer',
                              boxShadow: '0 2px 6px rgba(245,158,11,0.25)'
                            }}
                            disabled={actionLoadingId === res.id}
                            onClick={() => handleOpenExtension(res)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>update</span>
                            Extend
                          </button>
                          <button
                            style={{
                              background: '#dc2626',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: 7,
                              padding: '6px 14px',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              cursor: 'pointer',
                              boxShadow: '0 2px 6px rgba(220,38,38,0.3)'
                            }}
                            disabled={actionLoadingId === res.id}
                            onClick={() => handleOpenReturn(res)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>assignment_return</span>
                            Force Return Now
                          </button>
                        </div>
                      );
                    } else {
                      statusBadge = (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <span className="badge allocated">{res.status}</span>
                          {isApproaching && (
                            <span
                              style={{
                                padding: '2px 7px',
                                borderRadius: 5,
                                background: '#fffbeb',
                                color: '#b45309',
                                border: '1px solid #fcd34d',
                                fontWeight: 700,
                                fontSize: 10,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>schedule</span>
                              Due in {daysLeft <= 1 ? 'Tomorrow' : `${daysLeft} days`}
                            </span>
                          )}
                        </div>
                      );
                      actions = (
                        <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button
                            style={{
                              background: isApproaching ? '#f59e0b' : '#3b82f6',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: 7,
                              padding: '6px 12px',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              cursor: 'pointer',
                              boxShadow: isApproaching ? '0 2px 6px rgba(245,158,11,0.25)' : '0 2px 6px rgba(59,130,246,0.25)'
                            }}
                            disabled={actionLoadingId === res.id}
                            onClick={() => handleOpenExtension(res)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>update</span>
                            Extend
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ fontSize: '0.82rem', padding: '0.3rem 0.8rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}
                            disabled={actionLoadingId === res.id}
                            onClick={() => handleOpenMaintenance(res)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>build</span>
                            Maintenance
                          </button>
                          <button
                            className="btn-danger"
                            style={{ fontSize: '0.82rem', padding: '0.3rem 0.8rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}
                            disabled={actionLoadingId === res.id}
                            onClick={() => handleOpenReturn(res)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>assignment_return</span>
                            Return
                          </button>
                        </div>
                      );
                    }
                  } else if (res.status === 'Maintenance Requested' || res.status === 'Maintenance') {
                    statusBadge = (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span className="badge maintenance">{res.status}</span>
                        {res.maintenanceIssue && (
                          <span style={{ fontSize: '0.72rem', color: '#64748b', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={res.maintenanceIssue}>
                            {res.maintenanceIssue}
                          </span>
                        )}
                      </div>
                    );
                    actions = <span className="text-muted" style={{ fontSize: '0.75rem' }}>Under Review</span>;
                  } else if (res.status === 'Repaired') {
                    statusBadge = (
                      <span className="badge allocated" style={{ background: '#dcfce7', color: '#166534' }}>
                        Repaired
                      </span>
                    );
                    actions = (
                      <button
                        className="btn-primary"
                        style={{ fontSize: '0.75rem' }}
                        disabled={actionLoadingId === res.id}
                        onClick={() => handleConfirmRepaired(res.id)}
                      >
                        Confirm Allocation
                      </button>
                    );
                  }

                  const srcProc = res.procurementId
                    ? procurements.find((p) => p.id === res.procurementId)
                    : null;

                  const invoiceFileName = srcProc?.invoiceFileName || res.invoiceFileName;
                  const invoiceFileDataUrl = srcProc?.invoiceFileDataUrl || res.invoiceFileDataUrl;
                  const invoiceFileType = srcProc?.invoiceFileType || res.invoiceFileType;

                  const invoiceCell = invoiceFileName ? (
                    <button
                      type="button"
                      className="spec-file-link"
                      onClick={() =>
                        onPreviewFile({
                          name: invoiceFileName,
                          type: invoiceFileType || 'application/pdf',
                          dataUrl: invoiceFileDataUrl
                        })
                      }
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>visibility</span>
                      {invoiceFileName}
                    </button>
                  ) : (
                    <span style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>—</span>
                  );

                  return (
                    <tr key={res.id} style={overdue ? { background: '#fef2f2' } : {}}>
                      <td className="td-id">
                        <span style={{ fontWeight: 600 }}>{res.id}</span>
                      </td>
                      <td>{res.type}</td>
                      <td>{res.department}</td>
                      <td>{res.date || '—'}</td>
                      <td>
                        {res.returnDateDisplay || res.returnDate ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: overdue ? 700 : (isApproaching ? 700 : 500), color: overdue ? '#dc2626' : (isApproaching ? '#b45309' : '#334155'), fontSize: '0.85rem' }}>
                              {res.returnDateDisplay || res.returnDate}
                            </span>
                            {res.extensionStatus === 'Pending' ? (
                              <span style={{ fontSize: '0.72rem', color: '#1d4ed8', fontWeight: 600 }}>
                                Req. Ext: {res.extensionProposedReturnDateDisplay || res.extensionProposedReturnDate}
                              </span>
                            ) : overdue ? (
                              <span style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 700 }}>
                                Past Deadline
                              </span>
                            ) : isApproaching ? (
                              <span style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 600 }}>
                                Due Soon
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>—</span>
                        )}
                      </td>
                      <td>{statusBadge}</td>
                      <td>{invoiceCell}</td>
                      <td style={{ textAlign: 'right' }}>{actions}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Maintenance Request Modal */}
      {maintenanceModalItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ background: '#f8fafc', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 22 }}>build</span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Request Maintenance</h3>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{maintenanceModalItem.type} — {maintenanceModalItem.id}</div>
                </div>
              </div>
              <button onClick={() => setMaintenanceModalItem(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmMaintenanceSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Issue / Fault Description <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  value={maintIssue}
                  onChange={(e) => setMaintIssue(e.target.value)}
                  placeholder="Describe the malfunction (e.g., Screen flickering constantly, battery fails to charge, OS crashing on boot...)"
                  rows={4}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Priority / Urgency
                </label>
                <select
                  value={maintPriority}
                  onChange={(e) => setMaintPriority(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff', boxSizing: 'border-box' }}
                >
                  <option value="Low">Low — Minor issue, still usable</option>
                  <option value="Medium">Medium — Impacting daily productivity</option>
                  <option value="High">High — Device unusable, critical work stopped</option>
                  <option value="Critical">Critical — Hardware safety hazard / complete failure</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setMaintenanceModalItem(null)}
                  style={{ padding: '9px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === maintenanceModalItem.id}
                  style={{ padding: '9px 20px', background: '#d97706', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>send</span>
                  {actionLoadingId === maintenanceModalItem.id ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Asset Modal */}
      {returnModalItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ background: '#f8fafc', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 22 }}>assignment_return</span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Return Asset</h3>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{returnModalItem.type} — {returnModalItem.id}</div>
                </div>
              </div>
              <button onClick={() => setReturnModalItem(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmReturnSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Reason for Return <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff', boxSizing: 'border-box' }}
                >
                  <option value="Project Completed">Project Completed / Finished</option>
                  <option value="Hardware Fault / Broken">Hardware Fault / Broken (Needs Maintenance)</option>
                  <option value="Employee Offboarding">Employee Resignation / Offboarding</option>
                  <option value="Equipment Upgrade">Equipment Upgrade / Replacement</option>
                  <option value="No Longer Needed">No Longer Needed / Surplus</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Return Notes / Condition Details
                </label>
                <textarea
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Notes on condition, accessories included (e.g., power adapter returned, slight dent on bottom corner)..."
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setReturnModalItem(null)}
                  style={{ padding: '9px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === returnModalItem.id}
                  style={{ padding: '9px 20px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>assignment_turned_in</span>
                  {actionLoadingId === returnModalItem.id ? 'Processing...' : 'Confirm Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extension Request Modal */}
      {extensionModalItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ background: '#f8fafc', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 22 }}>update</span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Request Deadline Extension</h3>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{extensionModalItem.type} — {extensionModalItem.id}</div>
                </div>
              </div>
              <button onClick={() => setExtensionModalItem(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmExtensionSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div style={{ padding: '10px 14px', background: '#f1f5f9', borderRadius: 10, fontSize: 12, color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>Current Deadline:</strong>{' '}
                  <span style={{ color: '#0f172a', fontWeight: 600 }}>
                    {extensionModalItem.returnDateDisplay || extensionModalItem.returnDate || 'Not specified'}
                  </span>
                </div>
                <div>
                  <strong>Serial Number:</strong>{' '}
                  <span style={{ color: '#0f172a', fontWeight: 600 }}>
                    {extensionModalItem.serialNumber || '—'}
                  </span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  New Proposed Return Date <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="date"
                  value={proposedReturnDate}
                  min={
                    extensionModalItem.returnDate
                      ? new Date(Date.parse(extensionModalItem.returnDate) + 86400000).toISOString().split('T')[0]
                      : new Date().toISOString().split('T')[0]
                  }
                  onChange={(e) => setProposedReturnDate(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff', boxSizing: 'border-box' }}
                />
                <span style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'block' }}>
                  Select the extended date until which you require this resource.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Justification for Extension <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  placeholder="Detail why additional time is required (e.g., Client demo scheduled for next Friday, need extra days for code review and testing...)"
                  rows={4}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setExtensionModalItem(null)}
                  style={{ padding: '9px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === extensionModalItem.id}
                  style={{ padding: '9px 20px', background: '#d97706', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>send</span>
                  {actionLoadingId === extensionModalItem.id ? 'Submitting...' : 'Submit Extension Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
