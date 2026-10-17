import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { fetchMaintenanceHistory, fetchReturnHistory } from '../../../../services/maintenanceOfficer';

export default function HistoryLogView({ addToast }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('maintenance');
  const [maintHistory, setMaintHistory] = useState([]);
  const [returnHistory, setReturnHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const [mh, rh] = await Promise.all([
        fetchMaintenanceHistory().catch(() => []),
        fetchReturnHistory().catch(() => [])
      ]);
      setMaintHistory(Array.isArray(mh) ? mh : []);
      setReturnHistory(Array.isArray(rh) ? rh : []);
    } catch (err) {
      addToast(err.message || 'Failed to load history.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const currentList = activeTab === 'maintenance' ? maintHistory : returnHistory;
  const filtered = currentList.filter(h => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const id = (h.code || h.resourceId || h.id || '').toLowerCase();
    const type = (h.type || h.resourceType || '').toLowerCase();
    const issue = (h.issue || h.returnReason || '').toLowerCase();
    return id.includes(q) || type.includes(q) || issue.includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>Activity & Audit History</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Complete log of all maintenance servicing and return inspections</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by ID, type, issue..."
            style={{ padding: '8px 14px', border: '1px solid #cbd5e1', borderRadius: 10, fontSize: 13, width: 240, outline: 'none', background: '#fff' }}
          />
          <button
            onClick={loadHistory}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {[
          { id: 'maintenance', label: `Maintenance History (${maintHistory.length})`, icon: 'build' },
          { id: 'returns', label: `Return History (${returnHistory.length})`, icon: 'assignment_return' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 18px',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === tab.id ? '#fff' : 'transparent',
              color: activeTab === tab.id ? '#1e293b' : '#64748b',
              boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading records...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#94a3b8', display: 'block', marginBottom: 12 }}>history</span>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#334155' }}>No history entries found</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            {searchQuery ? 'Try clearing your search query.' : 'Activity will be logged here as equipment is serviced or returned.'}
          </div>
        </div>
      ) : activeTab === 'maintenance' ? (
        /* Maintenance Table */
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Asset ID', 'Type', 'Reported Issue', 'Resolution / Diagnostic', 'Outcome', 'Cost', 'Serviced Date'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, i) => {
                const status = entry.status || entry.outcome || 'Repaired';
                const isRepaired = status === 'Repaired';
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#3b82f6' }}>
                      {entry.code || entry.resourceId || entry.id}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#1e293b', fontWeight: 600 }}>
                      {entry.type || entry.resourceType || '—'}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#b45309', fontWeight: 600, maxWidth: 220 }}>
                      {entry.issue || 'Routine Maintenance'}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#475569', maxWidth: 220 }}>
                      {entry.resolutionNotes || '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: 20,
                          background: isRepaired ? '#f0fdf4' : '#fef2f2',
                          color: isRepaired ? '#16a34a' : '#dc2626',
                        }}
                      >
                        {status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#1e293b', fontWeight: 600 }}>
                      {entry.cost ? `$${Number(entry.cost).toFixed(2)}` : '—'}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>
                      {entry.actionDate || entry.date || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Return History Table */
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Asset ID', 'Type', 'Returned By', 'Reason for Return', 'Condition', 'Routed To', 'Notes', 'Processed Date'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, i) => {
                const finalStatus = entry.finalStatus || entry.status || 'Available';
                const destConfig = {
                  'Available': { label: 'Restocked', bg: '#f0fdf4', color: '#16a34a' },
                  'Maintenance Requested': { label: 'To Maintenance', bg: '#fffbeb', color: '#d97706' },
                  'Maintenance': { label: 'To Maintenance', bg: '#fffbeb', color: '#d97706' },
                  'Scrapped': { label: 'Scrapped', bg: '#fef2f2', color: '#dc2626' },
                }[finalStatus] || { label: finalStatus, bg: '#f1f5f9', color: '#475569' };

                const condColors = { Good: '#16a34a', Average: '#2563eb', Fair: '#d97706', Damaged: '#ef4444', Bad: '#dc2626' };
                const cColor = condColors[entry.condition] || '#64748b';

                return (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#3b82f6' }}>
                      {entry.code || entry.resourceId || entry.id}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#1e293b', fontWeight: 600 }}>
                      {entry.type || entry.resourceType || '—'}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>
                      {entry.returnedBy || entry.assignedTo || '—'}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#1e293b', fontWeight: 600, maxWidth: 180 }}>
                      {entry.returnReason || '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: cColor }}>
                        {entry.condition || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: 20,
                          background: destConfig.bg,
                          color: destConfig.color,
                        }}
                      >
                        {destConfig.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b', maxWidth: 200 }}>
                      {entry.notes || '—'}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>
                      {entry.processDate || entry.returnDate || entry.date || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
