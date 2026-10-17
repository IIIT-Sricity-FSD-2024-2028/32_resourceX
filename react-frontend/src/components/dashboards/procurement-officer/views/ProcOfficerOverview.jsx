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
  const activeOrders = data.procurements
    .filter(p => ['Approved', 'PO Created', 'Fulfilled'].includes(p.status))
    .slice(0, 6);

  const statCards = [
    { label: 'Pending Indents', value: stats.pending ?? 0, icon: 'assignment', color: '#854d0e', action: () => onNavigate('indents') },
    { label: 'Approved (Awaiting PO)', value: stats.approved ?? 0, icon: 'check_circle', color: '#2563eb', action: () => onNavigate('orders') },
    { label: 'PO Uploaded (Awaiting Invoice)', value: stats.poCreated ?? 0, icon: 'description', color: '#d97706', action: () => onNavigate('orders') },
    { label: 'Fulfilled & Invoiced', value: stats.fulfilled ?? 0, icon: 'receipt_long', color: '#16a34a', action: () => onNavigate('orders') },
    { label: 'Registered in Inventory', value: stats.registered ?? 0, icon: 'inventory_2', color: '#7c3aed', action: () => onNavigate('purchase-history') },
  ];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, color: '#64748b' }}>Loading overview...</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {statCards.map(card => (
          <button key={card.label} onClick={card.action} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.15rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 16px ${card.color}30`; e.currentTarget.style.borderColor = card.color; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{card.label}</span>
              <span className="material-icons" style={{ fontSize: 22, color: card.color }}>{card.icon}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: card.color }}>{card.value}</div>
          </button>
        ))}
      </div>

      {/* Workflow Explainer */}
      <div style={{ background: 'linear-gradient(135deg, #0F386E, #1e293b)', borderRadius: 14, padding: '1.5rem', color: '#fff' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>Simplified Procurement Workflow</h3>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {[
            { step: '1', label: 'Approved Order', icon: 'check_circle', desc: 'Approved requests arrive ready for procurement' },
            { step: '2', label: 'Upload Purchase Order', icon: 'description', desc: 'Attach official PO document file' },
            { step: '3', label: 'Upload Invoice & Fulfill', icon: 'receipt_long', desc: 'Attach supplier invoice to complete order' },
            { step: '4', label: 'Asset Registration', icon: 'inventory_2', desc: 'Inventory Officer tags delivered items into stock' },
          ].map(({ step, label, icon, desc }) => (
            <div key={step} style={{ flex: 1, minWidth: 180, background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#3b82f6', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{step}</span>
                <span className="material-icons" style={{ fontSize: 16, color: '#93c5fd' }}>{icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{label}</span>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Open Orders Preview */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>📦 Active Orders in Pipeline</h3>
          <button onClick={() => onNavigate('orders')} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Manage all →</button>
        </div>
        {activeOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: 14 }}>
            <span className="material-icons" style={{ fontSize: 36, display: 'block', marginBottom: 8, color: '#22c55e' }}>check_circle_outline</span>
            No active orders in the pipeline right now.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeOrders.map(proc => {
              const sc = STATUS_COLORS[proc.status] || { bg: '#f8fafc', text: '#64748b' };
              return (
                <div key={proc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.15rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontWeight: 700, fontSize: 12, color: '#2563eb' }}>{proc.id}</span>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{proc.resourceType || proc.item} × {proc.quantity}</span>
                      {proc.poNumber && <span style={{ fontSize: 11, color: '#0284c7', background: '#eff6ff', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>{proc.poNumber}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      Dept: {proc.department} · {proc.vendor ? `Vendor: ${proc.vendor}` : `Requested by: ${proc.requestedBy || proc.requester}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: sc.bg, color: sc.text }}>{proc.status}</span>
                    <button onClick={() => onNavigate('orders')}
                      style={{ padding: '6px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Update Stage →
                    </button>
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
