import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { fetchResources, fetchReturnHistory, processReturn } from '../../../../services/inventoryOfficer';
import TableToolbar, { matchesSearch, uniqueOptions } from '../../../common/TableToolbar';

const CONDITIONS = ['Good', 'Average', 'Fair', 'Damaged', 'Bad'];

export default function InventoryReturnsView({ addToast }) {
  const { user } = useAuth();
  const department = user?.department || 'IT Services';

  const [activeSubTab, setActiveSubTab] = useState('queue'); // 'queue' | 'history'
  const [returnItems, setReturnItems] = useState([]);
  const [returnHistory, setReturnHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Inspector form inputs per pending return item
  const [itemForms, setItemForms] = useState({});

  // History filtering & search
  const [historySearch, setHistorySearch] = useState('');
  const [queueSearch, setQueueSearch] = useState('');
  const [queueTypeFilter, setQueueTypeFilter] = useState('All');
  const [historyFilter, setHistoryFilter] = useState('All');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [res, hist] = await Promise.all([
        fetchResources({ department }),
        fetchReturnHistory().catch(() => [])
      ]);

      const list = Array.isArray(res) ? res : [];
      const returned = list.filter(r => r.status === 'Returned');
      setReturnItems(returned);

      const forms = {};
      returned.forEach(r => {
        const isFaulty =
          r.condition === 'Damaged' ||
          r.condition === 'Bad' ||
          (r.returnReason && (r.returnReason.toLowerCase().includes('fault') || r.returnReason.toLowerCase().includes('broken')));
        forms[r.id] = {
          condition: r.condition || (isFaulty ? 'Damaged' : 'Good'),
          destination: isFaulty ? 'Maintenance Requested' : 'Available',
          returnReason: r.returnReason || 'Project Completed',
          maintenanceIssue: r.returnNotes || (isFaulty ? 'Hardware inspection and repair needed post-return' : ''),
          officerNotes: '',
        };
      });
      setItemForms(forms);

      setReturnHistory(Array.isArray(hist) ? hist : []);
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to load return management data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [department, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateForm = (id, field, value) => {
    setItemForms(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handleProcess = async (resourceId) => {
    const form = itemForms[resourceId] || {};
    const destination = form.destination || 'Available';
    const condition = form.condition || 'Good';

    if (destination === 'Maintenance Requested' && !form.maintenanceIssue?.trim()) {
      if (addToast) addToast('Please describe the maintenance issue before routing to maintenance.', 'error');
      return;
    }

    try {
      setProcessingId(resourceId);
      await processReturn(resourceId, {
        condition,
        destination,
        returnReason: form.returnReason,
        maintenanceIssue: form.maintenanceIssue?.trim() || form.officerNotes?.trim() || 'Maintenance required post-return',
        notes: form.officerNotes?.trim() || '',
      });

      if (addToast) {
        if (destination === 'Maintenance Requested') {
          addToast(`🛠 Item routed to Maintenance Queue for repair with issue notes logged.`, 'success');
        } else if (destination === 'Scrapped') {
          addToast(`🛑 Asset marked as Scrapped and decommissioned from inventory.`, 'error');
        } else {
          addToast(`✅ Return processed. Asset restocked to Available Inventory as "${condition}".`, 'success');
        }
      }

      await loadData();
    } catch (err) {
      if (addToast) addToast(err.message || 'Return processing failed.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const itemType = (item) => item.name || item.type;
  const visibleReturnItems = returnItems.filter((item) =>
    (queueTypeFilter === 'All' || itemType(item) === queueTypeFilter) &&
    matchesSearch(queueSearch, item.id, item.name, item.type, item.serialNumber, item.returnRequestedBy, item.assignedTo, item.returnReason, item.returnNotes, item.condition)
  );

  // Filtered return history
  const filteredHistory = useMemo(() => {
    return returnHistory.filter(entry => {
      const finalStatus = entry.finalStatus || entry.status || 'Available';
      if (historyFilter !== 'All' && finalStatus !== historyFilter) return false;

      if (historySearch.trim()) {
        const q = historySearch.toLowerCase();
        const code = (entry.code || entry.resourceId || entry.id || '').toLowerCase();
        const type = (entry.type || entry.resourceType || '').toLowerCase();
        const user = (entry.returnedBy || entry.assignedTo || '').toLowerCase();
        const reason = (entry.returnReason || '').toLowerCase();
        const notes = (entry.notes || '').toLowerCase();
        if (!code.includes(q) && !type.includes(q) && !user.includes(q) && !reason.includes(q) && !notes.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [returnHistory, historyFilter, historySearch]);

  const DESTINATION_BADGES = {
    'Available': { label: 'Restocked to Inventory', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', icon: 'inventory_2' },
    'Maintenance Requested': { label: 'Routed to Maintenance', bg: '#fffbeb', color: '#b45309', border: '#fde68a', icon: 'build' },
    'Maintenance': { label: 'Routed to Maintenance', bg: '#fffbeb', color: '#b45309', border: '#fde68a', icon: 'build' },
    'Scrapped': { label: 'Asset Scrapped', bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', icon: 'delete_forever' },
  };

  const CONDITION_COLORS = {
    Good: '#16a34a',
    Average: '#2563eb',
    Fair: '#d97706',
    Damaged: '#ef4444',
    Bad: '#dc2626'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>
            Return Inspection & Management
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Inspect returned assets from requesters, evaluate condition, and restock to inventory or route to maintenance.
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', background: '#e2e8f0', padding: 3, borderRadius: 10, gap: 2 }}>
          <button
            type="button"
            onClick={() => setActiveSubTab('queue')}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              background: activeSubTab === 'queue' ? '#ffffff' : 'transparent',
              color: activeSubTab === 'queue' ? '#0F386E' : '#64748b',
              boxShadow: activeSubTab === 'queue' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span className="material-icons" style={{ fontSize: 16 }}>assignment_return</span>
            Inspection Queue
            {returnItems.length > 0 && (
              <span style={{
                background: '#ef4444',
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 10,
                marginLeft: 2
              }}>
                {returnItems.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('history')}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              background: activeSubTab === 'history' ? '#ffffff' : 'transparent',
              color: activeSubTab === 'history' ? '#0F386E' : '#64748b',
              boxShadow: activeSubTab === 'history' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span className="material-icons" style={{ fontSize: 16 }}>history</span>
            Return History
            <span style={{
              background: '#cbd5e1',
              color: '#334155',
              fontSize: 11,
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: 10,
              marginLeft: 2
            }}>
              {returnHistory.length}
            </span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: INSPECTION QUEUE
      ───────────────────────────────────────────────────────────── */}
      {activeSubTab === 'queue' && (
        <>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              Loading pending returns...
            </div>
          ) : returnItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0' }}>
              <span className="material-icons" style={{ fontSize: 44, color: '#22c55e', display: 'block', marginBottom: 10 }}>
                check_circle
              </span>
              <strong style={{ fontSize: 16, color: '#1e293b', display: 'block' }}>All Returns Processed</strong>
              <span style={{ fontSize: 13, color: '#64748b', display: 'block', marginTop: 4 }}>
                There are no pending returned resources awaiting inspection in {department}.
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <TableToolbar
                standalone
                search={queueSearch}
                onSearchChange={setQueueSearch}
                placeholder="Search by asset ID, type, serial no., returned by or reason..."
                filters={[
                  { label: 'All Resource Types', value: queueTypeFilter, onChange: setQueueTypeFilter, options: uniqueOptions(returnItems, itemType) },
                ]}
                resultCount={visibleReturnItems.length}
                totalCount={returnItems.length}
              />
              {visibleReturnItems.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2.5rem', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', color: '#64748b', fontSize: 14 }}>
                  No returned items match your search.
                </div>
              )}
              {visibleReturnItems.map(item => {
                const form = itemForms[item.id] || {};
                const isProcessing = processingId === item.id;
                const destination = form.destination || 'Available';

                return (
                  <div
                    key={item.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 14,
                      padding: '1.25rem 1.5rem',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14
                    }}
                  >
                    {/* Top Row: Asset Meta */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: 15, color: '#0F386E', background: '#eff6ff', padding: '3px 10px', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                          {item.id}
                        </span>
                        <strong style={{ fontSize: 16, color: '#0f172a' }}>
                          {item.name || item.type}
                        </strong>
                        <span style={{ fontSize: 12, color: '#475569', background: '#f1f5f9', padding: '3px 8px', borderRadius: 6 }}>
                          {item.type}
                        </span>
                        {item.serialNumber && (
                          <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
                            SN: {item.serialNumber}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748b' }}>
                        <span>Returned by: <strong style={{ color: '#1e293b' }}>{item.assignedTo || 'Employee'}</strong></span>
                        <span>•</span>
                        <span>Return Date: <strong style={{ color: '#1e293b' }}>{item.date || 'Today'}</strong></span>
                      </div>
                    </div>

                    {/* Middle Row: User Return Context */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', background: '#f8fafc', padding: '12px 14px', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Requester Reason for Return
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginTop: 3 }}>
                          {item.returnReason || 'General Return'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          User Notes / Reported Condition
                        </div>
                        <div style={{ fontSize: 13, color: item.returnNotes ? '#334155' : '#94a3b8', fontStyle: item.returnNotes ? 'normal' : 'italic', marginTop: 3 }}>
                          {item.returnNotes || 'No specific issue notes logged by user.'}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Inventory Staff Inspection & Routing */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, alignItems: 'flex-end', paddingTop: 4 }}>
                      {/* Assessed Condition */}
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>
                          Assessed Condition
                        </label>
                        <select
                          value={form.condition}
                          onChange={e => {
                            const cond = e.target.value;
                            updateForm(item.id, 'condition', cond);
                            if (cond === 'Damaged' || cond === 'Bad') {
                              updateForm(item.id, 'destination', 'Maintenance Requested');
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: 8,
                            border: '1px solid #cbd5e1',
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#1e293b',
                            background: '#fff'
                          }}
                        >
                          {CONDITIONS.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      {/* Action / Destination */}
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>
                          Inventory Routing Action
                        </label>
                        <select
                          value={destination}
                          onChange={e => updateForm(item.id, 'destination', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: 8,
                            border: '1px solid #cbd5e1',
                            fontSize: 13,
                            fontWeight: 600,
                            color: destination === 'Maintenance Requested' ? '#b45309' : destination === 'Scrapped' ? '#b91c1c' : '#15803d',
                            background: '#fff'
                          }}
                        >
                          <option value="Available">✅ Restock to Inventory (Available)</option>
                          <option value="Maintenance Requested">🛠 Route to Maintenance (Needs Repair)</option>
                          <option value="Scrapped">🛑 Decommission &amp; Scrap (Unrepairable)</option>
                        </select>
                      </div>

                      {/* Process Action Button */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => handleProcess(item.id)}
                          disabled={isProcessing}
                          style={{
                            width: '100%',
                            padding: '9px 18px',
                            borderRadius: 8,
                            border: 'none',
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            background: destination === 'Maintenance Requested' ? '#d97706' : destination === 'Scrapped' ? '#dc2626' : '#0F386E',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            transition: 'opacity 0.2s'
                          }}
                        >
                          {isProcessing ? (
                            'Processing...'
                          ) : destination === 'Maintenance Requested' ? (
                            <>
                              <span className="material-icons" style={{ fontSize: 16 }}>build</span>
                              Route to Maintenance
                            </>
                          ) : destination === 'Scrapped' ? (
                            <>
                              <span className="material-icons" style={{ fontSize: 16 }}>delete</span>
                              Confirm Scrap
                            </>
                          ) : (
                            <>
                              <span className="material-icons" style={{ fontSize: 16 }}>check_circle</span>
                              Restock to Inventory
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Conditional Maintenance Issue Input if routing to maintenance */}
                    {destination === 'Maintenance Requested' && (
                      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 12px' }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>
                          Maintenance Issue Description (Sent to Maintenance Staff Queue):
                        </label>
                        <input
                          type="text"
                          value={form.maintenanceIssue || ''}
                          onChange={e => updateForm(item.id, 'maintenanceIssue', e.target.value)}
                          placeholder="Specify the defect or repair needed (e.g., loose hinge, power failure, damaged port)..."
                          style={{
                            width: '100%',
                            padding: '7px 10px',
                            borderRadius: 6,
                            border: '1px solid #fcd34d',
                            fontSize: 12,
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: RETURN HISTORY LOGS
      ───────────────────────────────────────────────────────────── */}
      {activeSubTab === 'history' && (
        <div style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          {/* Controls Bar */}
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1 }}>
              {/* Search */}
              <div style={{ position: 'relative', minWidth: 260, maxWidth: 380, flex: 1 }}>
                <span className="material-icons" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#94a3b8' }}>
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search by ID, item, returned by, reason..."
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px 7px 34px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 12,
                    boxSizing: 'border-box'
                  }}
                />
                {historySearch && (
                  <button
                    type="button"
                    onClick={() => setHistorySearch('')}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Destination Filter */}
              <select
                value={historyFilter}
                onChange={e => setHistoryFilter(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#334155',
                  background: '#fff',
                  cursor: 'pointer'
                }}
              >
                <option value="All">All Routed Destinations</option>
                <option value="Available">Restocked to Inventory</option>
                <option value="Maintenance Requested">Routed to Maintenance</option>
                <option value="Scrapped">Scrapped</option>
              </select>
            </div>

            <div style={{ fontSize: 12, color: '#64748b' }}>
              Showing <strong>{filteredHistory.length}</strong> of <strong>{returnHistory.length}</strong> logs
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '12px 14px' }}>Asset ID</th>
                  <th style={{ padding: '12px 14px' }}>Type</th>
                  <th style={{ padding: '12px 14px' }}>Returned By</th>
                  <th style={{ padding: '12px 14px' }}>Return Reason</th>
                  <th style={{ padding: '12px 14px' }}>Assessed Condition</th>
                  <th style={{ padding: '12px 14px' }}>Inventory Destination</th>
                  <th style={{ padding: '12px 14px' }}>Processed Date</th>
                  <th style={{ padding: '12px 14px' }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                      <span className="material-icons" style={{ fontSize: 36, color: '#cbd5e1', display: 'block', marginBottom: 8 }}>
                        manage_search
                      </span>
                      No return history records match your search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((entry, idx) => {
                    const finalStatus = entry.finalStatus || entry.status || 'Available';
                    const badge = DESTINATION_BADGES[finalStatus] || { label: finalStatus, bg: '#f1f5f9', color: '#475569', border: '#e2e8f0', icon: 'info' };
                    const condColor = CONDITION_COLORS[entry.condition] || '#475569';

                    return (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: idx % 2 === 0 ? '#ffffff' : '#fafbfc'
                        }}
                      >
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontWeight: 700, color: '#0F386E', background: '#eff6ff', padding: '2px 7px', borderRadius: 6, border: '1px solid #bfdbfe', fontSize: 12 }}>
                            {entry.code || entry.resourceId || entry.id}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1e293b' }}>
                          {entry.type || entry.resourceType || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#475569' }}>
                          {entry.returnedBy || entry.assignedTo || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#1e293b', fontWeight: 500, maxWidth: 180 }}>
                          {entry.returnReason || '—'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: condColor }}>
                            {entry.condition || '—'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '3px 9px',
                              borderRadius: 16,
                              background: badge.bg,
                              color: badge.text || badge.color,
                              border: `1px solid ${badge.border}`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <span className="material-icons" style={{ fontSize: 13 }}>{badge.icon}</span>
                            {badge.label}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>
                          {entry.processDate || entry.returnDate || entry.date || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 12, maxWidth: 220, lineHeight: 1.3 }}>
                          {entry.notes || <span style={{ color: '#cbd5e1' }}>—</span>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
