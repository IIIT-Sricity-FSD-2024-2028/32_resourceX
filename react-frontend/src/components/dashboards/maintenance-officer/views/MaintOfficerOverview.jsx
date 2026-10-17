import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { fetchMaintenanceOfficerStats } from '../../../../services/maintenanceOfficer';

export default function MaintOfficerOverview({ onNavigate, addToast }) {
  const { user } = useAuth();
  const department = user?.department || 'IT Services';
  const [data, setData] = useState({ stats: {}, resources: [], maintHistory: [] });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchMaintenanceOfficerStats(department);
      setData(result);
    } catch (err) {
      addToast(err.message || 'Failed to load overview.', 'error');
    } finally {
      setLoading(false);
    }
  }, [department, addToast]);

  useEffect(() => { load(); }, [load]);

  const { stats } = data;
  const maintQueue = data.resources.filter(r => r.status === 'Maintenance Requested' || r.status === 'Maintenance').slice(0, 4);
  const routedFromReturns = data.resources.filter(r => (r.status === 'Maintenance Requested' || r.status === 'Maintenance') && r.routedFromReturn).slice(0, 4);

  const statCards = [
    { label: 'Maintenance Requested', value: stats.maintenanceRequested ?? 0, icon: 'report_problem', color: '#f59e0b', action: () => onNavigate('maintenance-queue') },
    { label: 'Under Maintenance', value: stats.underMaintenance ?? 0, icon: 'build', color: '#ef4444', action: () => onNavigate('maintenance-queue') },
    { label: 'Routed from Returns', value: routedFromReturns.length, icon: 'build_circle', color: '#8b5cf6', action: () => onNavigate('maintenance-queue') },
    { label: 'Repair History', value: data.maintHistory.length, icon: 'history', color: '#22c55e', action: () => onNavigate('history') },
  ];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, color: '#64748b' }}>
      Loading overview...
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {statCards.map(card => (
          <button key={card.label} onClick={card.action} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.25rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 16px ${card.color}30`; e.currentTarget.style.borderColor = card.color; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{card.label}</span>
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: card.color }}>{card.icon}</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: card.color }}>{card.value}</div>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Maintenance Queue Preview */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1e293b' }}>🔧 Maintenance Queue</h3>
            <button onClick={() => onNavigate('maintenance-queue')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>View all →</button>
          </div>
          {maintQueue.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: 14 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 36, display: 'block', marginBottom: 8, color: '#22c55e' }}>check_circle_outline</span>
              No active maintenance
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {maintQueue.map(res => (
                <div key={res.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#fef2f2', borderRadius: 10, border: '1px solid #fca5a5' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{res.type} — {res.id}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{res.status} · {res.condition || '—'}</div>
                  </div>
                  <button onClick={() => onNavigate('maintenance-queue')}
                    style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Action
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Routed from Returns Preview */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1e293b' }}>🛠 Routed from Returns (Needs Repair)</h3>
            <button onClick={() => onNavigate('maintenance-queue')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>View queue →</button>
          </div>
          {routedFromReturns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: 14 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 36, display: 'block', marginBottom: 8, color: '#22c55e' }}>check_circle_outline</span>
              No return-routed repair tickets
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {routedFromReturns.map(res => (
                <div key={res.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{res.type} — {res.id}</div>
                    <div style={{ fontSize: 11, color: '#92400e', marginTop: 2 }}>Issue: {res.maintenanceIssue || res.returnReason || 'Repair needed'}</div>
                  </div>
                  <button onClick={() => onNavigate('maintenance-queue')}
                    style={{ background: '#d97706', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Repair
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
