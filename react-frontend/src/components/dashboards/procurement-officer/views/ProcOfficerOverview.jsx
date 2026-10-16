import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { fetchProcurementOfficerStats } from '../../../../services/procurementOfficer';

const STATUS_COLORS = {
  Approved: { bg: '#eff6ff', text: '#2563eb' },
  Fulfilled: { bg: '#f0fdf4', text: '#16a34a' },
  Registered: { bg: '#f5f3ff', text: '#7c3aed' },
  Pending: { bg: '#fffbeb', text: '#d97706' },
  Rejected: { bg: '#fef2f2', text: '#dc2626' },
};

export default function ProcOfficerOverview({ onNavigate, addToast }) {
  const { user } = useAuth();
  const department = user?.department || 'IT Services';
  const [data, setData] = useState({ stats: {}, procurements: [] });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchProcurementOfficerStats(department);
      setData(result);
    } catch (err) {
      addToast(err.message || 'Failed to load overview.', 'error');
    } finally {
      setLoading(false);
    }
  }, [department, addToast]);

  useEffect(() => { load(); }, [load]);

  const { stats } = data;
  const openOrders = data.procurements.filter(p => p.status === 'Approved').slice(0, 5);

  const statCards = [
    { label: 'Open Orders', value: stats.openOrders ?? 0, icon: 'shopping_cart', color: '#3b82f6', action: () => onNavigate('orders') },
    { label: 'Fulfilled', value: stats.fulfilled ?? 0, icon: 'local_shipping', color: '#22c55e', action: () => onNavigate('orders') },
    { label: 'Registered', value: stats.registered ?? 0, icon: 'inventory', color: '#8b5cf6', action: () => onNavigate('purchase-history') },
    { label: 'Total Orders', value: stats.total ?? 0, icon: 'receipt_long', color: '#f59e0b', action: () => onNavigate('purchase-history') },
  ];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, color: '#64748b' }}>Loading overview...</div>
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
              <span className="material-icons" style={{ fontSize: 22, color: card.color }}>{card.icon}</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: card.color }}>{card.value}</div>
          </button>
        ))}
      </div>

      {/* Workflow Explainer */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e293b)', borderRadius: 14, padding: '1.5rem', color: '#fff' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>Your Procurement Workflow</h3>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {[
            { step: '1', label: 'View Approved Orders', icon: 'shopping_cart', desc: 'Orders approved by Dept Head & Registrar' },
            { step: '2', label: 'Contact Vendor & Buy', icon: 'handshake', desc: 'Procure items from approved vendors' },
            { step: '3', label: 'Log Purchase', icon: 'receipt', desc: 'Record vendor details & upload invoice' },
            { step: '4', label: 'Inventory Officer Registers', icon: 'inventory_2', desc: 'Assets are tagged and added to inventory' },
          ].map(({ step, label, icon, desc }) => (
            <div key={step} style={{ flex: 1, minWidth: 180, background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#3b82f6', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{step}</span>
                <span className="material-icons" style={{ fontSize: 18, color: '#93c5fd' }}>{icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{label}</span>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Open Orders Preview */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1e293b' }}>🛒 Open Orders Awaiting Purchase</h3>
          <button onClick={() => onNavigate('orders')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>View all →</button>
        </div>
        {openOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: 14 }}>
            <span className="material-icons" style={{ fontSize: 36, display: 'block', marginBottom: 8, color: '#22c55e' }}>check_circle_outline</span>
            No open orders right now.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {openOrders.map(proc => {
              const sc = STATUS_COLORS[proc.status] || { bg: '#f8fafc', text: '#64748b' };
              return (
                <div key={proc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontWeight: 700, fontSize: 12, color: '#3b82f6' }}>{proc.id}</span>
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{proc.resourceType || proc.item} × {proc.quantity}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Dept: {proc.department} · {proc.date}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: sc.bg, color: sc.text }}>{proc.status}</span>
                    <button onClick={() => onNavigate('orders')}
                      style={{ padding: '6px 14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Log Purchase</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
