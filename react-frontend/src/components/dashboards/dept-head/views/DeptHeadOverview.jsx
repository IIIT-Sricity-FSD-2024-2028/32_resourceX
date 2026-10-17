import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { fetchDeptDashboardOverview } from '../../../../services/deptHead';
import {
  StatusBadge,
  EmptyRow,
  LoadingBlock,
  ErrorBlock,
  countBuckets,
  stockStatusOf
} from '../components/deptHeadUtils';
import TableToolbar, { matchesSearch } from '../../../common/TableToolbar';

/**
 * #dashboard-view from department_head.html
 */
export default function DeptHeadOverview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast = () => {} } = useOutletContext() || {};

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestSearch, setRequestSearch] = useState('');
  const [procSearch, setProcSearch] = useState('');

  const department = user?.department || 'your department';

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchDeptDashboardOverview();
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to load department dashboard.');
      addToast(err.message || 'Error loading dashboard', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) return <LoadingBlock text="Loading department dashboard..." />;
  if (error) return <ErrorBlock text={error} onRetry={loadData} />;

  const resources = data?.resources || [];
  const summary = data?.summary;
  const buckets = countBuckets(resources);
  const stats = {
    total: summary?.totalResources ?? resources.length,
    available: summary?.available ?? buckets.available,
    allocated: summary?.allocated ?? buckets.allocated,
    // maintenance bucket = everything not available/allocated/scrapped (same as original page)
    maintenance: buckets.maintenance,
    scrap: summary?.scrap ?? buckets.scrap
  };

  const incoming = (data?.requests || []).filter(
    (r) => r.status === 'Pending' && matchesSearch(requestSearch, r.id, r.resourceType, r.requestor)
  );
  const procurements = (summary?.procurements || data?.procurements || []).filter(
    (p) => matchesSearch(procSearch, p.id, p.resourceType, p.item, p.status)
  );

  const stock = (data?.stock || []).filter((s) => !user?.department || s.department === user.department);
  const lowStockTypes = stock
    .filter((s) => (s.status || stockStatusOf(s.currentQuantity, s.thresholdLevel)) === 'Low Stock')
    .map((s) => s.resourceType);

  return (
    <div className="view-section">
      <h1 className="page-title">Department Dashboard</h1>
      <p className="page-subtitle">
        Overview of <span>{department}</span> resources and requests.
      </p>

      {/* Alert Banner */}
      {lowStockTypes.length > 0 && (
        <div className="dh-low-stock-alert">
          <div>
            <span className="material-symbols-outlined" style={{ color: '#a16207', fontSize: '1.5rem', verticalAlign: 'middle', marginRight: '0.5rem' }}>
              warning
            </span>
            <strong style={{ color: '#854d0e' }}>Low Stock Alert: </strong>
            <span style={{ color: '#a16207', fontSize: '0.875rem' }}>
              {lowStockTypes.join(', ')} {lowStockTypes.length === 1 ? 'is' : 'are'} below the minimum threshold.
            </span>
          </div>
          <button
            type="button"
            className="btn-secondary"
            style={{ background: 'white', borderColor: '#fde047', color: '#854d0e' }}
            onClick={() => navigate('/dashboard/dept-head/procurement', { state: { resourceType: lowStockTypes[0] } })}
          >
            Create Procurement Request
          </button>
        </div>
      )}

      {/* Stats Row */}
      <div className="stats-grid dh-stats-5" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-title">Total Resources</div>
          <div className="stat-value-row">
            <div className="stat-value">{stats.total}</div>
            <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>inventory_2</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title" style={{ color: '#16a34a' }}>Available</div>
          <div className="stat-value-row">
            <div className="stat-value" style={{ color: '#16a34a' }}>{stats.available}</div>
            <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: '#16a34a' }}>inventory_2</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title" style={{ color: '#0284c7' }}>Allocated</div>
          <div className="stat-value-row">
            <div className="stat-value" style={{ color: '#0284c7' }}>{stats.allocated}</div>
            <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: '#0284c7' }}>inventory_2</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title" style={{ color: '#d97706' }}>Maintenance</div>
          <div className="stat-value-row">
            <div className="stat-value" style={{ color: '#d97706' }}>{stats.maintenance}</div>
            <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: '#d97706' }}>build</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title" style={{ color: '#dc2626' }}>Scrap</div>
          <div className="stat-value-row">
            <div className="stat-value" style={{ color: '#dc2626' }}>{stats.scrap}</div>
            <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: '#dc2626' }}>delete</span>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="dh-two-col">
        <div className="data-section" style={{ marginBottom: 0 }}>
          <div className="data-section-header">
            <div className="data-section-title">Incoming Requests (Pending)</div>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              onClick={() => navigate('/dashboard/dept-head/requests')}
            >
              View All
            </button>
          </div>
          <TableToolbar search={requestSearch} onSearchChange={setRequestSearch} placeholder="Search by ID, resource or requestor..." />
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Resource</th>
                  <th>By</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {incoming.length === 0 ? (
                  <EmptyRow colSpan={4} text={requestSearch.trim() ? 'No pending requests match your search.' : 'No pending requests.'} />
                ) : (
                  incoming.slice(0, 5).map((req) => (
                    <tr key={req.id}>
                      <td className="td-id">{req.id}</td>
                      <td>{req.resourceType}</td>
                      <td>{req.requestor}</td>
                      <td><StatusBadge status={req.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="data-section" style={{ marginBottom: 0 }}>
          <div className="data-section-header">
            <div className="data-section-title">Procurements</div>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              onClick={() => navigate('/dashboard/dept-head/procurement')}
            >
              View All
            </button>
          </div>
          <TableToolbar search={procSearch} onSearchChange={setProcSearch} placeholder="Search by ID, resource or status..." />
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Resource</th>
                  <th>Qty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {procurements.length === 0 ? (
                  <EmptyRow colSpan={4} text={procSearch.trim() ? 'No procurements match your search.' : 'No procurements yet.'} />
                ) : (
                  procurements.slice(0, 5).map((p) => (
                    <tr key={p.id}>
                      <td className="td-id">{p.id}</td>
                      <td>{p.resourceType || p.item}</td>
                      <td>{p.quantity}</td>
                      <td><StatusBadge status={p.status} /></td>
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
