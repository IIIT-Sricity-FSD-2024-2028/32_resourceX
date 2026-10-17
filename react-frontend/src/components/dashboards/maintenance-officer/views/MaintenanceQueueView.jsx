import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  fetchResources,
  fetchMaintenanceHistory,
  acceptMaintenance,
  repairMaintenance,
  scrapMaintenance
} from '../../../../services/maintenanceOfficer';
import TableToolbar, { matchesSearch, uniqueOptions } from '../../../common/TableToolbar';

const STEP_MAP = {
  'Maintenance Requested': { label: 'Requested', next: 'Accept Request', action: 'accept', color: '#f59e0b', bg: '#fffbeb' },
  'Maintenance': { label: 'Under Repair', next: 'Mark Repaired', action: 'repair', color: '#ef4444', bg: '#fef2f2' },
  'Repaired': { label: 'Repaired', next: null, action: null, color: '#22c55e', bg: '#f0fdf4' },
};

const PRIORITY_COLORS = {
  Critical: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  High: { bg: '#ffedd5', text: '#9a3412', border: '#fdba74' },
  Medium: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
  Low: { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' },
};

export default function MaintenanceQueueView({ addToast }) {
  const { user } = useAuth();
  const department = user?.department || 'IT Services';

  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Modals
  const [repairModalItem, setRepairModalItem] = useState(null);
  const [repairNotes, setRepairNotes] = useState('');
  const [repairCost, setRepairCost] = useState('');
  const [repairCondition, setRepairCondition] = useState('Good');

  const [scrapConfirmItem, setScrapConfirmItem] = useState(null);
  const [scrapReason, setScrapReason] = useState('');

  const [showHistory, setShowHistory] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [historySearch, setHistorySearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('All');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [resList, hist] = await Promise.all([
        fetchResources({ department }),
        fetchMaintenanceHistory().catch(() => [])
      ]);
      const list = Array.isArray(resList) ? resList : [];
      setQueue(list.filter(r => r.status === 'Maintenance Requested' || r.status === 'Maintenance'));
      setHistory(Array.isArray(hist) ? hist : []);
    } catch (err) {
      addToast(err.message || 'Failed to load maintenance queue.', 'error');
    } finally {
      setLoading(false);
    }
  }, [department, addToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAccept = async (resourceId) => {
    try {
      setProcessingId(resourceId);
      await acceptMaintenance(resourceId);
      addToast('Maintenance accepted. Resource moved to Active Repair.', 'success');
      await loadData();
    } catch (err) {
      addToast(err.message || 'Failed to accept maintenance.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenRepairModal = (res) => {
    setRepairModalItem(res);
    setRepairNotes('');
    setRepairCost('');
    setRepairCondition('Good');
  };

  const handleConfirmRepairSubmit = async (e) => {
    e.preventDefault();
    if (!repairModalItem) return;
    try {
      setProcessingId(repairModalItem.id);
      await repairMaintenance(repairModalItem.id, {
        resolutionNotes: repairNotes.trim() || 'Serviced and verified functional',
        cost: repairCost ? Number(repairCost) : 0,
        condition: repairCondition,
        issue: repairModalItem.maintenanceIssue || 'Routine Maintenance',
      });
      addToast('Resource marked as Repaired and returned to inventory.', 'success');
      setRepairModalItem(null);
      await loadData();
    } catch (err) {
      addToast(err.message || 'Failed to complete repair.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenScrapModal = (res) => {
    setScrapConfirmItem(res);
    setScrapReason('Beyond economical repair');
  };

  const handleConfirmScrapSubmit = async (e) => {
    e.preventDefault();
    if (!scrapConfirmItem) return;
    try {
      setProcessingId(scrapConfirmItem.id);
      await scrapMaintenance(scrapConfirmItem.id, {
        resolutionNotes: scrapReason.trim() || 'Decommissioned from maintenance',
        issue: scrapConfirmItem.maintenanceIssue || 'Severe Malfunction',
      });
      addToast('Resource marked as Scrapped.', 'success');
      setScrapConfirmItem(null);
      await loadData();
    } catch (err) {
      addToast(err.message || 'Scrap action failed.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const stageLabel = (res) => (res.status === 'Maintenance' ? 'Under Repair' : 'Requested');
  const visibleQueue = queue.filter((res) =>
    (statusFilter === 'All' || stageLabel(res) === statusFilter) &&
    (priorityFilter === 'All' || res.maintenancePriority === priorityFilter) &&
    (sourceFilter === 'All' || (sourceFilter === 'From Return') === Boolean(res.routedFromReturn)) &&
    matchesSearch(search, res.id, res.name, res.type, res.serialNumber, res.condition, res.assignedTo, res.maintenanceIssue, res.maintenanceRequestDate)
  );
  const visibleHistory = history.filter((h) =>
    (outcomeFilter === 'All' || (h.status || 'Repaired') === outcomeFilter) &&
    matchesSearch(historySearch, h.code, h.resourceId, h.id, h.type, h.resourceType, h.issue, h.resolutionNotes, h.status, h.actionDate, h.date)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>Maintenance Workbench</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            {queue.length} resource{queue.length !== 1 ? 's' : ''} in the maintenance queue requiring diagnostic or repair action
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: showHistory ? '#1e293b' : '#f1f5f9', color: showHistory ? '#fff' : '#475569', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>history</span>
            {showHistory ? 'Hide History' : 'Show History'}
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
          </button>
        </div>
      </div>

      {!loading && queue.length > 0 && (
        <TableToolbar
          standalone
          search={search}
          onSearchChange={setSearch}
          placeholder="Search by asset ID, type, serial no., user or issue..."
          filters={[
            { label: 'All Stages', value: statusFilter, onChange: setStatusFilter, options: ['Requested', 'Under Repair'] },
            { label: 'All Priorities', value: priorityFilter, onChange: setPriorityFilter, options: ['Low', 'Medium', 'High', 'Critical'] },
            { label: 'All Sources', value: sourceFilter, onChange: setSourceFilter, options: ['From Return', 'User Reported'] },
          ]}
          resultCount={visibleQueue.length}
          totalCount={queue.length}
        />
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading maintenance queue...</div>
      ) : queue.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32 }}>check_circle</span>
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#1e293b' }}>Maintenance Workbench Clear</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>All equipment in this department is fully serviced and operational.</div>
        </div>
      ) : visibleQueue.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2.5rem', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', color: '#64748b', fontSize: 14 }}>
          No maintenance tickets match your search or filters.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {visibleQueue.map(res => {
            const step = STEP_MAP[res.status] || {};
            const isProcessing = processingId === res.id;
            const priorityStyle = PRIORITY_COLORS[res.maintenancePriority] || PRIORITY_COLORS.Medium;

            return (
              <div
                key={res.id}
                style={{
                  background: '#fff',
                  border: `1px solid ${step.color}40`,
                  borderRadius: 16,
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Status Bar */}
                <div style={{ background: step.bg, padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${step.color}30` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: step.color }}>build</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: step.color, letterSpacing: '0.04em' }}>
                      {step.label.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {res.maintenancePriority && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: priorityStyle.bg,
                          color: priorityStyle.text,
                          border: `1px solid ${priorityStyle.border}`,
                        }}
                      >
                        {res.maintenancePriority} Priority
                      </span>
                    )}
                    {res.routedFromReturn && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: '#ede9fe',
                          color: '#6d28d9',
                          border: '1px solid #ddd6fe',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                        title="Forwarded directly from Return Processing"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 12 }}>assignment_return</span>
                        From Return
                      </span>
                    )}
                  </div>
                </div>

                {/* Body Content */}
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem', flex: 1 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{res.name || res.type}</h3>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      <span>ID: <strong style={{ color: '#3b82f6' }}>{res.id}</strong></span>
                      {res.serialNumber && <span>SN: <strong>{res.serialNumber}</strong></span>}
                      <span>Condition: <strong>{res.condition || '—'}</strong></span>
                      {res.assignedTo && res.assignedTo !== 'None' ? (
                        <span>User: <strong>{res.assignedTo}</strong></span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Unallocated Asset</span>
                      )}
                    </div>
                  </div>

                  {/* Reported Issue Banner */}
                  <div style={{ background: '#fef3c7', padding: '10px 12px', borderRadius: 10, border: '1px solid #fde68a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#d97706' }}>report_problem</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Reported Maintenance Issue
                      </span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#78350f', lineHeight: 1.4 }}>
                      {res.maintenanceIssue || 'General hardware maintenance requested'}
                    </div>
                    {res.maintenanceRequestDate && (
                      <div style={{ fontSize: 11, color: '#b45309', marginTop: 4 }}>
                        Reported: {res.maintenanceRequestDate}
                      </div>
                    )}
                  </div>

                  {/* Progress Indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto', paddingTop: '0.5rem' }}>
                    {['Requested', 'Under Repair', 'Repaired'].map((s, i) => {
                      const curIdx = res.status === 'Maintenance' ? 1 : 0;
                      const done = i <= curIdx;
                      return (
                        <React.Fragment key={s}>
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: done ? '#3b82f6' : '#e2e8f0',
                              flexShrink: 0
                            }}
                          />
                          {i < 2 && <div style={{ flex: 1, height: 2, background: i < curIdx ? '#3b82f6' : '#e2e8f0' }} />}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', gap: 8, marginTop: '0.5rem' }}>
                    {res.status === 'Maintenance Requested' ? (
                      <button
                        onClick={() => handleAccept(res.id)}
                        disabled={isProcessing}
                        style={{
                          flex: 1,
                          padding: '9px 0',
                          background: '#f59e0b',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 10,
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: isProcessing ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          boxShadow: '0 2px 6px rgba(245,158,11,0.25)',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>assignment_turned_in</span>
                        {isProcessing ? 'Accepting...' : 'Accept Ticket'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenRepairModal(res)}
                        disabled={isProcessing}
                        style={{
                          flex: 1,
                          padding: '9px 0',
                          background: '#16a34a',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 10,
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: isProcessing ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          boxShadow: '0 2px 6px rgba(22,163,74,0.25)',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>task_alt</span>
                        Complete Repair
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenScrapModal(res)}
                      disabled={isProcessing}
                      style={{
                        padding: '9px 14px',
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fca5a5',
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete_forever</span>
                      Scrap
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* History section */}
      {showHistory && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: 15, color: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Maintenance History Log ({history.length} records)</span>
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>Showing recent repairs and decommissioned assets</span>
          </div>
          <TableToolbar
            search={historySearch}
            onSearchChange={setHistorySearch}
            placeholder="Search by asset ID, type, issue or resolution..."
            filters={[
              { label: 'All Outcomes', value: outcomeFilter, onChange: setOutcomeFilter, options: uniqueOptions(history, (h) => h.status || 'Repaired') },
            ]}
            resultCount={visibleHistory.length}
            totalCount={history.length}
          />
          {visibleHistory.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b', fontSize: 14 }}>
              {history.length === 0 ? 'No history recorded yet.' : 'No history records match your search.'}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {['Asset ID', 'Type', 'Reported Issue', 'Resolution / Diagnostic', 'Outcome', 'Cost', 'Date'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleHistory.slice(0, 25).map((h, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                      <td style={{ padding: '10px 14px', color: '#3b82f6', fontWeight: 700 }}>{h.code || h.resourceId || h.id}</td>
                      <td style={{ padding: '10px 14px', color: '#1e293b' }}>{h.type || h.resourceType || '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#b45309', fontWeight: 600, maxWidth: 220 }}>{h.issue || '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#475569', maxWidth: 220 }}>{h.resolutionNotes || '—'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: 20,
                            background: h.status === 'Repaired' ? '#f0fdf4' : '#fef2f2',
                            color: h.status === 'Repaired' ? '#16a34a' : '#dc2626',
                          }}
                        >
                          {h.status || 'Repaired'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#1e293b', fontWeight: 600 }}>
                        {h.cost ? `$${Number(h.cost).toFixed(2)}` : '—'}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#64748b' }}>{h.actionDate || h.date || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Complete Repair Modal */}
      {repairModalItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ background: '#f0fdf4', padding: '1.25rem 1.5rem', borderBottom: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 22 }}>task_alt</span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#14532d' }}>Complete Repair & Service</h3>
                  <div style={{ fontSize: 12, color: '#166534' }}>{repairModalItem.type} — {repairModalItem.id}</div>
                </div>
              </div>
              <button onClick={() => setRepairModalItem(null)} style={{ background: 'none', border: 'none', color: '#86efac', cursor: 'pointer', padding: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmRepairSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Issue recap */}
              <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}>
                <span style={{ color: '#64748b' }}>Reported issue: </span>
                <strong style={{ color: '#b45309' }}>{repairModalItem.maintenanceIssue || 'Routine Maintenance'}</strong>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Resolution / Repair Notes <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  value={repairNotes}
                  onChange={(e) => setRepairNotes(e.target.value)}
                  placeholder="Describe repair actions taken (e.g., Replaced cooling fan, updated firmware, cleaned motherboard, ran stress test)..."
                  rows={3}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Condition After Repair
                  </label>
                  <select
                    value={repairCondition}
                    onChange={(e) => setRepairCondition(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="Good">Good — Like new, fully functional</option>
                    <option value="Average">Average — Functional with cosmetic wear</option>
                    <option value="Fair">Fair — Usable, minor degradation</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Repair Cost ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={repairCost}
                    onChange={(e) => setRepairCost(e.target.value)}
                    placeholder="0.00"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setRepairModalItem(null)}
                  style={{ padding: '9px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId === repairModalItem.id}
                  style={{ padding: '9px 20px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
                  {processingId === repairModalItem.id ? 'Saving...' : 'Mark as Repaired'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scrap Modal */}
      {scrapConfirmItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ background: '#fef2f2', padding: '1.25rem 1.5rem', borderBottom: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>warning</span>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#991b1b' }}>Scrap Resource</h3>
                <div style={{ fontSize: 12, color: '#b91c1c' }}>{scrapConfirmItem.type} — {scrapConfirmItem.id}</div>
              </div>
            </div>

            <form onSubmit={handleConfirmScrapSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                Are you sure you want to scrap this resource? This will permanently decommission it from operational inventory.
              </p>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Reason for Scrapping
                </label>
                <input
                  type="text"
                  value={scrapReason}
                  onChange={(e) => setScrapReason(e.target.value)}
                  placeholder="e.g., Burned PCB, parts unrepairable, obsolete model"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setScrapConfirmItem(null)}
                  style={{ padding: '9px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId === scrapConfirmItem.id}
                  style={{ padding: '9px 20px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete_forever</span>
                  {processingId === scrapConfirmItem.id ? 'Scrapping...' : 'Confirm Scrap'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
