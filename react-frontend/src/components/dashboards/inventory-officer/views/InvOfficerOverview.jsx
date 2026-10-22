import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  fetchInventoryOfficerStats,
  fetchApprovedRequests,
  fetchResources,
  fetchAvailableResources,
  allocateRequest,
  updateResource
} from '../../../../services/inventoryOfficer';
import { fetchNotifications } from '../../../../services/notifications';

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
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allocatingId, setAllocatingId] = useState(null);
  const [restockingId, setRestockingId] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [result, notifs] = await Promise.all([
        fetchInventoryOfficerStats(department),
        fetchNotifications().catch(() => [])
      ]);
      setData(result);
      setNotifications(Array.isArray(notifs) ? notifs : []);
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

  const handleRestockAvailable = async (id) => {
    try {
      setRestockingId(id);
      await updateResource(id, { status: 'Available' });
      addToast?.('Resource restocked to Available Inventory.', 'success');
      await load();
    } catch (err) {
      addToast?.(err.message || 'Restock failed.', 'error');
    } finally {
      setRestockingId(null);
    }
  };

  const { stats } = data;
  const pendingRequests = data.requests.filter(r => r.status === 'Approved').slice(0, 5);
  const recentResources = data.resources.slice(0, 6);
  const recentAlerts = notifications.slice(0, 3);

  const statCards = [
    { label: 'Pending Allocations', value: stats.pendingAllocations ?? 0, icon: 'sync_alt', color: '#f59e0b', action: () => onNavigate('allocation-queue') },
    { label: 'Pending Returns', value: stats.pendingReturns ?? 0, icon: 'assignment_return', color: '#d97706', action: () => onNavigate('returns') },
    { label: 'Total Resources', value: stats.totalResources ?? 0, icon: 'inventory_2', color: '#3b82f6', action: () => onNavigate('inventory') },
    { label: 'Available Stock', value: stats.available ?? 0, icon: 'check_circle', color: '#22c55e', action: () => onNavigate('inventory') },
  ];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, color: '#64748b', fontSize: 15 }}>
      <span className="material-icons" style={{ fontSize: 32, marginRight: 10, animation: 'spin 1s linear infinite' }}>refresh</span>
      Loading overview...
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Pending Returns Banner */}
      {(stats.pendingReturns ?? 0) > 0 && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 12,
            background: '#fffbeb',
            border: '1px solid #fde68a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-icons" style={{ fontSize: 24, color: '#d97706' }}>
              assignment_return
            </span>
            <div>
              <strong style={{ fontSize: 14, color: '#92400e', display: 'block' }}>
                Pending Return Inspections: {stats.pendingReturns} resource{stats.pendingReturns > 1 ? 's' : ''} returned by requesters
              </strong>
              <span style={{ fontSize: 12, color: '#78350f' }}>
                Inspect physical assets to assess condition and restock to available inventory or route to maintenance.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('returns')}
            style={{
              background: '#d97706',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '7px 14px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Inspect Returns →
          </button>
        </div>
      )}

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

      {/* Live Activity & Notifications Feed */}
      {recentAlerts.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1rem 1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-icons" style={{ fontSize: 20, color: '#0891b2' }}>notifications_active</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Recent Department Notifications & Resource Alerts</span>
            </div>
            <span style={{ fontSize: 11, color: '#64748b' }}>Live notification feed</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentAlerts.map(n => {
              const isRepairedNotif = n.title?.includes('Repaired');
              return (
                <div key={n.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: isRepairedNotif ? '#f0fdfa' : '#f8fafc',
                  border: `1px solid ${isRepairedNotif ? '#99f6e4' : '#f1f5f9'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-icons" style={{ fontSize: 18, color: isRepairedNotif ? '#0d9488' : '#64748b' }}>
                      {isRepairedNotif ? 'check_circle' : 'info'}
                    </span>
                    <strong style={{ fontSize: 12, color: '#1e293b' }}>{n.title}</strong>
                    <span style={{ fontSize: 12, color: '#475569' }}>— {n.description}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', marginLeft: 8 }}>{n.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1e293b' }}>📦 Recent Inventory</h3>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>Latest active & repaired resources</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={() => onNavigate('inventory')}
                style={{
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span className="material-icons" style={{ fontSize: 14 }}>add</span>
                Add Resource
              </button>
              <button onClick={() => onNavigate('inventory')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>View all →</button>
            </div>
          </div>
          {recentResources.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem 0', fontSize: 14 }}>No resources found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentResources.map(res => {
                const isRepaired = res.status === 'Repaired';
                const isMaint = res.status === 'Maintenance Requested' || res.status === 'Maintenance';
                return (
                  <div key={res.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    background: isRepaired ? '#f0fdfa' : '#f8fafc',
                    borderRadius: 8,
                    border: `1px solid ${isRepaired ? '#99f6e4' : '#e2e8f0'}`
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>
                          {res.type} {res.name ? `· ${res.name}` : ''}
                        </span>
                        {isRepaired && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            background: '#ccfbf1',
                            color: '#0f766e',
                            padding: '1px 6px',
                            borderRadius: 4,
                            textTransform: 'uppercase'
                          }}>
                            Just Repaired
                          </span>
                        )}
                        {res.status === 'Maintenance Requested' && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            background: '#fef3c7',
                            color: '#b45309',
                            padding: '1px 6px',
                            borderRadius: 4,
                            textTransform: 'uppercase'
                          }}>
                            Needs Maint.
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                        <strong style={{ color: '#2563eb' }}>{res.id}</strong> · SN: {res.serialNumber || '—'}
                        {isRepaired && res.maintenanceNotes && (
                          <span style={{ display: 'block', color: '#0f766e', fontSize: 11, marginTop: 2 }}>
                            🔧 Note: {res.maintenanceNotes}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '3px 10px',
                        borderRadius: 20,
                        background: isRepaired ? '#ecfeff' : `${STATUS_COLORS[res.status] || '#94a3b8'}20`,
                        color: isRepaired ? '#0891b2' : (STATUS_COLORS[res.status] || '#94a3b8'),
                        border: isRepaired ? '1px solid #a5f3fc' : 'none'
                      }}>
                        {res.status}
                      </span>
                      {isRepaired && (
                        <button
                          type="button"
                          onClick={() => handleRestockAvailable(res.id)}
                          disabled={restockingId === res.id}
                          title="Restock to Available stock"
                          style={{
                            background: '#22c55e',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            padding: '3px 8px',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3
                          }}
                        >
                          <span className="material-icons" style={{ fontSize: 13 }}>check</span>
                          {restockingId === res.id ? '...' : 'Available'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
