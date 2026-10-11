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

      setStats({
        allocations: approvedReqs.length,
        resources: resources.length,
        maintenance: maintResources.length,
        procurement: procTasks.length,
        returns: returnResources.length
      });

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
          style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', cursor: 'pointer' }}
          onClick={() => onSwitchView && onSwitchView('procurement')}
        >
          <div className="stat-title" style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 600, textTransform: 'uppercase' }}>
            Procurement Tasks
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
