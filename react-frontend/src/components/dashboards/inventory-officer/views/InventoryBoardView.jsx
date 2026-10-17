import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  fetchResources,
  fetchResourceCatalog,
  createResource,
  scrapResource,
  updateResource
} from '../../../../services/inventoryOfficer';

const STATUS_COLORS = {
  Available: { bg: '#f0fdf4', text: '#16a34a' },
  Allocated: { bg: '#eff6ff', text: '#2563eb' },
  'Maintenance Requested': { bg: '#fffbeb', text: '#d97706' },
  Maintenance: { bg: '#fef2f2', text: '#dc2626' },
  Returned: { bg: '#f5f3ff', text: '#7c3aed' },
  Repaired: { bg: '#ecfeff', text: '#0891b2' },
  Scrapped: { bg: '#f8fafc', text: '#64748b' },
};

const ALL_STATUSES = ['All', 'Available', 'Allocated', 'Maintenance Requested', 'Maintenance', 'Returned', 'Repaired', 'Scrapped'];

export default function InventoryBoardView({ addToast }) {
  const { user } = useAuth();
  const department = user?.department || 'IT Services';

  const [resources, setResources] = useState([]);
  const [catalogTypes, setCatalogTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [scrapConfirmId, setScrapConfirmId] = useState(null);

  // Add Resource Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    type: '',
    name: '',
    serialNumber: '',
    location: 'Main Warehouse',
    condition: 'New',
    vendor: '',
    invoice: ''
  });

  const loadResources = useCallback(async () => {
    try {
      setLoading(true);
      const [res, cat] = await Promise.all([
        fetchResources({ department }),
        fetchResourceCatalog({ department }).catch(() => [])
      ]);
      setResources(Array.isArray(res) ? res : []);

      let types = [];
      if (Array.isArray(cat) && cat.length > 0) {
        types = cat[0]?.resourceTypes || [];
      } else if (cat?.resourceTypes) {
        types = cat.resourceTypes;
      }
      setCatalogTypes(types);
    } catch (err) {
      addToast?.(err.message || 'Failed to load inventory.', 'error');
    } finally {
      setLoading(false);
    }
  }, [department, addToast]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const availableTypes = useMemo(() => {
    const fromCat = catalogTypes || [];
    const fromRes = [...new Set(resources.map(r => r.type).filter(Boolean))];
    const combined = [...new Set([...fromCat, ...fromRes])];
    return combined.length > 0
      ? combined
      : ['Laptops', 'Monitors', 'Network Switches', 'Routers', 'Accessories'];
  }, [catalogTypes, resources]);

  const resourceTypes = useMemo(() => {
    const types = [...new Set(resources.map(r => r.type).filter(Boolean))];
    return ['All', ...types];
  }, [resources]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return resources.filter(r => {
      if (statusFilter !== 'All' && r.status !== statusFilter) return false;
      if (typeFilter !== 'All' && r.type !== typeFilter) return false;
      if (!q) return true;
      return (
        r.id?.toLowerCase().includes(q) ||
        r.type?.toLowerCase().includes(q) ||
        r.serialNumber?.toLowerCase().includes(q) ||
        r.name?.toLowerCase().includes(q) ||
        r.assignedTo?.toLowerCase().includes(q)
      );
    });
  }, [resources, searchQuery, statusFilter, typeFilter]);

  // ── Add Resource Action ───────────────────────────────────────────────────────

  const handleOpenAddModal = () => {
    setAddForm({
      type: availableTypes[0] || 'Laptops',
      name: '',
      serialNumber: '',
      location: 'Main Warehouse',
      condition: 'New',
      vendor: '',
      invoice: ''
    });
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.type?.trim()) {
      addToast?.('Please select a resource type.', 'error');
      return;
    }
    if (!addForm.name?.trim()) {
      addToast?.('Please enter Model / Name.', 'error');
      return;
    }

    const cleanType = (addForm.type || 'AST').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
    const sn = addForm.serialNumber?.trim() || `SN-${cleanType}-${Math.floor(1000 + Math.random() * 9000)}`;
    const id = `RES-${Date.now()}`;

    try {
      setIsSubmittingAdd(true);
      await createResource({
        id,
        code: id,
        type: addForm.type.trim(),
        name: addForm.name.trim(),
        serialNumber: sn,
        location: addForm.location?.trim() || 'Main Warehouse',
        condition: addForm.condition || 'New',
        vendor: addForm.vendor?.trim() || undefined,
        invoice: addForm.invoice?.trim() || undefined,
        department,
        status: 'Available', // Always Available, not requested from user
        assignedTo: 'None'
      });

      addToast?.(`✅ Resource "${addForm.name.trim()}" added to inventory with status Available.`, 'success');
      setIsAddModalOpen(false);
      await loadResources();
    } catch (err) {
      addToast?.(err.message || 'Failed to add resource.', 'error');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // ── Edit & Scrap Actions ──────────────────────────────────────────────────────

  const startEdit = (res) => {
    setEditingId(res.id);
    setEditForm({
      condition: res.condition || 'Good',
      location: res.location || '',
      name: res.name || '',
      returnDate: res.returnDate || '',
      returnDateDisplay: res.returnDateDisplay || ''
    });
  };

  const handleSaveEdit = async (id) => {
    try {
      setSavingId(id);
      const payload = { ...editForm };
      if (payload.returnDate) {
        const d = new Date(payload.returnDate);
        if (!isNaN(d.getTime())) {
          payload.returnDateDisplay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
      }
      await updateResource(id, payload);
      addToast?.('Resource updated successfully.', 'success');
      setEditingId(null);
      await loadResources();
    } catch (err) {
      addToast?.(err.message || 'Update failed.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleScrap = async (id) => {
    try {
      await scrapResource(id);
      addToast?.('Resource marked as scrapped.', 'success');
      setScrapConfirmId(null);
      await loadResources();
    } catch (err) {
      addToast?.(err.message || 'Scrap failed.', 'error');
    }
  };

  const statusCounts = useMemo(() => {
    const counts = {};
    resources.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return counts;
  }, [resources]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>Inventory Board</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            {resources.length} total resources in {department}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by ID, type, serial..."
            style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, width: 200, outline: 'none', background: '#fff' }}
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none', background: '#fff' }}
          >
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none', background: '#fff' }}
          >
            {resourceTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          {/* Add Resource Button */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            style={{
              padding: '8px 16px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
              whiteSpace: 'nowrap'
            }}
          >
            <span className="material-icons" style={{ fontSize: 18 }}>add</span>
            Add Resource
          </button>
        </div>
      </div>

      {/* Status Summary Chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {Object.entries(statusCounts).map(([status, count]) => {
          const c = STATUS_COLORS[status] || { bg: '#f8fafc', text: '#64748b' };
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? 'All' : status)}
              style={{
                padding: '4px 12px',
                borderRadius: 20,
                border: `1px solid ${c.text}40`,
                background: statusFilter === status ? c.bg : '#fff',
                color: c.text,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {status} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading inventory...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0' }}>
          <span className="material-icons" style={{ fontSize: 48, color: '#94a3b8', display: 'block', marginBottom: 12 }}>inventory_2</span>
          <div style={{ fontSize: 15, color: '#64748b' }}>No resources match your filters.</div>
          <button
            type="button"
            onClick={handleOpenAddModal}
            style={{
              marginTop: '1rem',
              padding: '8px 18px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span className="material-icons" style={{ fontSize: 16 }}>add</span>
            Add First Resource
          </button>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Resource ID', 'Type / Model', 'Serial No.', 'Condition', 'Status', 'Assigned To', 'Return Deadline', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((res, i) => {
                const colors = STATUS_COLORS[res.status] || { bg: '#f8fafc', text: '#64748b' };
                const isEditing = editingId === res.id;
                return (
                  <tr key={res.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#3b82f6' }}>{res.id}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{res.type}</div>
                      {isEditing ? (
                        <input
                          value={editForm.name}
                          onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                          placeholder="Model name"
                          style={{ fontSize: 12, padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: 6, outline: 'none', width: 160, marginTop: 4 }}
                        />
                      ) : (
                        <div style={{ fontSize: 11, color: '#64748b' }}>{res.name || '—'}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b', fontFamily: 'monospace' }}>{res.serialNumber || '—'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      {isEditing ? (
                        <select
                          value={editForm.condition}
                          onChange={e => setEditForm(p => ({ ...p, condition: e.target.value }))}
                          style={{ padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, outline: 'none' }}
                        >
                          {['New', 'Good', 'Average', 'Fair', 'Damaged', 'Bad'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      ) : (
                        <span style={{ fontSize: 12 }}>{res.condition || '—'}</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: colors.bg, color: colors.text }}>
                        {res.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 12 }}>{res.assignedTo || '—'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      {res.status === 'Allocated' ? (
                        isEditing ? (
                          <input
                            type="date"
                            value={editForm.returnDate || ''}
                            onChange={e => setEditForm(p => ({ ...p, returnDate: e.target.value }))}
                            style={{
                              padding: '4px 8px',
                              border: '1px solid #cbd5e1',
                              borderRadius: 6,
                              fontSize: 12,
                              outline: 'none',
                              color: '#1e293b'
                            }}
                          />
                        ) : (
                          (() => {
                            const dStr = res.returnDateDisplay || res.returnDate;
                            if (!dStr) {
                              return <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>No deadline set</span>;
                            }
                            let isOverdue = false;
                            if (res.returnDate) {
                              const retTime = new Date(res.returnDate).setHours(23, 59, 59, 999);
                              isOverdue = retTime < Date.now();
                            }
                            return (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <span
                                  className="material-icons"
                                  style={{ fontSize: 15, color: isOverdue ? '#ef4444' : '#64748b' }}
                                >
                                  {isOverdue ? 'warning' : 'event'}
                                </span>
                                <span style={{ fontSize: 12, fontWeight: 600, color: isOverdue ? '#dc2626' : '#334155' }}>
                                  {dStr}
                                </span>
                                {isOverdue && (
                                  <span style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    padding: '1px 6px',
                                    borderRadius: 4,
                                    background: '#fee2e2',
                                    color: '#dc2626',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em'
                                  }}>
                                    Overdue
                                  </span>
                                )}
                              </div>
                            );
                          })()
                        )
                      ) : (
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(res.id)}
                              disabled={savingId === res.id}
                              style={{ padding: '5px 12px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                            >
                              {savingId === res.id ? '...' : 'Save'}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              style={{ padding: '5px 12px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 7, fontSize: 12, cursor: 'pointer' }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(res)}
                              style={{ padding: '5px 10px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                            >
                              Edit
                            </button>
                            {res.status !== 'Allocated' && res.status !== 'Scrapped' && (
                              <button
                                onClick={() => setScrapConfirmId(res.id)}
                                style={{ padding: '5px 10px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                              >
                                Scrap
                              </button>
                            )}
                          </>
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

      {/* Add Resource Modal */}
      {isAddModalOpen && (
        <div
          onClick={() => setIsAddModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
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
              padding: '1.75rem',
              width: '100%',
              maxWidth: 580,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
                  Add New Resource
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                  Register asset to <strong>{department}</strong> inventory
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
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

            {/* Status Notice (Status is always Available, user does not need to fill) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 12,
                color: '#15803d'
              }}
            >
              <span className="material-icons" style={{ fontSize: 18, color: '#16a34a' }}>check_circle</span>
              <span>
                Status is automatically assigned as <strong>Available</strong> upon registration.
              </span>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Resource Type */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Resource Type <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={addForm.type}
                    onChange={(e) => setAddForm(prev => ({ ...prev, type: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      outline: 'none',
                      background: '#fff'
                    }}
                    required
                  >
                    {availableTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Model / Name */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Model / Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dell Latitude 5520"
                    value={addForm.name}
                    onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Serial Number */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Serial Number
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="text"
                      placeholder="e.g. SN-98234"
                      value={addForm.serialNumber}
                      onChange={(e) => setAddForm(prev => ({ ...prev, serialNumber: e.target.value }))}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: '1px solid #cbd5e1',
                        fontSize: 13,
                        fontFamily: 'monospace',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const clean = (addForm.type || 'AST').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
                        setAddForm(prev => ({ ...prev, serialNumber: `SN-${clean}-${Math.floor(1000 + Math.random() * 9000)}` }));
                      }}
                      style={{
                        padding: '6px 10px',
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#475569',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                      title="Generate random serial"
                    >
                      Auto
                    </button>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Main Warehouse"
                    value={addForm.location}
                    onChange={(e) => setAddForm(prev => ({ ...prev, location: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                {/* Condition */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Condition
                  </label>
                  <select
                    value={addForm.condition}
                    onChange={(e) => setAddForm(prev => ({ ...prev, condition: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      outline: 'none',
                      background: '#fff'
                    }}
                  >
                    <option value="New">New</option>
                    <option value="Good">Good</option>
                    <option value="Average">Average</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>

                {/* Vendor (Optional) */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Vendor (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dell"
                    value={addForm.vendor}
                    onChange={(e) => setAddForm(prev => ({ ...prev, vendor: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Invoice (Optional) */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Invoice # (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-1024"
                    value={addForm.invoice}
                    onChange={(e) => setAddForm(prev => ({ ...prev, invoice: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    padding: '9px 18px',
                    background: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  style={{
                    padding: '9px 20px',
                    background: isSubmittingAdd ? '#94a3b8' : '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: isSubmittingAdd ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 6px rgba(37,99,235,0.25)'
                  }}
                >
                  <span className="material-icons" style={{ fontSize: 16 }}>
                    {isSubmittingAdd ? 'hourglass_top' : 'add'}
                  </span>
                  {isSubmittingAdd ? 'Adding...' : 'Add to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scrap Confirm Modal */}
      {scrapConfirmId && (
        <div onClick={() => setScrapConfirmId(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: '2rem', width: 380, textAlign: 'center' }}>
            <span className="material-icons" style={{ fontSize: 48, color: '#ef4444', display: 'block', marginBottom: 12 }}>warning</span>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Scrap Resource?</h3>
            <p style={{ margin: '0 0 1.5rem', fontSize: 13, color: '#64748b' }}>This action is permanent. The resource will be marked as Scrapped and removed from active inventory.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setScrapConfirmId(null)} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleScrap(scrapConfirmId)} style={{ padding: '10px 20px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Yes, Scrap</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
