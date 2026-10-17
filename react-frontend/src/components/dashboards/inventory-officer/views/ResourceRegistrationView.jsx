import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  fetchProcurements,
  registerProcurement
} from '../../../../services/inventoryOfficer';

const CONDITIONS = ['New', 'Good', 'Average', 'Fair'];

export default function ResourceRegistrationView({ addToast }) {
  const { user } = useAuth();
  const department = user?.department || 'IT Services';

  const [procurements, setProcurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [bulkConfig, setBulkConfig] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [collapsedOrders, setCollapsedOrders] = useState({});
  const [filterTexts, setFilterTexts] = useState({});

  const loadProcurements = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchProcurements({ department });
      const list = Array.isArray(res) ? res : [];
      const fulfilled = list.filter(p => p.status === 'Fulfilled');
      setProcurements(fulfilled);

      const initData = {};
      const initBulk = {};
      fulfilled.forEach(p => {
        const qty = parseInt(p.quantity, 10) || 1;
        const rows = [];
        const cleanItem = (p.resourceType || p.item || 'ASSET').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
        for (let i = 0; i < qty; i++) {
          const code = `RES-${p.id.replace(/[^a-zA-Z0-9]/g, '')}-${String(i + 1).padStart(2, '0')}`;
          rows.push({
            id: code,
            code,
            name: '',
            type: p.resourceType || p.item || '',
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
          padLength: 3,
          showTools: true
        };
      });
      setFormData(initData);
      setBulkConfig(initBulk);
    } catch (err) {
      addToast?.(err.message || 'Failed to load fulfilled procurements.', 'error');
    } finally {
      setLoading(false);
    }
  }, [department, addToast]);

  useEffect(() => {
    loadProcurements();
  }, [loadProcurements]);

  const handleRowChange = (procId, index, field, value) => {
    setFormData(prev => {
      const rows = [...(prev[procId] || [])];
      rows[index] = { ...rows[index], [field]: value };
      return { ...prev, [procId]: rows };
    });
  };

  const handleBulkConfigChange = (procId, field, value) => {
    setBulkConfig(prev => ({
      ...prev,
      [procId]: { ...(prev[procId] || {}), [field]: value }
    }));
  };

  // ── Bulk Apply Actions ─────────────────────────────────────────────────────────

  const applyBulkModel = (procId) => {
    const model = bulkConfig[procId]?.model?.trim();
    if (!model) {
      addToast?.('Please enter a model name to apply.', 'error');
      return;
    }
    setFormData(prev => {
      const rows = (prev[procId] || []).map(r => ({ ...r, name: model }));
      return { ...prev, [procId]: rows };
    });
    addToast?.(`Applied model "${model}" to all items.`, 'success');
  };

  const applyBulkLocation = (procId) => {
    const loc = bulkConfig[procId]?.location?.trim() || 'Main Warehouse';
    setFormData(prev => {
      const rows = (prev[procId] || []).map(r => ({ ...r, location: loc }));
      return { ...prev, [procId]: rows };
    });
    addToast?.(`Applied location "${loc}" to all items.`, 'success');
  };

  const applyBulkCondition = (procId) => {
    const cond = bulkConfig[procId]?.condition || 'New';
    setFormData(prev => {
      const rows = (prev[procId] || []).map(r => ({ ...r, condition: cond }));
      return { ...prev, [procId]: rows };
    });
    addToast?.(`Applied condition "${cond}" to all items.`, 'success');
  };

  const applyAutoSerials = (procId) => {
    const conf = bulkConfig[procId] || {};
    const prefix = conf.serialPrefix || 'SN-';
    const start = parseInt(conf.startNum, 10) || 1;
    const pad = parseInt(conf.padLength, 10) || 3;

    setFormData(prev => {
      const rows = (prev[procId] || []).map((r, i) => {
        const seq = String(start + i).padStart(pad, '0');
        return { ...r, serialNumber: `${prefix}${seq}` };
      });
      return { ...prev, [procId]: rows };
    });
    addToast?.(`Generated sequential serial numbers for all ${(formData[procId] || []).length} items.`, 'success');
  };

  const applyOneClickFill = (procId) => {
    const conf = bulkConfig[procId] || {};
    const model = conf.model?.trim() || 'Standard Asset';
    const loc = conf.location?.trim() || 'Main Warehouse';
    const cond = conf.condition || 'New';
    const prefix = conf.serialPrefix || 'SN-';
    const start = parseInt(conf.startNum, 10) || 1;
    const pad = parseInt(conf.padLength, 10) || 3;

    setFormData(prev => {
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
    addToast?.('1-Click Autofill completed for all empty fields!', 'success');
  };

  const clearAllSerials = (procId) => {
    setFormData(prev => {
      const rows = (prev[procId] || []).map(r => ({ ...r, serialNumber: '' }));
      return { ...prev, [procId]: rows };
    });
    addToast?.('Cleared all serial numbers for this order.', 'info');
  };

  const toggleCollapse = (procId) => {
    setCollapsedOrders(prev => ({ ...prev, [procId]: !prev[procId] }));
  };

  // ── Register Submission ───────────────────────────────────────────────────────

  const handleRegister = async (procId) => {
    const rows = formData[procId] || [];
    if (rows.length === 0) return;

    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].name?.trim()) {
        addToast?.(`Please enter Model / Name for item #${i + 1}.`, 'error');
        return;
      }
      if (!rows[i].serialNumber?.trim()) {
        addToast?.(`Please enter Serial Number for item #${i + 1}.`, 'error');
        return;
      }
    }

    try {
      setSubmittingId(procId);
      await registerProcurement(procId, rows);
      addToast?.(`✅ Successfully registered ${rows.length} asset(s) into inventory!`, 'success');
      await loadProcurements();
    } catch (err) {
      addToast?.(err.message || 'Registration failed.', 'error');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>
            Resource Registration
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Register delivered procurement batches with bulk tools, bounded tables, and automated serial sequencing
          </p>
        </div>
        <button
          onClick={loadProcurements}
          disabled={loading}
          style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            padding: '7px 14px',
            fontSize: 13,
            fontWeight: 600,
            color: '#475569',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <span className="material-icons" style={{ fontSize: 16 }}>refresh</span>
          Refresh Orders
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3.5rem', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', color: '#64748b' }}>
          <span className="material-icons" style={{ fontSize: 32, animation: 'spin 1.2s linear infinite', color: '#3b82f6', display: 'block', margin: '0 auto 12px' }}>
            autorenew
          </span>
          Loading fulfilled orders...
        </div>
      ) : procurements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0' }}>
          <span className="material-icons" style={{ fontSize: 48, color: '#3b82f6', display: 'block', marginBottom: 12 }}>
            inventory_2
          </span>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1e293b' }}>No Fulfilled Orders Pending Registration</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 6, maxWidth: 480, margin: '6px auto 0' }}>
            Delivered orders fulfilled by the Procurement Officer will appear here. You can bulk-register assets with automated serial numbers.
          </div>
        </div>
      ) : (
        procurements.map(proc => {
          const rows = formData[proc.id] || [];
          const conf = bulkConfig[proc.id] || {};
          const isSubmitting = submittingId === proc.id;
          const isCollapsed = !!collapsedOrders[proc.id];
          const filterText = filterTexts[proc.id] || '';

          const completedCount = rows.filter(r => r.name?.trim() && r.serialNumber?.trim()).length;
          const totalCount = rows.length;
          const percentDone = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
          const isFullyReady = totalCount > 0 && completedCount === totalCount;

          const filteredRows = rows.map((r, originalIndex) => ({ ...r, originalIndex })).filter(r => {
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
              key={proc.id}
              style={{
                background: '#fff',
                border: isFullyReady ? '1px solid #86efac' : '1px solid #e2e8f0',
                borderRadius: 14,
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'border-color 0.2s ease'
              }}
            >
              {/* Card Header */}
              <div
                style={{
                  padding: '1rem 1.25rem',
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#93c5fd',
                      background: 'rgba(255,255,255,0.1)',
                      padding: '4px 10px',
                      borderRadius: 6,
                      letterSpacing: '0.5px'
                    }}
                  >
                    {proc.id}
                  </span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>
                        {proc.resourceType || proc.item}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          background: '#3b82f6',
                          color: '#fff',
                          padding: '2px 8px',
                          borderRadius: 12
                        }}
                      >
                        Qty: {proc.quantity}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                      Vendor: <strong style={{ color: '#cbd5e1' }}>{proc.vendor || '—'}</strong> · Invoice: <strong style={{ color: '#cbd5e1' }}>{proc.invoice || '—'}</strong> · Dept: <strong style={{ color: '#cbd5e1' }}>{proc.department}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {proc.invoiceFile && (
                    <button
                      type="button"
                      onClick={() => setPreviewFile({
                        name: proc.invoiceFileName || `Invoice_${proc.id}`,
                        type: proc.invoiceFileType || 'application/pdf',
                        dataUrl: proc.invoiceFile
                      })}
                      style={{
                        background: 'rgba(255,255,255,0.12)',
                        color: '#f8fafc',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 8,
                        padding: '6px 12px',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <span className="material-icons" style={{ fontSize: 15 }}>receipt_long</span>
                      View Invoice
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleCollapse(proc.id)}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      color: '#f8fafc',
                      border: 'none',
                      borderRadius: 8,
                      padding: '6px 10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12
                    }}
                    title={isCollapsed ? 'Expand Order' : 'Collapse Order'}
                  >
                    <span className="material-icons" style={{ fontSize: 18 }}>
                      {isCollapsed ? 'expand_more' : 'expand_less'}
                    </span>
                    {isCollapsed ? 'Expand' : 'Collapse'}
                  </button>
                </div>
              </div>

              {!isCollapsed && (
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Progress & Batch Summary Bar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                      background: '#f8fafc',
                      padding: '0.75rem 1rem',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 260 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                        Batch Completion:
                      </div>
                      <div style={{ flex: 1, maxWidth: 220, height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
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
                          fontSize: 12,
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
                      onClick={() => applyOneClickFill(proc.id)}
                      style={{
                        background: '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '6px 14px',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 1px 3px rgba(59,130,246,0.3)'
                      }}
                    >
                      <span className="material-icons" style={{ fontSize: 15 }}>bolt</span>
                      1-Click Auto-Fill All
                    </button>
                  </div>

                  {/* Bulk Autofill Toolbar */}
                  <div
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: 10,
                      padding: '0.85rem 1rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="material-icons" style={{ fontSize: 16, color: '#2563eb' }}>auto_fix_high</span>
                        Bulk Autofill & Serial Generation Toolbar
                      </span>
                      <span style={{ fontSize: 11, color: '#64748b' }}>
                        Fill once to populate all {totalCount} assets instantly
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
                      {/* Model Apply */}
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                          Model / Name
                        </label>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <input
                            type="text"
                            placeholder="e.g. Dell Latitude 5520"
                            value={conf.model || ''}
                            onChange={(e) => handleBulkConfigChange(proc.id, 'model', e.target.value)}
                            style={{
                              flex: 1,
                              padding: '6px 8px',
                              fontSize: 12,
                              borderRadius: 6,
                              border: '1px solid #cbd5e1',
                              background: '#fff'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => applyBulkModel(proc.id)}
                            style={{
                              padding: '6px 10px',
                              background: '#fff',
                              border: '1px solid #cbd5e1',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#2563eb',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                            title="Apply this model name to all rows"
                          >
                            Apply All
                          </button>
                        </div>
                      </div>

                      {/* Location Apply */}
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                          Location
                        </label>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <input
                            type="text"
                            placeholder="e.g. Main Warehouse"
                            value={conf.location || ''}
                            onChange={(e) => handleBulkConfigChange(proc.id, 'location', e.target.value)}
                            style={{
                              flex: 1,
                              padding: '6px 8px',
                              fontSize: 12,
                              borderRadius: 6,
                              border: '1px solid #cbd5e1',
                              background: '#fff'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => applyBulkLocation(proc.id)}
                            style={{
                              padding: '6px 10px',
                              background: '#fff',
                              border: '1px solid #cbd5e1',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#2563eb',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                            title="Apply this location to all rows"
                          >
                            Apply All
                          </button>
                        </div>
                      </div>

                      {/* Condition Apply */}
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                          Condition
                        </label>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <select
                            value={conf.condition || 'New'}
                            onChange={(e) => handleBulkConfigChange(proc.id, 'condition', e.target.value)}
                            style={{
                              flex: 1,
                              padding: '6px 8px',
                              fontSize: 12,
                              borderRadius: 6,
                              border: '1px solid #cbd5e1',
                              background: '#fff'
                            }}
                          >
                            {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <button
                            type="button"
                            onClick={() => applyBulkCondition(proc.id)}
                            style={{
                              padding: '6px 10px',
                              background: '#fff',
                              border: '1px solid #cbd5e1',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#2563eb',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                            title="Apply this condition to all rows"
                          >
                            Apply All
                          </button>
                        </div>
                      </div>

                      {/* Serial Auto-Sequence */}
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                          Serial Auto-Sequence
                        </label>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <input
                            type="text"
                            placeholder="Prefix"
                            value={conf.serialPrefix || ''}
                            onChange={(e) => handleBulkConfigChange(proc.id, 'serialPrefix', e.target.value)}
                            style={{
                              width: '55%',
                              padding: '6px 8px',
                              fontSize: 12,
                              borderRadius: 6,
                              border: '1px solid #cbd5e1',
                              background: '#fff'
                            }}
                            title="Serial prefix, e.g. SN-DELL-"
                          />
                          <input
                            type="number"
                            placeholder="Start"
                            value={conf.startNum ?? 1}
                            onChange={(e) => handleBulkConfigChange(proc.id, 'startNum', e.target.value)}
                            style={{
                              width: '45%',
                              padding: '6px 8px',
                              fontSize: 12,
                              borderRadius: 6,
                              border: '1px solid #cbd5e1',
                              background: '#fff'
                            }}
                            title="Starting number, e.g. 101"
                          />
                          <button
                            type="button"
                            onClick={() => applyAutoSerials(proc.id)}
                            style={{
                              padding: '6px 10px',
                              background: '#0f172a',
                              border: 'none',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#fff',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                            title="Auto-sequence serial numbers for all items"
                          >
                            Sequence
                          </button>
                          <button
                            type="button"
                            onClick={() => clearAllSerials(proc.id)}
                            style={{
                              padding: '6px 8px',
                              background: '#fee2e2',
                              border: '1px solid #fca5a5',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#b91c1c',
                              cursor: 'pointer'
                            }}
                            title="Clear serial numbers"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Filter bar if many items */}
                  {totalCount > 6 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ position: 'relative', width: 280 }}>
                        <span className="material-icons" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#94a3b8' }}>
                          search
                        </span>
                        <input
                          type="text"
                          placeholder="Filter rows by #, serial, or model..."
                          value={filterText}
                          onChange={(e) => setFilterTexts(prev => ({ ...prev, [proc.id]: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '6px 8px 6px 28px',
                            fontSize: 12,
                            borderRadius: 6,
                            border: '1px solid #cbd5e1',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 12, color: '#64748b' }}>
                        Showing {filteredRows.length} of {totalCount} items
                      </span>
                    </div>
                  )}

                  {/* Bounded Scrollable Spreadsheet Table */}
                  <div
                    style={{
                      maxHeight: '420px',
                      overflowY: 'auto',
                      overflowX: 'auto',
                      border: '1px solid #e2e8f0',
                      borderRadius: 10,
                      background: '#fff',
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)'
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                      <thead
                        style={{
                          position: 'sticky',
                          top: 0,
                          zIndex: 10,
                          background: '#f8fafc',
                          borderBottom: '2px solid #e2e8f0',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                        }}
                      >
                        <tr>
                          <th style={{ padding: '10px 12px', width: 60, color: '#475569', fontWeight: 600 }}>#</th>
                          <th style={{ padding: '10px 12px', width: 150, color: '#475569', fontWeight: 600 }}>Asset Code</th>
                          <th style={{ padding: '10px 12px', minWidth: 190, color: '#475569', fontWeight: 600 }}>
                            Model / Name <span style={{ color: '#ef4444' }}>*</span>
                          </th>
                          <th style={{ padding: '10px 12px', minWidth: 190, color: '#475569', fontWeight: 600 }}>
                            Serial Number <span style={{ color: '#ef4444' }}>*</span>
                          </th>
                          <th style={{ padding: '10px 12px', width: 170, color: '#475569', fontWeight: 600 }}>Location</th>
                          <th style={{ padding: '10px 12px', width: 120, color: '#475569', fontWeight: 600 }}>Condition</th>
                          <th style={{ padding: '10px 12px', width: 90, color: '#475569', fontWeight: 600 }}>Status</th>
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
                            const i = row.originalIndex;
                            const isRowReady = row.name?.trim() && row.serialNumber?.trim();
                            return (
                              <tr
                                key={row.id}
                                style={{
                                  borderBottom: '1px solid #f1f5f9',
                                  background: isRowReady ? 'rgba(240, 253, 244, 0.4)' : '#ffffff'
                                }}
                              >
                                <td style={{ padding: '8px 12px', verticalAlign: 'middle' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span
                                      className="material-icons"
                                      style={{
                                        fontSize: 16,
                                        color: isRowReady ? '#16a34a' : '#cbd5e1'
                                      }}
                                    >
                                      {isRowReady ? 'check_circle' : 'radio_button_unchecked'}
                                    </span>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                                      {i + 1}
                                    </span>
                                  </div>
                                </td>
                                <td style={{ padding: '8px 12px', verticalAlign: 'middle' }}>
                                  <code
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: '#1e293b',
                                      background: '#f1f5f9',
                                      padding: '3px 6px',
                                      borderRadius: 4,
                                      border: '1px solid #e2e8f0'
                                    }}
                                  >
                                    {row.code}
                                  </code>
                                </td>
                                <td style={{ padding: '8px 12px', verticalAlign: 'middle' }}>
                                  <input
                                    type="text"
                                    value={row.name || ''}
                                    onChange={(e) => handleRowChange(proc.id, i, 'name', e.target.value)}
                                    placeholder="e.g. Dell Latitude 5520"
                                    style={{
                                      width: '100%',
                                      padding: '6px 8px',
                                      fontSize: 12,
                                      border: !row.name?.trim() ? '1px solid #cbd5e1' : '1px solid #86efac',
                                      borderRadius: 6,
                                      outline: 'none',
                                      background: '#fff',
                                      boxSizing: 'border-box'
                                    }}
                                  />
                                </td>
                                <td style={{ padding: '8px 12px', verticalAlign: 'middle' }}>
                                  <input
                                    type="text"
                                    value={row.serialNumber || ''}
                                    onChange={(e) => handleRowChange(proc.id, i, 'serialNumber', e.target.value)}
                                    placeholder="e.g. SN-DELL-1001"
                                    style={{
                                      width: '100%',
                                      padding: '6px 8px',
                                      fontSize: 12,
                                      fontFamily: 'monospace',
                                      border: !row.serialNumber?.trim() ? '1px solid #cbd5e1' : '1px solid #86efac',
                                      borderRadius: 6,
                                      outline: 'none',
                                      background: '#fff',
                                      boxSizing: 'border-box'
                                    }}
                                  />
                                </td>
                                <td style={{ padding: '8px 12px', verticalAlign: 'middle' }}>
                                  <input
                                    type="text"
                                    value={row.location || ''}
                                    onChange={(e) => handleRowChange(proc.id, i, 'location', e.target.value)}
                                    placeholder="Location"
                                    style={{
                                      width: '100%',
                                      padding: '6px 8px',
                                      fontSize: 12,
                                      border: '1px solid #cbd5e1',
                                      borderRadius: 6,
                                      outline: 'none',
                                      background: '#fff',
                                      boxSizing: 'border-box'
                                    }}
                                  />
                                </td>
                                <td style={{ padding: '8px 12px', verticalAlign: 'middle' }}>
                                  <select
                                    value={row.condition || 'New'}
                                    onChange={(e) => handleRowChange(proc.id, i, 'condition', e.target.value)}
                                    style={{
                                      width: '100%',
                                      padding: '6px 6px',
                                      fontSize: 12,
                                      border: '1px solid #cbd5e1',
                                      borderRadius: 6,
                                      outline: 'none',
                                      background: '#fff'
                                    }}
                                  >
                                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                  </select>
                                </td>
                                <td style={{ padding: '8px 12px', verticalAlign: 'middle' }}>
                                  <span
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 600,
                                      color: '#15803d',
                                      background: '#dcfce7',
                                      padding: '2px 8px',
                                      borderRadius: 10
                                    }}
                                  >
                                    Available
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Bottom Action Footer */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                      paddingTop: '0.5rem',
                      borderTop: '1px solid #f1f5f9'
                    }}
                  >
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      Ready to register: <strong style={{ color: isFullyReady ? '#16a34a' : '#1e293b' }}>{completedCount} of {totalCount}</strong> items filled
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRegister(proc.id)}
                      disabled={isSubmitting}
                      style={{
                        padding: '10px 24px',
                        background: isSubmitting ? '#94a3b8' : (isFullyReady ? '#16a34a' : '#3b82f6'),
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: isFullyReady ? '0 2px 6px rgba(22,163,74,0.3)' : '0 2px 6px rgba(59,130,246,0.3)'
                      }}
                    >
                      <span className="material-icons" style={{ fontSize: 18 }}>
                        {isSubmitting ? 'hourglass_top' : 'app_registration'}
                      </span>
                      {isSubmitting ? 'Registering...' : `Register All ${totalCount} Assets into Inventory`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Invoice Preview Modal */}
      {previewFile && (
        <div
          onClick={() => setPreviewFile(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(3px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '1.5rem',
              width: '100%',
              maxWidth: 750,
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-icons" style={{ color: '#2563eb' }}>receipt</span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{previewFile.name}</h3>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b'
                }}
              >
                ✕
              </button>
            </div>
            {previewFile.type?.startsWith('image/') ? (
              <img
                src={previewFile.dataUrl}
                alt={previewFile.name}
                style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: 8, margin: 'auto' }}
              />
            ) : (
              <iframe
                src={previewFile.dataUrl}
                title={previewFile.name}
                style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 8, minHeight: 450, width: '100%' }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
