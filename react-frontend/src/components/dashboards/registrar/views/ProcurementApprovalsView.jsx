import React, { useState, useEffect } from 'react';
import {
  fetchProcurements,
  approveRegistrarProcurement,
  rejectRegistrarProcurement
} from '../../../../services/registrar';

/**
 * 1. Procurement Approvals View (replicates procurement-approvals-view from registrar.html & registrar.js)
 */
export default function ProcurementApprovalsView({ addToast, onPreviewFile }) {
  const [procurements, setProcurements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load procurements list
  const loadProcurements = async () => {
    try {
      setLoading(true);
      const data = await fetchProcurements();
      setProcurements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching procurements:', err);
      if (addToast) addToast('Error loading procurements', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProcurements();
  }, []);

  // Accept procurement (matches regApp.acceptProcurement)
  const acceptProcurement = async (id) => {
    try {
      await approveRegistrarProcurement(id);
      await loadProcurements();
      alert('Procurement Approved. Task passed to Procurement Officer for fulfillment.');
      if (addToast) addToast('Procurement Approved. Task passed to Procurement Officer.', 'success');
    } catch (err) {
      console.error(err);
      alert('Failed to approve procurement: ' + (err.message || 'Error'));
    }
  };

  // Reject procurement (matches regApp.rejectProcurement)
  const rejectProcurement = async (id) => {
    if (window.confirm('Reject this procurement request?')) {
      try {
        await rejectRegistrarProcurement(id);
        await loadProcurements();
        if (addToast) addToast('Procurement rejected.', 'warning');
      } catch (err) {
        console.error(err);
        alert('Failed to reject procurement: ' + (err.message || 'Error'));
      }
    }
  };

  // Preview spec file (matches regApp.previewSpecFile)
  const previewSpecFile = (proc) => {
    if (proc.specFile && onPreviewFile) {
      onPreviewFile({
        name: proc.specFileName || `Spec_${proc.id}.pdf`,
        type: proc.specFileType || 'application/pdf',
        dataUrl: proc.specFile
      });
    } else {
      alert('No specification file attached to this procurement.');
    }
  };

  // Compute stat counts matching original registrar.js
  let pending = 0;
  let accepted = 0;
  let rejected = 0;
  procurements.forEach((p) => {
    if (p.status === 'Pending') pending++;
    else if (p.status === 'Approved' || p.status === 'Fulfilled') accepted++;
    else if (p.status === 'Rejected') rejected++;
  });

  return (
    <div id="procurement-approvals-view" className="view-section active">
      <h1 className="page-title">Procurement Management</h1>
      <p className="page-subtitle">Overview of procurement requests across the university.</p>

      {/* Stats Grid matching exact registrar.html */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-title">Total Procurement</div>
          <div className="stat-value-row">
            <div className="stat-value" id="dash-proc-total">{loading ? '...' : procurements.length}</div>
            <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>shopping_cart</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title" style={{ color: '#d97706' }}>Pending</div>
          <div className="stat-value-row">
            <div className="stat-value" style={{ color: '#d97706' }} id="dash-proc-pending">{loading ? '...' : pending}</div>
            <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: '#d97706' }}>hourglass_empty</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title" style={{ color: '#16a34a' }}>Accepted</div>
          <div className="stat-value-row">
            <div className="stat-value" style={{ color: '#16a34a' }} id="dash-proc-accepted">{loading ? '...' : accepted}</div>
            <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: '#16a34a' }}>check_circle</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title" style={{ color: '#dc2626' }}>Rejected</div>
          <div className="stat-value-row">
            <div className="stat-value" style={{ color: '#dc2626' }} id="dash-proc-rejected">{loading ? '...' : rejected}</div>
            <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: '#dc2626' }}>cancel</span>
          </div>
        </div>
      </div>

      {/* Table Section matching exact registrar.html */}
      <div className="data-section">
        <div className="data-section-header">
          <div className="data-section-title">Recent Procurement Requests</div>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
            onClick={loadProcurements}
          >
            Refresh
          </button>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Proc ID</th>
                <th>Department Head</th>
                <th>Resource Type</th>
                <th>Qty</th>
                <th>Justification</th>
                <th>Spec File</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {procurements.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                    {loading ? 'Loading procurements...' : 'No procurement requests found.'}
                  </td>
                </tr>
              ) : (
                procurements.map((p) => {
                  const isPending = p.status === 'Pending';
                  const isAccepted = p.status === 'Approved' || p.status === 'Fulfilled';

                  return (
                    <tr key={p.id}>
                      <td className="td-id" style={{ fontWeight: 600, color: '#0F386E' }}>{p.id}</td>
                      <td>{p.requestedBy || p.requester || 'Dept Head'} ({p.department})</td>
                      <td>{p.resourceType || p.item}</td>
                      <td>{p.quantity}</td>
                      <td style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.justification}</td>
                      <td>
                        {p.specFileName || p.specFile ? (
                          <a
                            href="javascript:void(0)"
                            className="spec-file-link"
                            onClick={() => previewSpecFile(p)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: '#2563eb', fontWeight: 500 }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>visibility</span>
                            {p.specFileName || 'View Spec'}
                          </a>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {isPending ? (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ fontSize: '0.75rem', background: '#16a34a', borderColor: '#16a34a', padding: '0.25rem 0.75rem' }}
                              onClick={() => acceptProcurement(p.id)}
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              className="btn-danger"
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                              onClick={() => rejectProcurement(p.id)}
                            >
                              Reject
                            </button>
                          </div>
                        ) : isAccepted ? (
                          <span className="badge allocated">{p.status}</span>
                        ) : (
                          <span className="badge rejected">{p.status}</span>
                        )}
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
