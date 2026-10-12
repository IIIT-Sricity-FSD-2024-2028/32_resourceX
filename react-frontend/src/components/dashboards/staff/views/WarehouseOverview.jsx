import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { fetchStaffRequests, fetchStaffResources, allocateStaffRequest } from '../../../../services/staff';

export default function WarehouseOverview({ onTabChange, addToast }) {
  const { user } = useAuth();
  const department = user?.department || 'IT Services';

  const [orders, setOrders] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allocatingId, setAllocatingId] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [reqList, resList] = await Promise.all([
        fetchStaffRequests({ department }),
        fetchStaffResources({ department })
      ]);
      setOrders(Array.isArray(reqList) ? reqList : []);
      setResources(Array.isArray(resList) ? resList : []);
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to load warehouse overview.', 'error');
    } finally {
      setLoading(false);
    }
  }, [department, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleQuickDispatch = async (order) => {
    const normalizeToken = (val) => String(val || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const matchesType = (r, reqType) => {
      const t = normalizeToken(reqType);
      const rt = normalizeToken(r.type);
      if (!t || !rt) return false;
      if (t === rt) return true;
      const stripS = (s) => (s.endsWith('s') ? s.slice(0, -1) : s);
      return stripS(t) === stripS(rt) || t.replace(/s/g, '') === rt.replace(/s/g, '');
    };

    // Find available resources matching this order
    const available = resources.filter(
      (r) => r.status === 'Available' && matchesType(r, order.resourceType)
    );

    if (available.length < order.quantity) {
      if (onTabChange) {
        onTabChange('dispatches');
      }
      return;
    }

    const selectedIds = available.slice(0, order.quantity).map((r) => r.id);
    try {
      setAllocatingId(order.id);
      await allocateStaffRequest(order.id, selectedIds);
      if (addToast) {
        addToast(`Order ${order.id} dispatched successfully.`, 'success');
      }
      await loadData();
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to dispatch order.', 'error');
    } finally {
      setAllocatingId(null);
    }
  };

  return (
    <div>
      {/* Warehouse Dispatch Table */}
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid var(--border-color, #e2e8f0)',
          boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.2rem' }}>
              Pending Asset Dispatch Orders
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.8rem' }}>
              Physical equipment orders queued for handout to staff & faculty.
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onTabChange && onTabChange('dispatches')}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
          >
            Manage All Dispatches →
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            Loading dispatch orders...
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            No dispatch orders queued for {department}.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color, #e2e8f0)', color: '#64748b' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Order Ref</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Target User</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Department</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Asset Type</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Dispatch Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const isApproved = order.status === 'Approved';
                  const isAllocated = order.status === 'Allocated';
                  const isProcessing = allocatingId === order.id;

                  return (
                    <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0F386E' }}>
                        {order.id}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#1e293b' }}>
                        {order.requestor || 'Staff Member'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                        {order.department || department}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#0f172a' }}>
                        {order.resourceType}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        {isApproved ? (
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
                            onClick={() => handleQuickDispatch(order)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? 'Issuing...' : 'Issue Serial & Confirm'}
                          </button>
                        ) : isAllocated ? (
                          <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>check_circle</span>
                            Dispatched
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#d97706', fontWeight: 500 }}>
                            Pending Approval
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Summary Cards below table */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.75rem' }}>
            Warehouse Inventory Health
          </h3>
          <p style={{ fontSize: '0.825rem', color: '#64748b', marginBottom: '1rem' }}>
            Track in-stock physical units, condition grades, and department allocation ratios.
          </p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onTabChange && onTabChange('stock')}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
          >
            Open Stock Monitoring →
          </button>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.75rem' }}>
            Maintenance & Inspection Queue
          </h3>
          <p style={{ fontSize: '0.825rem', color: '#64748b', marginBottom: '1rem' }}>
            Inspect returned items and triage broken hardware on the repair bench.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onTabChange && onTabChange('repairs')}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              Maintenance Bench →
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onTabChange && onTabChange('returns')}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              Returns →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
