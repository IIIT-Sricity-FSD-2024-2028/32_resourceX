import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { fetchMaintenanceHistory } from '../../../../services/maintenanceOfficer';

export default function HistoryLogView({ addToast }) {
  const { user } = useAuth();
  const [maintHistory, setMaintHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('ALL');

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const mh = await fetchMaintenanceHistory().catch(() => []);
      setMaintHistory(Array.isArray(mh) ? mh : []);
    } catch (err) {
      addToast(err.message || 'Failed to load maintenance history.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const filtered = maintHistory.filter(h => {
    const outcome = (h.status || h.outcome || 'Repaired').toLowerCase();
    if (outcomeFilter === 'REPAIRED' && outcome !== 'repaired') return false;
    if (outcomeFilter === 'SCRAPPED' && outcome !== 'scrap' && outcome !== 'scrapped') return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const id = (h.code || h.resourceId || h.id || '').toLowerCase();
    const type = (h.type || h.resourceType || '').toLowerCase();
    const issue = (h.issue || h.diagnosticIssue || '').toLowerCase();
    const notes = (h.resolutionNotes || h.notes || '').toLowerCase();
    const allocated = (h.allocatedTo || '').toLowerCase();
    const dept = (h.department || '').toLowerCase();
    return id.includes(q) || type.includes(q) || issue.includes(q) || notes.includes(q) || allocated.includes(q) || dept.includes(q);
  });

  const repairedCount = maintHistory.filter(h => (h.status || h.outcome || 'Repaired') === 'Repaired').length;
  const scrappedCount = maintHistory.filter(h => {
    const s = h.status || h.outcome || '';
    return s === 'Scrap' || s === 'Scrapped';
  }).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>Maintenance Activity History</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Complete log of all maintenance diagnostics, servicing, and repair resolutions</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by ID, type, issue, technician..."
            style={{ padding: '8px 14px', border: '1px solid #cbd5e1', borderRadius: 10, fontSize: 13, width: 260, outline: 'none', background: '#fff' }}
          />
          <button
            onClick={loadHistory}
            disabled={loading}
            title="Refresh history"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
          </button>
        </div>
      </div>

      {/* Outcome Filters */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {[
          { id: 'ALL', label: `All Records (${maintHistory.length})`, icon: 'view_list' },
          { id: 'REPAIRED', label: `Repaired (${repairedCount})`, icon: 'check_circle', color: '#16a34a' },
          { id: 'SCRAPPED', label: `Scrapped (${scrappedCount})`, icon: 'cancel', color: '#dc2626' },
        ].map(filter => {
          const isActive = outcomeFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => setOutcomeFilter(filter.id)}
              style={{
                padding: '6px 14px',
                border: isActive ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                background: isActive ? '#eff6ff' : '#fff',
                color: isActive ? '#1d4ed8' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: filter.color || (isActive ? '#1d4ed8' : '#94a3b8') }}>
                {filter.icon}
              </span>
              {filter.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading maintenance history...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#94a3b8', display: 'block', marginBottom: 12 }}>history</span>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#334155' }}>No maintenance records found</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            {searchQuery ? 'Try clearing your search query.' : 'Activity will be logged here as equipment is serviced or repaired.'}
          </div>
        </div>
      ) : (
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
                    <td style={{ padding: '12px 14px', color: '#475569', maxWidth: 260 }}>
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
                      {entry.cost !== undefined && entry.cost !== null && entry.cost !== '' ? `$${Number(entry.cost).toFixed(2)}` : '—'}
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
      )}
    </div>
  );
}
