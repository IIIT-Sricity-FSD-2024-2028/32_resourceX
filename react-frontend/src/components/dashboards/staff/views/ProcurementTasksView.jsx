import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { fetchStaffProcurements, logStaffPurchase } from '../../../../services/staff';

function getProcurementDeadlineInfo(targetDate) {
  if (!targetDate) return null;
  const target = new Date(targetDate);
  if (isNaN(target.getTime())) return null;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const diffDays = Math.round((startOfTarget - startOfToday) / (1000 * 60 * 60 * 24));
  return {
    diffDays,
    isOverdue: diffDays < 0,
    isApproaching: diffDays >= 0 && diffDays <= 3,
    isToday: diffDays === 0
  };
}

export default function ProcurementTasksView({ addToast, onProcurementLogged }) {
  const { user } = useAuth();
  const department = user?.department || 'IT Services';

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formInputs, setFormInputs] = useState({}); // procId -> { vendor, invoice, file, fileName, fileDataUrl }
  const [submittingId, setSubmittingId] = useState(null);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchStaffProcurements({ department });
      const list = Array.isArray(res) ? res : [];
      // Only approved procurements need to be logged by staff
      setTasks(list.filter((p) => p.status === 'Approved'));
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to load procurement tasks.', 'error');
    } finally {
      setLoading(false);
    }
  }, [department, addToast]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleInputChange = (procId, field, value) => {
    setFormInputs((prev) => ({
      ...prev,
      [procId]: {
        ...(prev[procId] || {}),
        [field]: value
      }
    }));
  };

  const handleFileChange = (procId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg'
    ];
    if (!allowed.includes(file.type)) {
      if (addToast) addToast('Unsupported file type. Please upload PDF, DOC, DOCX, PNG or JPG.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      if (addToast) addToast('File too large. Maximum size is 5 MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setFormInputs((prev) => ({
        ...prev,
        [procId]: {
          ...(prev[procId] || {}),
          file,
          fileName: file.name,
          fileDataUrl: uploadEvent.target?.result
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleLogPurchase = async (proc) => {
    const inputs = formInputs[proc.id] || {};
    const vendor = (inputs.vendor || '').trim();
    const invoice = (inputs.invoice || '').trim();

    if (!vendor) {
      if (addToast) addToast('Please enter a vendor name.', 'error');
      return;
    }
    if (!invoice) {
      if (addToast) addToast('Please enter an invoice number.', 'error');
      return;
    }

    try {
      setSubmittingId(proc.id);
      await logStaffPurchase(proc.id, {
        vendor,
        invoice,
        invoiceFile: inputs.fileDataUrl || undefined,
        invoiceFileName: inputs.fileName || undefined,
        invoiceFileSize: inputs.file ? inputs.file.size : undefined,
        invoiceFileType: inputs.file ? inputs.file.type : undefined
      });

      if (addToast) {
        addToast(`Purchase logged for ${proc.id} (${vendor}) successfully.`, 'success');
      }

      setFormInputs((prev) => {
        const next = { ...prev };
        delete next[proc.id];
        return next;
      });

      await loadTasks();
      if (onProcurementLogged) onProcurementLogged();
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to log purchase.', 'error');
    } finally {
      setSubmittingId(null);
    }
  };

  const urgentTasks = useMemo(() => {
    return tasks.filter((t) => {
      const info = getProcurementDeadlineInfo(t.targetDate);
      return info && (info.isApproaching || info.isOverdue);
    });
  }, [tasks]);

  return (
    <div className="view-section active">
      <h1 className="page-title">Procurement Fulfillment</h1>
      <p className="page-subtitle">
        Process Registrar-approved purchases by logging vendor and invoice data.
      </p>

      {/* Approaching / Overdue Target Date Alert */}
      {urgentTasks.length > 0 && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            backgroundColor: '#fffbeb',
            border: '1px solid #f59e0b',
            color: '#92400e',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.85rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.6rem', color: '#d97706', marginTop: '2px' }}>
            notification_important
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Procurement Deadline Alert: {urgentTasks.length} task{urgentTasks.length > 1 ? 's' : ''} approaching or past target date</span>
              <span style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '1px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600 }}>
                High Priority
              </span>
            </div>
            <div style={{ fontSize: '0.825rem', color: '#78350f', lineHeight: 1.45 }}>
              The department head specified a suggested fulfillment date for these items. Please fulfill as soon as possible.
              <span style={{ display: 'inline-block', marginLeft: 6, fontWeight: 500, color: '#047857' }}>
                ✓ Note: Purchases can still be submitted and logged normally even after the target date.
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="data-section">
        {loading ? (
          <div className="staff-loading-container">
            <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>
              sync
            </span>
            <span>Loading procurement tasks...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="staff-empty-state" style={{ padding: '3rem 1rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#94a3b8' }}>
              assignment_turned_in
            </span>
            <p style={{ marginTop: '0.75rem', fontSize: '1rem', color: '#64748b' }}>
              No pending procurement tasks for {department}.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table" id="proctask-tbody">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>TASK ID / TYPE</th>
                  <th style={{ width: '20%' }}>TARGET DEADLINE</th>
                  <th style={{ width: '10%' }}>QTY</th>
                  <th style={{ width: '33%' }}>VENDOR & INVOICE</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((p) => {
                  const inputs = formInputs[p.id] || {};
                  const isSubmitting = submittingId === p.id;
                  const displayId = `PT-${p.id.split('-')[1] || p.id}`;

                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="td-id">{displayId}</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b', marginTop: '2px' }}>
                          {p.resourceType || p.item}
                        </div>
                        {p.justification && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.justification}>
                            Reason: {p.justification}
                          </div>
                        )}
                      </td>
                      <td>
                        {p.targetDate ? (() => {
                          const info = getProcurementDeadlineInfo(p.targetDate);
                          if (!info) {
                            return (
                              <span style={{ fontSize: '0.825rem', color: '#334155' }}>
                                📅 {p.targetDateDisplay || p.targetDate}
                              </span>
                            );
                          }
                          if (info.isOverdue) {
                            return (
                              <div>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '6px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700 }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>warning</span>
                                  <span>{Math.abs(info.diffDays)}d Past Target</span>
                                </div>
                                <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '3px' }}>
                                  Target: {p.targetDateDisplay || p.targetDate}
                                </div>
                              </div>
                            );
                          }
                          if (info.isApproaching) {
                            return (
                              <div>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', borderRadius: '6px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700 }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>alarm</span>
                                  <span>Due {info.isToday ? 'Today' : `in ${info.diffDays} day${info.diffDays === 1 ? '' : 's'}`}</span>
                                </div>
                                <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '3px' }}>
                                  Target: {p.targetDateDisplay || p.targetDate}
                                </div>
                              </div>
                            );
                          }
                          return (
                            <div>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 600 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>event</span>
                                <span>{info.diffDays} days left</span>
                              </div>
                              <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '3px' }}>
                                Target: {p.targetDateDisplay || p.targetDate}
                              </div>
                            </div>
                          );
                        })() : (
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                            No target date specified
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.quantity}</span>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          style={{ marginBottom: '0.35rem', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                          placeholder="Vendor Name"
                          value={inputs.vendor || ''}
                          onChange={(e) => handleInputChange(p.id, 'vendor', e.target.value)}
                        />
                        <input
                          type="text"
                          className="form-control"
                          style={{ marginBottom: '0.35rem', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                          placeholder="Invoice Number"
                          value={inputs.invoice || ''}
                          onChange={(e) => handleInputChange(p.id, 'invoice', e.target.value)}
                        />
                        <input
                          type="file"
                          style={{ fontSize: '0.75rem', width: '100%' }}
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                          onChange={(e) => handleFileChange(p.id, e)}
                        />
                        {inputs.fileName && (
                          <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.2rem', fontWeight: 500 }}>
                            Attached: {inputs.fileName}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => handleLogPurchase(p)}
                          disabled={isSubmitting}
                          style={{ fontSize: '0.825rem', padding: '0.45rem 1rem' }}
                        >
                          {isSubmitting ? 'Logging...' : 'Log Purchase'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
