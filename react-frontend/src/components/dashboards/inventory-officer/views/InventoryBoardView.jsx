import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  fetchResources,
  fetchResourceCatalog,
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
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [scrapConfirmId, setScrapConfirmId] = useState(null);

  const loadResources = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchResources({ department });
      setResources(Array.isArray(res) ? res : []);
    } catch (err) {
      addToast(err.message || 'Failed to load inventory.', 'error');
    } finally {
      setLoading(false);
    }
  }, [department, addToast]);

  useEffect(() => { loadResources(); }, [loadResources]);

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

  const startEdit = (res) => {
    setEditingId(res.id);
    setEditForm({ condition: res.condition || 'Good', location: res.location || '', name: res.name || '' });
  };

  const handleSaveEdit = async (id) => {
    try {
      setSavingId(id);
      await updateResource(id, editForm);
      addToast('Resource updated successfully.', 'success');
      setEditingId(null);
      await loadResources();
    } catch (err) {
      addToast(err.message || 'Update failed.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleScrap = async (id) => {
    try {
      await scrapResource(id);
      addToast('Resource marked as scrapped.', 'success');
      setScrapConfirmId(null);
      await loadResources();
    } catch (err) {
      addToast(err.message || 'Scrap failed.', 'error');
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
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>{resources.length} total resources in {department}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by ID, type, serial..."
            style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, width: 220, outline: 'none', background: '#fff' }}
          />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none', background: '#fff' }}>
            {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none', background: '#fff' }}>
            {resourceTypes.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Status Summary Chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {Object.entries(statusCounts).map(([status, count]) => {
          const c = STATUS_COLORS[status] || { bg: '#f8fafc', text: '#64748b' };
          return (
            <button key={status} onClick={() => setStatusFilter(statusFilter === status ? 'All' : status)}
              style={{ padding: '4px 12px', borderRadius: 20, border: `1px solid ${c.text}40`, background: statusFilter === status ? c.bg : '#fff', color: c.text, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
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
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Resource ID', 'Type / Model', 'Serial No.', 'Condition', 'Status', 'Assigned To', 'Actions'].map(h => (
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
                        <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                          placeholder="Model name" style={{ fontSize: 12, padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: 6, outline: 'none', width: 160, marginTop: 4 }} />
                      ) : (
                        <div style={{ fontSize: 11, color: '#64748b' }}>{res.name || '—'}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>{res.serialNumber || '—'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      {isEditing ? (
                        <select value={editForm.condition} onChange={e => setEditForm(p => ({ ...p, condition: e.target.value }))}
                          style={{ padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, outline: 'none' }}>
                          {['New', 'Good', 'Average', 'Fair', 'Damaged', 'Bad'].map(c => <option key={c}>{c}</option>)}
                        </select>
                      ) : (
                        <span style={{ fontSize: 12 }}>{res.condition || '—'}</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: colors.bg, color: colors.text }}>{res.status}</span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 12 }}>{res.assignedTo || '—'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {isEditing ? (
                          <>
                            <button onClick={() => handleSaveEdit(res.id)} disabled={savingId === res.id}
                              style={{ padding: '5px 12px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                              {savingId === res.id ? '...' : 'Save'}
                            </button>
                            <button onClick={() => setEditingId(null)}
                              style={{ padding: '5px 12px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 7, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(res)}
                              style={{ padding: '5px 10px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                            {res.status !== 'Allocated' && res.status !== 'Scrapped' && (
                              <button onClick={() => setScrapConfirmId(res.id)}
                                style={{ padding: '5px 10px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Scrap</button>
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
