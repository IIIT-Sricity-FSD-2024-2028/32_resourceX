import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  fetchStaffRequests,
  fetchStaffResources,
  fetchStaffProcurements
} from '../../../../services/staff';

export default function DashboardView({ onSwitchView, addToast }) {
  const { user } = useAuth();
  const department = user?.department || 'IT Services';

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    allocations: 0,
    resources: 0,
    maintenance: 0,
    procurement: 0,
    returns: 0
  });
  const [urgentProcCount, setUrgentProcCount] = useState(0);
  const [allocationItems, setAllocationItems] = useState([]);
  const [maintenanceItems, setMaintenanceItems] = useState([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [reqList, resList, procList] = await Promise.all([
        fetchStaffRequests({ department }).catch(() => []),
        fetchStaffResources({ department }).catch(() => []),
        fetchStaffProcurements({ department }).catch(() => [])
      ]);

      const reqs = Array.isArray(reqList) ? reqList : [];
      const resources = Array.isArray(resList) ? resList : [];
      const procs = Array.isArray(procList) ? procList : [];

      const approvedReqs = reqs.filter((r) => r.status === 'Approved');
      const maintResources = resources.filter(
        (r) => r.status === 'Maintenance Requested' || r.status === 'Maintenance'
      );
      const returnResources = resources.filter((r) => r.status === 'Returned');
      const procTasks = procs.filter((p) => p.status === 'Approved');

      const urgentProcs = procTasks.filter((p) => {
        if (!p.targetDate) return false;
        const target = new Date(p.targetDate);
        if (isNaN(target.getTime())) return false;
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
        const diffDays = Math.round((startOfTarget - startOfToday) / (1000 * 60 * 60 * 24));
        return diffDays <= 3;
      });

      setStats({
        allocations: approvedReqs.length,
        resources: resources.length,
        maintenance: maintResources.length,
        procurement: procTasks.length,
        returns: returnResources.length
      });
      setUrgentProcCount(urgentProcs.length);

      setAllocationItems(approvedReqs.slice(0, 5));
      setMaintenanceItems(maintResources.slice(0, 5));
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to load dashboard overview.', 'error');
    } finally {
      setLoading(false);
    }
  }, [department, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="view-section active">
      <h1 className="page-title">Staff Dashboard</h1>
      <p className="page-subtitle">Overview of operations and pending tasks.</p>

      {/* Approaching Procurement Deadlines Alert Banner */}
      {urgentProcCount > 0 && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '0.9rem 1.25rem',
            borderRadius: '10px',
            backgroundColor: '#fffbeb',
            border: '1px solid #f59e0b',
            color: '#92400e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.6rem', color: '#d97706' }}>
              alarm_on
            </span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.925rem' }}>
                ⏰ Procurement Target Date Alert: {urgentProcCount} task{urgentProcCount > 1 ? 's' : ''} approaching deadline or past target date
              </div>
              <div style={{ fontSize: '0.8rem', color: '#78350f', marginTop: '2px' }}>
                Check procurement fulfillment to log vendor and invoice details. Purchases can still be completed even if late.
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn-primary"
            style={{ fontSize: '0.775rem', padding: '0.4rem 0.85rem', whiteSpace: 'nowrap' }}
            onClick={() => onSwitchView && onSwitchView('procurement')}
          >
            Fulfill Tasks →
          </button>
        </div>
      )}

      {/* 5 Stats Cards Grid matching staff.html */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div
          className="stat-card"
          style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', cursor: 'pointer' }}
          onClick={() => onSwitchView && onSwitchView('allocations')}
        >
          <div className="stat-title" style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Pending Allocations
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#0f38ae' }}>{stats.allocations}</div>
            <span className="material-symbols-outlined" style={{ fontSize: '1.75rem', color: '#0f38ae' }}>assignment</span>
          </div>
        </div>

        <div
          className="stat-card"
          style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', cursor: 'pointer' }}
          onClick={() => onSwitchView && onSwitchView('manage')}
        >
          <div className="stat-title" style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Resources
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#0f172a' }}>{stats.resources}</div>
            <span className="material-symbols-outlined" style={{ fontSize: '1.75rem', color: '#64748b' }}>inventory_2</span>
          </div>
        </div>

        <div
          className="stat-card"
          style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', cursor: 'pointer' }}
          onClick={() => onSwitchView && onSwitchView('maintenance')}
        >
          <div className="stat-title" style={{ fontSize: '0.8rem', color: '#d97706', fontWeight: 600, textTransform: 'uppercase' }}>
            Maintenance
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#d97706' }}>{stats.maintenance}</div>
            <span className="material-symbols-outlined" style={{ fontSize: '1.75rem', color: '#d97706' }}>build</span>
          </div>
        </div>

        <div
          className="stat-card"
          style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: urgentProcCount > 0 ? '1px solid #f59e0b' : '1px solid var(--border-color, #e2e8f0)', cursor: 'pointer' }}
          onClick={() => onSwitchView && onSwitchView('procurement')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="stat-title" style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 600, textTransform: 'uppercase' }}>
              Procurement Tasks
            </div>
            {urgentProcCount > 0 && (
              <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px' }}>
                ⏰ {urgentProcCount} Urgent
              </span>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#0284c7' }}>{stats.procurement}</div>
            <span className="material-symbols-outlined" style={{ fontSize: '1.75rem', color: '#0284c7' }}>shopping_cart</span>
          </div>
        </div>

        <div
          className="stat-card"
          style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', cursor: 'pointer' }}
          onClick={() => onSwitchView && onSwitchView('returns')}
        >
          <div className="stat-title" style={{ fontSize: '0.8rem', color: '#8b5cf6', fontWeight: 600, textTransform: 'uppercase' }}>
            Returns Pending
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#8b5cf6' }}>{stats.returns}</div>
            <span className="material-symbols-outlined" style={{ fontSize: '1.75rem', color: '#8b5cf6' }}>assignment_return</span>
          </div>
        </div>
      </div>

      {/* Two Column Content Grid matching staff.html */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Left Column: Allocation Requests */}
        <div className="data-section" style={{ flex: '1 1 340px', marginBottom: 0 }}>
          <div className="data-section-header">
            <div className="data-section-title">Allocation Requests</div>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              onClick={() => onSwitchView && onSwitchView('allocations')}
            >
              View All
            </button>
          </div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Resource</th>
                  <th>Qty</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {allocationItems.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                      No pending allocations.
                    </td>
                  </tr>
                ) : (
                  allocationItems.map((req) => (
                    <tr key={req.id}>
                      <td className="td-id">{req.id}</td>
                      <td>{req.resourceType}</td>
                      <td>{req.quantity}</td>
                      <td>{req.requestor}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Maintenance Queue */}
        <div className="data-section" style={{ flex: '1 1 340px', marginBottom: 0 }}>
          <div className="data-section-header">
            <div className="data-section-title">Maintenance Queue</div>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              onClick={() => onSwitchView && onSwitchView('maintenance')}
            >
              View All
            </button>
          </div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceItems.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                      No active maintenance items.
                    </td>
                  </tr>
                ) : (
                  maintenanceItems.map((res) => (
                    <tr key={res.id}>
                      <td className="td-id">{res.id}</td>
                      <td>{res.type}</td>
                      <td>
                        <span className="badge pending">{res.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
