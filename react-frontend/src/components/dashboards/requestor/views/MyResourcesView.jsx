import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  fetchResources,
  fetchProcurements,
  requestResourceMaintenance,
  initiateResourceReturn,
  confirmRepairedAllocation
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

  const isOverdue = (res) => {
    if (res.status !== 'Allocated') return false;
    const dStr = res.returnDate;
    if (!dStr) return false;
    const parsed = Date.parse(dStr);
    if (isNaN(parsed)) return false;
    const deadline = new Date(parsed);
    deadline.setHours(23, 59, 59, 999);
    return Date.now() > deadline.getTime();
  };

  const overdueItems = resources.filter(isOverdue);

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
                University policy requires immediate return once the allocated duration expires. Notifications have been dispatched. Please click "Force Return Now" below.
              </div>
            </div>
          </div>

          <button
            onClick={() => handleOpenReturn(overdueItems[0])}
            style={{
              background: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 18px',
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
                <th style={{ textAlign: 'right', minWidth: '220px' }}>Actions</th>
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
                  const overdue = isOverdue(res);
                  let statusBadge = <span className="badge">{res.status}</span>;
                  let actions = null;

                  if (res.status === 'Allocated') {
                    if (overdue) {
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
                      statusBadge = <span className="badge allocated">{res.status}</span>;
                      actions = (
                        <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', justifyContent: 'flex-end' }}>
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
                            <span style={{ fontWeight: overdue ? 700 : 500, color: overdue ? '#dc2626' : '#334155', fontSize: '0.85rem' }}>
                              {res.returnDateDisplay || res.returnDate}
                            </span>
                            {overdue && (
                              <span style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 700 }}>
                                Past Deadline
                              </span>
                            )}
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
    </div>
  );
}
