import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  fetchRequestorReturnHistory,
  fetchRequestorMaintenanceHistory
} from '../../../../services/requestor';

export default function RequestorHistoryView({ addToast }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('returns'); // 'returns' | 'maintenance'
  const [returnHistory, setReturnHistory] = useState([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [conditionFilter, setConditionFilter] = useState('All');
  const [maintStatusFilter, setMaintStatusFilter] = useState('All');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [returns, maint] = await Promise.all([
        fetchRequestorReturnHistory().catch(() => []),
        fetchRequestorMaintenanceHistory().catch(() => [])
      ]);

      setReturnHistory(Array.isArray(returns) ? returns : []);
      setMaintenanceHistory(Array.isArray(maint) ? maint : []);
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to load activity history.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered returns
  const filteredReturns = useMemo(() => {
    return returnHistory.filter(item => {
      if (conditionFilter !== 'All' && item.condition !== conditionFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const code = (item.code || item.resourceId || item.id || '').toLowerCase();
        const type = (item.type || item.resourceType || '').toLowerCase();
        const reason = (item.returnReason || '').toLowerCase();
        const notes = (item.notes || '').toLowerCase();
        if (!code.includes(q) && !type.includes(q) && !reason.includes(q) && !notes.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [returnHistory, conditionFilter, searchTerm]);

  // Filtered maintenance
  const filteredMaintenance = useMemo(() => {
    return maintenanceHistory.filter(item => {
      if (maintStatusFilter !== 'All' && item.status !== maintStatusFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const code = (item.code || item.resourceId || item.id || '').toLowerCase();
        const type = (item.type || item.resourceType || '').toLowerCase();
        const issue = (item.issue || item.description || '').toLowerCase();
        const notes = (item.notes || '').toLowerCase();
        if (!code.includes(q) && !type.includes(q) && !issue.includes(q) && !notes.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [maintenanceHistory, maintStatusFilter, searchTerm]);

  const CONDITION_COLORS = {
    Good: '#16a34a',
    Average: '#2563eb',
    Fair: '#d97706',
    Damaged: '#ef4444',
    Bad: '#dc2626'
  };

  const MAINT_STATUS_BADGES = {
    'Repaired': { label: 'Repaired & Resolved', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', icon: 'verified' },
    'Maintenance': { label: 'Under Repair', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', icon: 'build' },
    'Maintenance Requested': { label: 'Ticket Logged', bg: '#fffbeb', color: '#b45309', border: '#fde68a', icon: 'schedule' },
    'Scrapped': { label: 'Decommissioned', bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', icon: 'cancel' }
  };

  return (
    <div className="view-section">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">My Activity &amp; History</h1>
          <p className="page-subtitle">
            Track past returned resources, inspection evaluations, and maintenance repair tickets.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Refresh button */}
          <button
            type="button"
            className="btn-secondary"
            onClick={loadData}
            style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Primary Tab Switcher */}
      <div style={{ display: 'flex', background: '#e2e8f0', padding: 3, borderRadius: 10, gap: 2, marginBottom: '1.5rem', width: 'fit-content' }}>
        <button
          type="button"
          onClick={() => { setActiveTab('returns'); setSearchTerm(''); }}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            border: 'none',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'returns' ? '#ffffff' : 'transparent',
            color: activeTab === 'returns' ? '#0F386E' : '#64748b',
            boxShadow: activeTab === 'returns' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.15s ease'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>assignment_return</span>
          Return History
          <span style={{
            background: activeTab === 'returns' ? '#eff6ff' : '#cbd5e1',
            color: activeTab === 'returns' ? '#1d4ed8' : '#475569',
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 12
          }}>
            {returnHistory.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('maintenance'); setSearchTerm(''); }}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            border: 'none',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'maintenance' ? '#ffffff' : 'transparent',
            color: activeTab === 'maintenance' ? '#0F386E' : '#64748b',
            boxShadow: activeTab === 'maintenance' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.15s ease'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>build</span>
          Maintenance History
          <span style={{
            background: activeTab === 'maintenance' ? '#eff6ff' : '#cbd5e1',
            color: activeTab === 'maintenance' ? '#1d4ed8' : '#475569',
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 12
          }}>
            {maintenanceHistory.length}
          </span>
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
        {/* Filter Controls Bar */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1 }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: 260, maxWidth: 380, flex: 1 }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#94a3b8' }}>
                search
              </span>
              <input
                type="text"
                placeholder={activeTab === 'returns' ? "Search returns by ID, type, reason..." : "Search maintenance by ID, type, issue..."}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 34px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 12,
                  boxSizing: 'border-box'
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: 14 }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Condition / Status Filter */}
            {activeTab === 'returns' ? (
              <select
                value={conditionFilter}
                onChange={e => setConditionFilter(e.target.value)}
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
                <option value="All">All Assessed Conditions</option>
                <option value="Good">Condition: Good</option>
                <option value="Average">Condition: Average</option>
                <option value="Fair">Condition: Fair</option>
                <option value="Damaged">Condition: Damaged</option>
                <option value="Bad">Condition: Bad</option>
              </select>
            ) : (
              <select
                value={maintStatusFilter}
                onChange={e => setMaintStatusFilter(e.target.value)}
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
                <option value="All">All Repair Statuses</option>
                <option value="Repaired">Repaired &amp; Resolved</option>
                <option value="Maintenance">Under Repair</option>
                <option value="Maintenance Requested">Ticket Logged</option>
              </select>
            )}
          </div>

          <div style={{ fontSize: 12, color: '#64748b' }}>
            Showing <strong>{activeTab === 'returns' ? filteredReturns.length : filteredMaintenance.length}</strong> records
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            TAB 1: RETURN HISTORY
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'returns' && (
          <div style={{ overflowX: 'auto' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3.5rem', color: '#64748b' }}>
                Loading return history...
              </div>
            ) : filteredReturns.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 44, color: '#94a3b8', display: 'block', marginBottom: 10 }}>
                  assignment_return
                </span>
                <strong style={{ fontSize: 15, color: '#1e293b', display: 'block' }}>No Return History Found</strong>
                <span style={{ fontSize: 13, color: '#64748b', display: 'block', marginTop: 4 }}>
                  {searchTerm || conditionFilter !== 'All'
                    ? 'No return records match your search or filter.'
                    : 'You have not returned any allocated equipment yet.'}
                </span>
              </div>
            ) : (
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '12px 14px' }}>Asset ID</th>
                    <th style={{ padding: '12px 14px' }}>Resource Type</th>
                    <th style={{ padding: '12px 14px' }}>Reason for Return</th>
                    <th style={{ padding: '12px 14px' }}>Assessed Condition</th>
                    <th style={{ padding: '12px 14px' }}>Return Status</th>
                    <th style={{ padding: '12px 14px' }}>Processed Date</th>
                    <th style={{ padding: '12px 14px' }}>Staff Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReturns.map((entry, idx) => {
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
                          <span style={{ fontWeight: 700, color: '#0F386E', background: '#eff6ff', padding: '2px 8px', borderRadius: 6, border: '1px solid #bfdbfe', fontSize: 12 }}>
                            {entry.code || entry.resourceId || entry.id}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1e293b' }}>
                          {entry.type || entry.resourceType || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#1e293b', fontWeight: 500, maxWidth: 200 }}>
                          <div>{entry.returnReason || 'General Return'}</div>
                          {entry.userNotes && (
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                              Notes: {entry.userNotes}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: condColor }}>
                            {entry.condition || '—'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '4px 10px',
                                borderRadius: 16,
                                background: '#f0fdf4',
                                color: '#15803d',
                                border: '1px solid #bbf7d0',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                width: 'fit-content'
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#16a34a' }}>check_circle</span>
                              Return Accepted &amp; Closed
                            </span>
                            <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3, paddingLeft: 2 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 12, color: '#16a34a' }}>verified</span>
                              Processed by Inventory
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>
                          {entry.processDate || entry.returnDate || entry.date || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 12, maxWidth: 220, lineHeight: 1.3 }}>
                          {entry.notes || <span style={{ color: '#cbd5e1' }}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 2: MAINTENANCE HISTORY
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'maintenance' && (
          <div style={{ overflowX: 'auto' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3.5rem', color: '#64748b' }}>
                Loading maintenance history...
              </div>
            ) : filteredMaintenance.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 44, color: '#94a3b8', display: 'block', marginBottom: 10 }}>
                  build
                </span>
                <strong style={{ fontSize: 15, color: '#1e293b', display: 'block' }}>No Maintenance Records Found</strong>
                <span style={{ fontSize: 13, color: '#64748b', display: 'block', marginTop: 4 }}>
                  {searchTerm || maintStatusFilter !== 'All'
                    ? 'No maintenance records match your search or filter.'
                    : 'You have not submitted any maintenance requests yet.'}
                </span>
              </div>
            ) : (
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '12px 14px' }}>Asset ID</th>
                    <th style={{ padding: '12px 14px' }}>Resource Type</th>
                    <th style={{ padding: '12px 14px', minWidth: 200 }}>Issue Reported</th>
                    <th style={{ padding: '12px 14px' }}>Priority</th>
                    <th style={{ padding: '12px 14px' }}>Status</th>
                    <th style={{ padding: '12px 14px' }}>Service Date</th>
                    <th style={{ padding: '12px 14px' }}>Technician / Resolution Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaintenance.map((entry, idx) => {
                    const statusConfig = MAINT_STATUS_BADGES[entry.status] || { label: entry.status || 'Under Review', bg: '#f1f5f9', color: '#475569', border: '#e2e8f0', icon: 'info' };
                    const priorityColor = entry.priority === 'High' ? '#ef4444' : entry.priority === 'Low' ? '#16a34a' : '#f59e0b';

                    return (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: idx % 2 === 0 ? '#ffffff' : '#fafbfc'
                        }}
                      >
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontWeight: 700, color: '#0F386E', background: '#eff6ff', padding: '2px 8px', borderRadius: 6, border: '1px solid #bfdbfe', fontSize: 12 }}>
                            {entry.code || entry.resourceId || entry.id}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1e293b' }}>
                          {entry.type || entry.resourceType || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#1e293b', fontWeight: 500, maxWidth: 220, lineHeight: 1.35 }}>
                          {entry.issue || entry.description || 'Maintenance requested'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: priorityColor, background: `${priorityColor}15`, padding: '2px 8px', borderRadius: 4, border: `1px solid ${priorityColor}30` }}>
                            {entry.priority || 'Medium'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '3px 9px',
                              borderRadius: 16,
                              background: statusConfig.bg,
                              color: statusConfig.color,
                              border: `1px solid ${statusConfig.border}`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{statusConfig.icon}</span>
                            {statusConfig.label}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>
                          {entry.actionDate || entry.date || entry.createdAt || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 12, maxWidth: 220, lineHeight: 1.3 }}>
                          {entry.notes || entry.resolutionNotes || (entry.status === 'Repaired' ? 'Repaired and verified in working condition.' : 'Under technical evaluation.')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
