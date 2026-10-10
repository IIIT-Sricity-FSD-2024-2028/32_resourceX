import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { fetchDeptResources } from '../../../../services/deptHead';
import { StatusBadge, EmptyRow, LoadingBlock, ErrorBlock } from '../components/deptHeadUtils';

/**
 * #dept-resources-view from department_head.html
 */
export default function DeptHeadResources() {
  const { user } = useAuth();
  const { addToast = () => {} } = useOutletContext() || {};

  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await fetchDeptResources();
      setResources(list || []);
    } catch (err) {
      setError(err.message || 'Failed to load department resources.');
      addToast(err.message || 'Error loading resources', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const statuses = useMemo(() => ['All', ...new Set(resources.map((r) => r.status).filter(Boolean))], [resources]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((r) => {
      if (statusFilter !== 'All' && r.status !== statusFilter) return false;
      if (!q) return true;
      return [r.id, r.type, r.name, r.assignedTo, r.condition, r.status, r.serialNumber]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [resources, query, statusFilter]);

  return (
    <div className="view-section">
      <h1 className="page-title">Department Resources</h1>
      <p className="page-subtitle">Inventory overview for {user?.department || 'your department'}.</p>

      <div className="data-section">
        <div className="data-section-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <div className="data-section-title">
            Current Inventory <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.9rem' }}>({filtered.length})</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              className="form-control"
              style={{ width: 'auto', padding: '0.45rem 0.75rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
              ))}
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.4rem 0.75rem', width: '250px', background: 'white' }}>
              <span className="material-symbols-outlined" style={{ color: '#94a3b8', fontSize: '1.2rem' }}>search</span>
              <input
                type="text"
                placeholder="Filter resources..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ border: 'none', outline: 'none', flex: 1, fontSize: '0.875rem', fontFamily: 'inherit', background: 'transparent' }}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <LoadingBlock text="Loading inventory..." />
        ) : error ? (
          <ErrorBlock text={error} onRetry={loadData} />
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Resource Code</th>
                  <th>Resource Type</th>
                  <th>Assigned To</th>
                  <th>Condition</th>
                  <th style={{ textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <EmptyRow colSpan={5} text={resources.length ? 'No resources match your filter.' : 'No resources in this department yet.'} />
                ) : (
                  filtered.map((res) => (
                    <tr key={res.id}>
                      <td className="td-id">{res.id}</td>
                      <td>
                        {res.type}
                        {res.name && res.name !== res.type && (
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{res.name}</div>
                        )}
                      </td>
                      <td>{res.assignedTo && res.assignedTo !== 'None' ? res.assignedTo : '--'}</td>
                      <td>{res.condition || 'Good'}</td>
                      <td style={{ textAlign: 'right' }}><StatusBadge status={res.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
