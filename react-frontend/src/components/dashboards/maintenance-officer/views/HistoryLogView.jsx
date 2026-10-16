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
    return (h.resourceId || h.id || '').toLowerCase().includes(q) ||
      (h.resourceType || h.type || '').toLowerCase().includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>Activity History</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Log of all maintenance and return activities</p>
        </div>
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by ID or type..."
          style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, width: 220, outline: 'none', background: '#fff' }} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[{ id: 'maintenance', label: `Maintenance (${maintHistory.length})`, icon: 'build' },
          { id: 'returns', label: `Returns (${returnHistory.length})`, icon: 'assignment_return' }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ padding: '8px 16px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: activeTab === tab.id ? '#fff' : 'transparent', color: activeTab === tab.id ? '#1e293b' : '#64748b', boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="material-icons" style={{ fontSize: 16 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading history...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0' }}>
          <span className="material-icons" style={{ fontSize: 48, color: '#94a3b8', display: 'block', marginBottom: 12 }}>history</span>
          <div style={{ fontSize: 15, color: '#64748b' }}>No history entries found.</div>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Resource ID', 'Type', activeTab === 'maintenance' ? 'Action' : 'Returned By', 'Outcome / Condition', 'Date'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, i) => {
                const outcome = entry.outcome || entry.condition || entry.status;
                const outcomeColors = { Repaired: { bg: '#f0fdf4', text: '#16a34a' }, Scrapped: { bg: '#f8fafc', text: '#64748b' }, Good: { bg: '#f0fdf4', text: '#16a34a' }, Average: { bg: '#eff6ff', text: '#2563eb' }, Fair: { bg: '#fffbeb', text: '#d97706' }, Damaged: { bg: '#fef2f2', text: '#dc2626' }, Bad: { bg: '#fef2f2', text: '#dc2626' } };
                const c = outcomeColors[outcome] || { bg: '#f8fafc', text: '#64748b' };
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#3b82f6' }}>{entry.resourceId || entry.id}</td>
                    <td style={{ padding: '12px 14px', color: '#1e293b' }}>{entry.resourceType || entry.type || '—'}</td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>{activeTab === 'maintenance' ? (entry.action || 'Maintenance') : (entry.returnedBy || entry.assignedTo || '—')}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: c.bg, color: c.text }}>{outcome || '—'}</span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>{entry.date || entry.processedAt || '—'}</td>
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
