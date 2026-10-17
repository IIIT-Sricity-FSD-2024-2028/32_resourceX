import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { fetchStaffProcurements, registerStaffProcurement } from '../../../../services/staff';

const CONDITIONS = ['New', 'Good', 'Average', 'Bad'];

export default function RegistrationView({ addToast, onRegistrationComplete, onPreviewInvoice }) {
  const { user } = useAuth();
  const department = user?.department || 'IT Services';

  const [procurements, setProcurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({}); // procId -> array of rows
  const [bulkConfig, setBulkConfig] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [filterTexts, setFilterTexts] = useState({});

  const loadProcurements = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchStaffProcurements({ department });
      const list = Array.isArray(res) ? res : [];
      // Fulfilled purchases are ready for serial registration
      const fulfilled = list.filter((p) => p.status === 'Fulfilled');
      setProcurements(fulfilled);

      // Pre-initialize row data for each procurement
      const initData = {};
      const initBulk = {};
      fulfilled.forEach((p) => {
        const qty = parseInt(p.quantity, 10) || 1;
        const rows = [];
        const cleanItem = (p.resourceType || p.item || 'ASSET').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
        for (let i = 0; i < qty; i++) {
          const code = `RES-${p.id.replace(/[^a-zA-Z0-9]/g, '')}-${String(i + 1).padStart(2, '0')}`;
          rows.push({
            id: code,
            code: code,
            name: '',
            type: p.resourceType || p.item,
            serialNumber: '',
            location: 'Main Warehouse',
            condition: 'New',
            status: 'Available',
            vendor: p.vendor || '',
            invoice: p.invoice || ''
          });
        }
        initData[p.id] = rows;
        initBulk[p.id] = {
          model: p.resourceType || p.item || '',
          location: 'Main Warehouse',
          condition: 'New',
          serialPrefix: `SN-${cleanItem}-`,
          startNum: 101,
          padLength: 3
        };
      });
      setFormData(initData);
      setBulkConfig(initBulk);
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to load registrations.', 'error');
    } finally {
      setLoading(false);
    }
  }, [department, addToast]);

  useEffect(() => {
    loadProcurements();
  }, [loadProcurements]);

  const handleRowChange = (procId, index, field, value) => {
    setFormData((prev) => {
      const rows = [...(prev[procId] || [])];
      rows[index] = { ...rows[index], [field]: value };
      return { ...prev, [procId]: rows };
    });
  };

  const handleBulkConfigChange = (procId, field, value) => {
    setBulkConfig((prev) => ({
      ...prev,
      [procId]: { ...(prev[procId] || {}), [field]: value }
    }));
  };

  const applyBulkModel = (procId) => {
    const model = bulkConfig[procId]?.model?.trim();
    if (!model) {
      if (addToast) addToast('Please enter a model name to apply.', 'error');
      return;
    }
    setFormData((prev) => {
      const rows = (prev[procId] || []).map((r) => ({ ...r, name: model }));
      return { ...prev, [procId]: rows };
    });
    if (addToast) addToast(`Applied model "${model}" to all items.`, 'success');
  };

  const applyBulkLocation = (procId) => {
    const loc = bulkConfig[procId]?.location?.trim() || 'Main Warehouse';
    setFormData((prev) => {
      const rows = (prev[procId] || []).map((r) => ({ ...r, location: loc }));
      return { ...prev, [procId]: rows };
    });
    if (addToast) addToast(`Applied location "${loc}" to all items.`, 'success');
  };

  const applyBulkCondition = (procId) => {
    const cond = bulkConfig[procId]?.condition || 'New';
    setFormData((prev) => {
      const rows = (prev[procId] || []).map((r) => ({ ...r, condition: cond }));
      return { ...prev, [procId]: rows };
    });
    if (addToast) addToast(`Applied condition "${cond}" to all items.`, 'success');
  };

  const applyAutoSerials = (procId) => {
    const conf = bulkConfig[procId] || {};
    const prefix = conf.serialPrefix || 'SN-';
    const start = parseInt(conf.startNum, 10) || 1;
    const pad = parseInt(conf.padLength, 10) || 3;

    setFormData((prev) => {
      const rows = (prev[procId] || []).map((r, i) => {
        const seq = String(start + i).padStart(pad, '0');
        return { ...r, serialNumber: `${prefix}${seq}` };
      });
      return { ...prev, [procId]: rows };
    });
    if (addToast) addToast(`Generated serial numbers for all ${(formData[procId] || []).length} items.`, 'success');
  };

  const applyOneClickFill = (procId) => {
    const conf = bulkConfig[procId] || {};
    const model = conf.model?.trim() || 'Standard Asset';
    const loc = conf.location?.trim() || 'Main Warehouse';
    const cond = conf.condition || 'New';
    const prefix = conf.serialPrefix || 'SN-';
    const start = parseInt(conf.startNum, 10) || 1;
    const pad = parseInt(conf.padLength, 10) || 3;

    setFormData((prev) => {
      const rows = (prev[procId] || []).map((r, i) => {
        const seq = String(start + i).padStart(pad, '0');
        return {
          ...r,
          name: r.name?.trim() ? r.name : model,
          location: r.location?.trim() ? r.location : loc,
          condition: r.condition || cond,
          serialNumber: r.serialNumber?.trim() ? r.serialNumber : `${prefix}${seq}`
        };
      });
      return { ...prev, [procId]: rows };
    });
    if (addToast) addToast('1-Click Autofill completed for all empty fields!', 'success');
  };

  const clearAllSerials = (procId) => {
    setFormData((prev) => {
      const rows = (prev[procId] || []).map((r) => ({ ...r, serialNumber: '' }));
      return { ...prev, [procId]: rows };
    });
    if (addToast) addToast('Cleared serial numbers for this order.', 'info');
  };

  const handleSubmit = async (procId) => {
    const rows = formData[procId] || [];
    if (rows.length === 0) return;

    // Validate fields
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.name?.trim()) {
        if (addToast) addToast(`Please enter Model for item #${i + 1}.`, 'error');
        return;
      }
      if (!r.serialNumber?.trim()) {
        if (addToast) addToast(`Please enter Serial Number for item #${i + 1}.`, 'error');
        return;
      }
      if (!r.location?.trim()) {
        if (addToast) addToast(`Please enter Location for item #${i + 1}.`, 'error');
        return;
      }
    }

    try {
      setSubmittingId(procId);
      const resourcesPayload = rows.map((r) => ({
        ...r,
        department,
        assignedTo: 'None',
        date: new Date().toLocaleDateString('en-US')
      }));

      await registerStaffProcurement(procId, resourcesPayload);
      if (addToast) {
        addToast(`Successfully registered ${rows.length} assets to ${department} inventory!`, 'success');
      }

      await loadProcurements();
      if (onRegistrationComplete) onRegistrationComplete();
    } catch (err) {
      if (addToast) addToast(err.message || 'Registration failed.', 'error');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="view-section active">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 className="page-title">Bulk Resource Registration</h1>
          <p className="page-subtitle">Process delivered purchases by logging serial records per invoice with bounded tables and bulk tools.</p>
        </div>
        <button
          type="button"
          onClick={loadProcurements}
          disabled={loading}
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>sync</span>
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="staff-loading-container">
          <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>
            sync
          </span>
          <span>Loading delivered purchases...</span>
        </div>
      ) : procurements.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px dashed #cbd5e1',
            color: '#64748b'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '3.5rem', opacity: 0.5, marginBottom: '1rem', display: 'block' }}>
            inventory
          </span>
          <p style={{ fontSize: '1.15rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
            No Pending Registrations
          </p>
          <p style={{ fontSize: '0.875rem' }}>
            Purchases logged from Procurement Tasks will appear here for serial registration.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {procurements.map((p) => {
            const rows = formData[p.id] || [];
            const conf = bulkConfig[p.id] || {};
            const isSubmitting = submittingId === p.id;
            const qty = parseInt(p.quantity, 10) || 1;
            const filterText = filterTexts[p.id] || '';

            const completedCount = rows.filter((r) => r.name?.trim() && r.serialNumber?.trim() && r.location?.trim()).length;
            const totalCount = rows.length;
            const percentDone = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            const isFullyReady = totalCount > 0 && completedCount === totalCount;

            const filteredRows = rows.map((r, originalIndex) => ({ ...r, originalIndex })).filter((r) => {
              if (!filterText.trim()) return true;
              const q = filterText.toLowerCase();
              return (
                r.code.toLowerCase().includes(q) ||
                (r.name && r.name.toLowerCase().includes(q)) ||
                (r.serialNumber && r.serialNumber.toLowerCase().includes(q)) ||
                (r.location && r.location.toLowerCase().includes(q)) ||
                String(r.originalIndex + 1) === q.trim()
              );
            });

            return (
              <div
                key={p.id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  border: isFullyReady ? '1px solid #86efac' : '1px solid var(--border-color, #e2e8f0)',
                  boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
                  padding: '1.5rem',
                  transition: 'border-color 0.2s ease'
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid #e2e8f0',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>
                      Register Purchase: {p.resourceType || p.item}
                    </h3>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      Procurement ID: <strong>{p.id}</strong> | Quantity: <strong>{qty}</strong> | Dept: <strong>{p.department}</strong>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                    <div>Vendor: <strong>{p.vendor || 'N/A'}</strong></div>
                    <div>Invoice: <strong>{p.invoice || 'N/A'}</strong></div>
                    {p.invoiceFileName && (
                      <div style={{ marginTop: '0.25rem' }}>
                        <button
                          type="button"
                          onClick={() => onPreviewInvoice && onPreviewInvoice(p)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#2563eb',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            padding: 0
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>visibility</span>
                          {p.invoiceFileName}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar & 1-click fill */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                    background: '#f8fafc',
                    padding: '0.65rem 1rem',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    marginBottom: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 240 }}>
                    <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#334155' }}>Progress:</span>
                    <div style={{ flex: 1, maxWidth: 200, height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${percentDone}%`,
                          height: '100%',
                          background: isFullyReady ? '#22c55e' : '#3b82f6',
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: isFullyReady ? '#16a34a' : '#2563eb',
                        background: isFullyReady ? '#dcfce7' : '#eff6ff',
                        padding: '2px 8px',
                        borderRadius: 6
                      }}
                    >
                      {completedCount} / {totalCount} ready ({percentDone}%)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => applyOneClickFill(p.id)}
                    style={{
                      background: '#2563eb',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '5px 12px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>bolt</span>
                    1-Click Auto-Fill
                  </button>
                </div>

                {/* Bulk Toolbar */}
                <div
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem'
                  }}
                >
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: '#2563eb' }}>auto_fix</span>
                    Bulk Autofill & Serial Generation Toolbar
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 3 }}>
                        Model
                      </label>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Latitude 5540"
                          value={conf.model || ''}
                          onChange={(e) => handleBulkConfigChange(p.id, 'model', e.target.value)}
                          style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                        />
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => applyBulkModel(p.id)}
                          style={{ fontSize: '0.75rem', padding: '4px 8px', whiteSpace: 'nowrap' }}
                        >
                          Apply All
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 3 }}>
                        Location
                      </label>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Main Warehouse"
                          value={conf.location || ''}
                          onChange={(e) => handleBulkConfigChange(p.id, 'location', e.target.value)}
                          style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                        />
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => applyBulkLocation(p.id)}
                          style={{ fontSize: '0.75rem', padding: '4px 8px', whiteSpace: 'nowrap' }}
                        >
                          Apply All
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 3 }}>
                        Condition
                      </label>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <select
                          className="form-control"
                          value={conf.condition || 'New'}
                          onChange={(e) => handleBulkConfigChange(p.id, 'condition', e.target.value)}
                          style={{ fontSize: '0.8rem', padding: '4px 6px' }}
                        >
                          {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => applyBulkCondition(p.id)}
                          style={{ fontSize: '0.75rem', padding: '4px 8px', whiteSpace: 'nowrap' }}
                        >
                          Apply All
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 3 }}>
                        Serial Sequence
                      </label>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <input
                          type="text"
                          placeholder="Prefix"
                          value={conf.serialPrefix || ''}
                          onChange={(e) => handleBulkConfigChange(p.id, 'serialPrefix', e.target.value)}
                          style={{ width: '50%', fontSize: '0.8rem', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: 4 }}
                        />
                        <input
                          type="number"
                          placeholder="Start"
                          value={conf.startNum ?? 1}
                          onChange={(e) => handleBulkConfigChange(p.id, 'startNum', e.target.value)}
                          style={{ width: '50%', fontSize: '0.8rem', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: 4 }}
                        />
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => applyAutoSerials(p.id)}
                          style={{ fontSize: '0.75rem', padding: '4px 8px', whiteSpace: 'nowrap' }}
                        >
                          Gen
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => clearAllSerials(p.id)}
                          style={{ fontSize: '0.75rem', padding: '4px 6px', color: '#dc2626' }}
                          title="Clear serials"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filter bar if many items */}
                {totalCount > 6 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Filter items by #, code, serial, or model..."
                      value={filterText}
                      onChange={(e) => setFilterTexts((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      style={{ maxWidth: 300, fontSize: '0.8rem', padding: '4px 8px' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Showing {filteredRows.length} of {totalCount} items
                    </span>
                  </div>
                )}

                {/* Bounded Scrollable Table */}
                <div
                  className="table-responsive"
                  style={{
                    maxHeight: '420px',
                    overflowY: 'auto',
                    overflowX: 'auto',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    marginBottom: '1.25rem'
                  }}
                >
                  <table className="table" style={{ background: '#f8fafc', margin: 0 }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                      <tr>
                        <th style={{ width: 45 }}>#</th>
                        <th style={{ width: 140 }}>Code</th>
                        <th style={{ minWidth: 160 }}>Model <span style={{ color: '#ef4444' }}>*</span></th>
                        <th style={{ minWidth: 160 }}>S/N <span style={{ color: '#ef4444' }}>*</span></th>
                        <th style={{ width: 140 }}>Location</th>
                        <th style={{ width: 110 }}>Condition</th>
                        <th style={{ width: 100 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                            No items match filter "{filterText}".
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((row) => {
                          const idx = row.originalIndex;
                          const isRowReady = row.name?.trim() && row.serialNumber?.trim() && row.location?.trim();
                          return (
                            <tr key={row.id} style={{ background: isRowReady ? 'rgba(240, 253, 244, 0.4)' : '#fff' }}>
                              <td style={{ verticalAlign: 'middle', fontWeight: 600, color: '#64748b', fontSize: '0.75rem' }}>
                                {idx + 1}
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={row.code}
                                  readOnly
                                  style={{ backgroundColor: '#f1f5f9', fontSize: '0.8rem', padding: '4px 6px' }}
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="Model (e.g. Latitude 5540)"
                                  value={row.name}
                                  onChange={(e) => handleRowChange(p.id, idx, 'name', e.target.value)}
                                  style={{ fontSize: '0.8rem', padding: '4px 6px' }}
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="Serial Number"
                                  value={row.serialNumber}
                                  onChange={(e) => handleRowChange(p.id, idx, 'serialNumber', e.target.value)}
                                  style={{ fontSize: '0.8rem', padding: '4px 6px', fontFamily: 'monospace' }}
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="Location"
                                  value={row.location}
                                  onChange={(e) => handleRowChange(p.id, idx, 'location', e.target.value)}
                                  style={{ fontSize: '0.8rem', padding: '4px 6px' }}
                                />
                              </td>
                              <td>
                                <select
                                  className="form-control"
                                  value={row.condition}
                                  onChange={(e) => handleRowChange(p.id, idx, 'condition', e.target.value)}
                                  style={{ fontSize: '0.8rem', padding: '4px 6px' }}
                                >
                                  <option value="New">New</option>
                                  <option value="Good">Good</option>
                                  <option value="Average">Average</option>
                                  <option value="Bad">Bad</option>
                                </select>
                              </td>
                              <td>
                                <select
                                  className="form-control"
                                  value={row.status}
                                  onChange={(e) => handleRowChange(p.id, idx, 'status', e.target.value)}
                                  style={{ fontSize: '0.8rem', padding: '4px 6px' }}
                                >
                                  <option value="Available">Available</option>
                                  <option value="Maintenance">Maintenance</option>
                                  <option value="Scrapped">Scrapped</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Ready to submit: <strong>{completedCount} of {totalCount}</strong> items complete
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleSubmit(p.id)}
                    disabled={isSubmitting}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
                      {isSubmitting ? 'hourglass_top' : 'check_circle'}
                    </span>
                    {isSubmitting ? 'Registering...' : `Submit & Register ${totalCount} Assets`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
