import React, { useState, useEffect } from 'react';
import {
  fetchRegistrarProcurements,
  approveRegistrarProcurement,
  rejectRegistrarProcurement
} from '../../../../services/registrar';

/**
 * ProcurementApprovalsView
 * Allows the Registrar to review, approve, or reject procurement requisitions
 * submitted by Department Heads. Also allows inspection of attached specification files.
 */
export default function ProcurementApprovalsView({ addToast, onPreviewFile }) {
  // Local state
  const [procurements, setProcurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Processing state for buttons to prevent duplicate clicks
  const [processingId, setProcessingId] = useState(null);

  // Load procurements from backend API
  const loadProcurements = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchRegistrarProcurements();
      setProcurements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching procurements:', err);
      setError('Failed to load procurements from server.');
      if (addToast) addToast('Error loading procurements', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProcurements();
  }, []);

  // Accept / Approve handler
  const handleAccept = async (id) => {
    setProcessingId(id);
    try {
      await approveRegistrarProcurement(id);
      if (addToast) {
        addToast(`Procurement ${id} approved! Forwarded to Staff warehouse.`, 'success');
      }
      await loadProcurements();
    } catch (err) {
      console.error(err);
      if (addToast) {
        addToast(`Failed to approve procurement: ${err.message || 'Error'}`, 'error');
      }
    } finally {
      setProcessingId(null);
    }
  };

  // Reject handler
  const handleReject = async (id) => {
    const reasonConfirm = window.confirm(`Confirm rejection of procurement request ${id}?`);
    if (!reasonConfirm) return;

    setProcessingId(id);
    try {
      await rejectRegistrarProcurement(id);
      if (addToast) {
        addToast(`Procurement ${id} marked as Rejected.`, 'warning');
      }
      await loadProcurements();
    } catch (err) {
      console.error(err);
      if (addToast) {
        addToast(`Failed to reject procurement: ${err.message || 'Error'}`, 'error');
      }
    } finally {
      setProcessingId(null);
    }
  };

  // Open specification file preview
  const handleViewSpecFile = (proc) => {
    if (proc.specFile) {
      if (onPreviewFile) {
        onPreviewFile({
          name: proc.specFileName || `Spec_${proc.id}.pdf`,
          type: proc.specFileType || 'application/pdf',
          dataUrl: proc.specFile
        });
      }
    } else {
      if (addToast) {
        addToast('No specification attachment file found for this procurement.', 'warning');
      }
    }
  };

  // Filter procurements based on state
  const filteredProcurements = procurements.filter((p) => {
    // Status filter
    if (statusFilter !== 'All') {
      if (statusFilter === 'Approved' && (p.status === 'Approved' || p.status === 'Fulfilled')) {
        // match
      } else if (p.status !== statusFilter) {
        return false;
      }
    }

    // Department filter
    if (departmentFilter !== 'All' && p.department !== departmentFilter) {
      return false;
    }

    // Search term filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchId = (p.id || '').toLowerCase().includes(q);
      const matchItem = (p.resourceType || p.item || '').toLowerCase().includes(q);
      const matchBy = (p.requestedBy || p.requester || '').toLowerCase().includes(q);
      const matchDept = (p.department || '').toLowerCase().includes(q);
      if (!matchId && !matchItem && !matchBy && !matchDept) return false;
    }

    return true;
  });

  // Calculate statistics counts
  const totalCount = procurements.length;
  const pendingCount = procurements.filter((p) => p.status === 'Pending').length;
  const approvedCount = procurements.filter((p) => p.status === 'Approved' || p.status === 'Fulfilled').length;
  const rejectedCount = procurements.filter((p) => p.status === 'Rejected').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Title & Refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-color, #0F386E)', marginBottom: '0.25rem' }}>
            Procurement Management & Approvals
          </h1>
          <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.9rem' }}>
            Review hardware and software procurement requests submitted by Department Heads across the university.
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={loadProcurements}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>refresh</span>
          Refresh
        </button>
      </div>

      {/* 4 Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Procurements
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#0F386E' }}>{totalCount}</span>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#93c5fd' }}>shopping_cart</span>
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ color: '#d97706', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Pending Approval
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#d97706' }}>{pendingCount}</span>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#fde68a' }}>hourglass_empty</span>
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ color: '#16a34a', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Approved
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#16a34a' }}>{approvedCount}</span>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#86efac' }}>check_circle</span>
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ color: '#dc2626', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Rejected
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#dc2626' }}>{rejectedCount}</span>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#fca5a5' }}>cancel</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: '#ffffff',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color, #e2e8f0)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        <div style={{ flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search by ID, item name, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        </div>

        <div style={{ width: '180px' }}>
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          >
            <option value="All">Status: All</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div style={{ width: '180px' }}>
          <select
            className="form-control"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          >
            <option value="All">Department: All</option>
            <option value="IT Services">IT Services</option>
            <option value="HR Dept">HR Dept</option>
            <option value="Operations">Operations</option>
            <option value="Facilities">Facilities</option>
            <option value="Administration">Administration</option>
            <option value="Engineering">Engineering</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: 'var(--shadow-sm)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
            Procurement Requisitions ({filteredProcurements.length})
          </h2>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}>
              sync
            </span>
            <p style={{ marginTop: '0.5rem' }}>Loading procurement records...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
            <p>{error}</p>
            <button type="button" className="btn-secondary" onClick={loadProcurements} style={{ marginTop: '0.5rem' }}>
              Retry
            </button>
          </div>
        ) : filteredProcurements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: '#cbd5e1' }}>
              search_off
            </span>
            <p style={{ marginTop: '0.5rem', fontWeight: 500 }}>No procurement records match your filters.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Proc ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Requested By</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Resource Type</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Qty</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Justification</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Spec File</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProcurements.map((proc) => {
                  const isPending = proc.status === 'Pending';
                  const isApproved = proc.status === 'Approved' || proc.status === 'Fulfilled';
                  const isRejected = proc.status === 'Rejected';
                  const isProcessing = processingId === proc.id;

                  return (
                    <tr key={proc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0F386E' }}>
                        {proc.id}
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 500, color: '#0f172a' }}>{proc.requestedBy || proc.requester || 'Dept Head'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{proc.department}</div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', fontWeight: 500 }}>
                        {proc.resourceType || proc.item}
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        {proc.quantity} {proc.quantity === 1 ? 'Unit' : 'Units'}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8rem', maxWidth: '240px' }}>
                        {proc.justification || '—'}
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        {proc.specFileName || proc.specFile ? (
                          <button
                            type="button"
                            onClick={() => handleViewSpecFile(proc)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#2563eb',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              fontSize: '0.8rem',
                              fontWeight: 500
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>description</span>
                            {proc.specFileName || 'View Spec'}
                          </button>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        {isPending ? (
                          <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleAccept(proc.id)}
                              style={{
                                backgroundColor: '#16a34a',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '0.35rem 0.75rem',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                opacity: isProcessing ? 0.6 : 1
                              }}
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleReject(proc.id)}
                              style={{
                                backgroundColor: '#ef4444',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '0.35rem 0.75rem',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                opacity: isProcessing ? 0.6 : 1
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        ) : isApproved ? (
                          <span className="badge badge-allocated">Approved</span>
                        ) : isRejected ? (
                          <span className="badge badge-rejected">Rejected</span>
                        ) : (
                          <span className="badge">{proc.status}</span>
                        )}
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
