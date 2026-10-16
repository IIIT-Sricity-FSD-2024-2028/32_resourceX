import React, { useState, useEffect } from 'react';
import {
  fetchResources,
  fetchProcurements,
  requestResourceMaintenance,
  initiateResourceReturn,
  confirmRepairedAllocation
} from '../../../../services/requestor';

export default function MyResourcesView({ addToast, onPreviewFile }) {
  const [resources, setResources] = useState([]);
  const [procurements, setProcurements] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resList, procList] = await Promise.all([
        fetchResources().catch(() => []),
        fetchProcurements().catch(() => [])
      ]);
      setResources(resList || []);
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

  const handleMaintenance = async (resId) => {
    if (!window.confirm('Submit maintenance request for this resource?')) return;
    setActionLoadingId(resId);
    try {
      await requestResourceMaintenance(resId);
      addToast('Maintenance request submitted successfully.', 'success');
      await loadData();
    } catch (err) {
      console.error('Maintenance request failed:', err);
      addToast(err.message || 'Failed to submit maintenance request.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReturn = async (resId) => {
    if (!window.confirm('Are you sure you want to return this resource? It will be sent to Staff for Verification.')) return;
    setActionLoadingId(resId);
    try {
      await initiateResourceReturn(resId);
      addToast('Resource returned successfully. Status moved to Returned.', 'success');
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

  const filteredResources = resources.filter((res) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (res.id && res.id.toLowerCase().includes(term)) ||
      (res.type && res.type.toLowerCase().includes(term)) ||
      (res.department && res.department.toLowerCase().includes(term)) ||
      (res.status && res.status.toLowerCase().includes(term))
    );
  });

  return (
    <div className="view-section">
      <h1 className="page-title">My Resources</h1>
      <p className="page-subtitle">Currently allocated resources to you.</p>

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
                <th>Status</th>
                <th>Invoice</th>
                <th style={{ textAlign: 'right', minWidth: '210px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Loading allocated resources...
                  </td>
                </tr>
              ) : filteredResources.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    {searchTerm ? 'No resources match your search.' : 'No resources currently allocated to you.'}
                  </td>
                </tr>
              ) : (
                filteredResources.map((res) => {
                  let statusBadge = <span className="badge">{res.status}</span>;
                  let actions = null;

                  if (res.status === 'Allocated') {
                    statusBadge = <span className="badge allocated">{res.status}</span>;
                    actions = (
                      <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn-secondary"
                          style={{ fontSize: '0.82rem', padding: '0.3rem 0.8rem', whiteSpace: 'nowrap' }}
                          disabled={actionLoadingId === res.id}
                          onClick={() => handleMaintenance(res.id)}
                        >
                          🛠 Maintenance
                        </button>
                        <button
                          className="btn-danger"
                          style={{ fontSize: '0.82rem', padding: '0.3rem 0.8rem', whiteSpace: 'nowrap' }}
                          disabled={actionLoadingId === res.id}
                          onClick={() => handleReturn(res.id)}
                        >
                          ⮌ Return
                        </button>
                      </div>
                    );
                  } else if (res.status === 'Maintenance Requested' || res.status === 'Maintenance') {
                    statusBadge = <span className="badge maintenance">{res.status}</span>;
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
                    <tr key={res.id}>
                      <td className="td-id">{res.id}</td>
                      <td>{res.type}</td>
                      <td>{res.department}</td>
                      <td>{res.date || '—'}</td>
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
    </div>
  );
}
