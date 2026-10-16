import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  fetchInventoryOfficerStats,
  fetchApprovedRequests,
  fetchResources,
  fetchAvailableResources,
  allocateRequest
} from '../../../../services/inventoryOfficer';

const STATUS_COLORS = {
  Available: '#22c55e',
  Allocated: '#3b82f6',
  'Maintenance Requested': '#f59e0b',
  Maintenance: '#ef4444',
  Returned: '#8b5cf6',
  Repaired: '#06b6d4',
  Scrapped: '#6b7280',
};

export default function InvOfficerOverview({ onNavigate, addToast }) {
  const { user } = useAuth();
  const department = user?.department || 'IT Services';
  const [data, setData] = useState({ stats: {}, requests: [], resources: [] });
  const [loading, setLoading] = useState(true);
  const [allocatingId, setAllocatingId] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchInventoryOfficerStats(department);
      setData(result);
    } catch (err) {
      addToast(err.message || 'Failed to load overview.', 'error');
    } finally {
      setLoading(false);
    }
  }, [department, addToast]);

  useEffect(() => { load(); }, [load]);

  const handleQuickAllocate = async (req) => {
    try {
      setAllocatingId(req.id);
      const avail = await fetchAvailableResources({ department, type: req.resourceType });
      const availList = Array.isArray(avail) ? avail.filter(r => r.status === 'Available') : [];
      if (availList.length < req.quantity) {
        addToast(`Insufficient stock for ${req.resourceType}. Go to Allocation Queue.`, 'warning');
        onNavigate('allocation-queue');
        return;
      }
      const ids = availList.slice(0, req.quantity).map(r => r.id);
      await allocateRequest(req.id, ids);
      addToast(`✅ Allocated ${req.quantity}x ${req.resourceType} to ${req.requestor}`, 'success');
      await load();
    } catch (err) {
      addToast(err.message || 'Allocation failed.', 'error');
    } finally {
      setAllocatingId(null);
    }
  };

  const { stats } = data;
  const pendingRequests = data.requests.filter(r => r.status === 'Approved').slice(0, 5);
  const recentResources = data.resources.slice(0, 6);

  const statCards = [
    { label: 'Pending Allocations', value: stats.pendingAllocations ?? 0, icon: 'sync_alt', color: '#f59e0b', action: () => onNavigate('allocation-queue') },
    { label: 'Total Resources', value: stats.totalResources ?? 0, icon: 'inventory_2', color: '#3b82f6', action: () => onNavigate('inventory') },
    { label: 'Available', value: stats.available ?? 0, icon: 'check_circle', color: '#22c55e', action: () => onNavigate('inventory') },
    { label: 'Allocated', value: stats.allocated ?? 0, icon: 'assignment_turned_in', color: '#8b5cf6', action: () => onNavigate('inventory') },
  ];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, color: '#64748b', fontSize: 15 }}>
      <span className="material-icons" style={{ fontSize: 32, marginRight: 10, animation: 'spin 1s linear infinite' }}>refresh</span>
      Loading overview...
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {statCards.map(card => (
          <button key={card.label} onClick={card.action} style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.25rem',
            cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 16px ${card.color}30`; e.currentTarget.style.borderColor = card.color; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{card.label}</span>
              <span className="material-icons" style={{ fontSize: 22, color: card.color }}>{card.icon}</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: card.color }}>{card.value}</div>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Pending Allocations */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1e293b' }}>⚡ Quick Allocations</h3>
            <button onClick={() => onNavigate('allocation-queue')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>View all →</button>
          </div>
          {pendingRequests.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem 0', fontSize: 14 }}>
              <span className="material-icons" style={{ fontSize: 36, display: 'block', marginBottom: 8, color: '#22c55e' }}>check_circle_outline</span>
              All caught up!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pendingRequests.map(req => (
                <div key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{req.resourceType} × {req.quantity}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{req.requestor} · {req.date}</div>
                  </div>
                  <button
                    onClick={() => handleQuickAllocate(req)}
                    disabled={allocatingId === req.id}
                    style={{
                      background: allocatingId === req.id ? '#e2e8f0' : '#3b82f6', color: allocatingId === req.id ? '#64748b' : '#fff',
                      border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                    }}>
                    {allocatingId === req.id ? '...' : 'Allocate'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inventory Snapshot */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1e293b' }}>📦 Recent Inventory</h3>
            <button onClick={() => onNavigate('inventory')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>View all →</button>
          </div>
          {recentResources.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem 0', fontSize: 14 }}>No resources found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentResources.map(res => (
                <div key={res.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.75rem', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{res.type}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{res.id} · {res.serialNumber || '—'}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: `${STATUS_COLORS[res.status] || '#94a3b8'}20`, color: STATUS_COLORS[res.status] || '#94a3b8' }}>
                    {res.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
