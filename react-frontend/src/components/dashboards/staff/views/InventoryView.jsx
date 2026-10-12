import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  fetchStaffResources,
  fetchStaffResourceCatalog,
  fetchStaffProcurements,
  createStaffResource,
  updateStaffResource,
  scrapStaffResource
} from '../../../../services/staff';
import AddResourceModal from '../components/AddResourceModal';
import EditResourceModal from '../components/EditResourceModal';
import FilePreviewModal from '../components/FilePreviewModal';

/**
 * 2. Department Inventory View
 * Browse department resources, modify entries, and audit statuses.
 */
export default function InventoryView({ addToast }) {
  const { user } = useAuth();
  const department = user?.department || 'IT Services';

  const [resources, setResources] = useState([]);
  const [procurements, setProcurements] = useState([]);
  const [catalogTypes, setCatalogTypes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [resList, catalogRes, procList] = await Promise.all([
        fetchStaffResources({ department }),
        fetchStaffResourceCatalog({ department }).catch(() => []),
        fetchStaffProcurements({ department }).catch(() => [])
      ]);

      const list = Array.isArray(resList) ? resList : [];
      setResources(list);

      const procs = Array.isArray(procList) ? procList : [];
      setProcurements(procs);

      // Extract catalog types
      let types = [];
      if (Array.isArray(catalogRes) && catalogRes.length > 0) {
        types = catalogRes[0]?.resourceTypes || [];
      } else if (catalogRes?.resourceTypes) {
        types = catalogRes.resourceTypes;
      }
      setCatalogTypes(types);
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to load inventory.', 'error');
    } finally {
      setLoading(false);
    }
  }, [department, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter resources: omit 'Allocated' as done in original staff.js, or show with filter
  // Original staff.js line 572: "filter(r => r.department === userDept && r.status !== 'Allocated')"
  const filteredResources = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    // Exclude 'Allocated' to mirror staff.js behavior
    const baseList = resources.filter((r) => r.status !== 'Allocated');

    if (!q) return baseList;

    return baseList.filter((r) => {
      const code = String(r.code || r.id || '').toLowerCase();
      const name = String(r.name || '').toLowerCase();
      const type = String(r.type || '').toLowerCase();
      const sn = String(r.serialNumber || '').toLowerCase();
      const vendor = String(r.vendor || '').toLowerCase();
      const invoice = String(r.invoice || '').toLowerCase();

      return (
        code.includes(q) ||
        name.includes(q) ||
        type.includes(q) ||
        sn.includes(q) ||
        vendor.includes(q) ||
        invoice.includes(q)
      );
    });
  }, [resources, searchQuery]);

  const handleAddSubmit = async (newResource) => {
    await createStaffResource(newResource);
    if (addToast) addToast(`Resource ${newResource.id} added successfully!`, 'success');
    await loadData();
  };

  const handleEditSubmit = async (id, updatePayload) => {
    await updateStaffResource(id, updatePayload);
    if (addToast) addToast(`Resource ${id} updated!`, 'success');
    await loadData();
  };

  const handleScrap = async (id) => {
    const confirmed = window.confirm('Permanently mark this resource as scrapped?');
    if (!confirmed) return;

    try {
      await scrapStaffResource(id);
      if (addToast) addToast(`Resource ${id} marked as scrapped!`, 'error');
      await loadData();
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to scrap resource.', 'error');
    }
  };

  const getStatusBadge = (status) => {
    let badgeClass = 'pending';
    if (status === 'Available') badgeClass = 'allocated';
    else if (status === 'Scrapped') badgeClass = 'rejected';
    else if (status === 'Maintenance') badgeClass = 'pending';
    else if (status === 'Returned') badgeClass = 'action';

    return <span className={`badge ${badgeClass}`}>{status}</span>;
  };

  return (
    <div className="staff-dashboard-wrapper inventory-view">
      <div className="staff-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="staff-header-titles">
          <h1 className="page-title">Department Inventory</h1>
          <p className="page-subtitle">Browse department resources, modify entries, and audit statuses.</p>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={loadData}
          style={{ fontSize: '0.825rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
          disabled={loading}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            refresh
          </span>
          Refresh
        </button>
      </div>

      <div className="data-section" style={{ overflow: 'hidden', background: '#ffffff', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: 'var(--shadow-sm)' }}>
        <div className="data-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1.25rem 1.5rem' }}>
          <div className="data-section-title">Asset List</div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-primary"
              style={{
                padding: '0.5rem 1.1rem',
                fontSize: '0.875rem',
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: '8px',
                gap: '0.4rem',
                whiteSpace: 'nowrap'
              }}
              onClick={() => setIsAddOpen(true)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>
                add
              </span>
              Add Resource
            </button>

            <div className="search-bar" style={{ width: '250px', maxWidth: '100%' }}>
              <span className="material-symbols-outlined" style={{ color: '#94a3b8' }}>
                search
              </span>
              <input
                type="text"
                placeholder="Search by Code or Type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="staff-loading-container">
            <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>
              sync
            </span>
            <span>Loading inventory...</span>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="staff-empty-state">
            <span className="material-symbols-outlined">inventory_2</span>
            <p>
              {searchQuery
                ? `No inventory items match "${searchQuery}".`
                : `No assets currently stored in ${department} inventory.`}
            </p>
          </div>
        ) : (
          <div className="table-responsive" style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
            <table className="table" style={{ width: '100%', minWidth: '960px', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Model</th>
                  <th>Type</th>
                  <th>S/N</th>
                  <th>Location</th>
                  <th>Condition</th>
                  <th>Status</th>
                  <th>Vendor</th>
                  <th>Invoice</th>
                  <th>Invoice File</th>
                  <th style={{ textAlign: 'right', whiteSpace: 'nowrap', paddingRight: '1.25rem', width: '130px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResources.map((res) => {
                  const srcProc = res.procurementId
                    ? procurements.find((p) => p.id === res.procurementId)
                    : null;
                  const invoiceName =
                    res.invoiceFileName || srcProc?.invoiceFileName;
                  const invoiceData =
                    res.invoiceFileDataUrl || srcProc?.invoiceFileDataUrl;
                  const invoiceType =
                    res.invoiceFileType || srcProc?.invoiceFileType;

                  return (
                    <tr key={res.id}>
                      <td className="td-id">{res.code || res.id}</td>
                      <td style={{ fontWeight: 500 }}>{res.name || res.type}</td>
                      <td>{res.type}</td>
                      <td>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '0.8rem',
                            background: '#f1f5f9',
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}
                        >
                          {res.serialNumber || 'N/A'}
                        </span>
                      </td>
                      <td>{res.location || res.department || 'N/A'}</td>
                      <td>{res.condition || 'Good'}</td>
                      <td>{getStatusBadge(res.status)}</td>
                      <td>{res.vendor || '—'}</td>
                      <td>{res.invoice || '—'}</td>
                      <td>
                        {invoiceName ? (
                          <button
                            type="button"
                            className="spec-file-link"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 0
                            }}
                            onClick={() =>
                              setPreviewFile({
                                name: invoiceName,
                                type: invoiceType,
                                dataUrl: invoiceData
                              })
                            }
                            title="Preview Invoice File"
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: '1rem' }}
                            >
                              visibility
                            </span>
                            {invoiceName}
                          </button>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>
                            —
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap', paddingRight: '1.25rem' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '6px'
                            }}
                            onClick={() => {
                              setEditingResource(res);
                              setIsEditOpen(true);
                            }}
                          >
                            Edit
                          </button>
                          {res.status !== 'Scrapped' && (
                            <button
                              type="button"
                              className="btn-danger"
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '6px'
                              }}
                              onClick={() => handleScrap(res.id)}
                            >
                              Scrap
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Resource Modal */}
      <AddResourceModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAddSubmit}
        catalogTypes={catalogTypes}
        department={department}
        existingResources={resources}
      />

      {/* Edit Resource Modal */}
      <EditResourceModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingResource(null);
        }}
        onSubmit={handleEditSubmit}
        resource={editingResource}
        existingResources={resources}
      />

      {/* Invoice File Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
}
