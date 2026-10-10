import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { fetchDeptStock, updateDeptStockThreshold } from '../../../../services/deptHead';
import EditThresholdModal from '../components/EditThresholdModal';
import { StockBadge, EmptyRow, LoadingBlock, ErrorBlock, stockStatusOf } from '../components/deptHeadUtils';

/**
 * #stock-monitoring-view from department_head.html
 * Current quantity/status are computed by the backend (GET /analytics/stock).
 */
export default function DeptHeadStockMonitoring() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast = () => {} } = useOutletContext() || {};

  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await fetchDeptStock();
      const scoped = (list || [])
        .filter((s) => !user?.department || s.department === user.department)
        .map((s) => ({
          ...s,
          currentQuantity: s.currentQuantity ?? 0,
          status: s.status || stockStatusOf(s.currentQuantity ?? 0, s.thresholdLevel)
        }));
      setRows(scoped);
    } catch (err) {
      setError(err.message || 'Failed to load stock levels.');
      addToast(err.message || 'Error loading stock levels', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast, user?.department]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const counts = rows.reduce(
    (acc, r) => {
      if (r.status === 'Safe') acc.safe++;
      else if (r.status === 'Near Threshold') acc.near++;
      else acc.low++;
      return acc;
    },
    { safe: 0, near: 0, low: 0 }
  );

  const handleSave = async (rawValue) => {
    if (!editItem) return;
    const val = parseInt(rawValue, 10);
    if (Number.isNaN(val) || val < 0 || String(val) !== String(rawValue).trim()) {
      addToast('Threshold must be a non-negative integer.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      await updateDeptStockThreshold(editItem.id, val);
      setRows((prev) =>
        prev.map((r) =>
          r.id === editItem.id ? { ...r, thresholdLevel: val, status: stockStatusOf(r.currentQuantity, val) } : r
        )
      );
      addToast('Threshold updated successfully.', 'success');
      setEditItem(null);
    } catch (err) {
      addToast(`Failed to update threshold: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const sendStockRequest = (resourceType) => {
    navigate('/dashboard/dept-head/procurement', { state: { resourceType } });
  };

  return (
    <div className="view-section">
      <h1 className="page-title">Low Stock Monitoring</h1>
      <p className="page-subtitle">Monitor resource stock levels and set thresholds for your department.</p>

      {/* Summary Cards */}
      <div className="stats-grid dh-stats-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '2rem' }}>
        <div className="stat-card stock-safe">
          <div className="stat-title">Safe Stock</div>
          <div className="stat-value-row">
            <div className="stat-value">{counts.safe}</div>
            <span className="material-symbols-outlined" style={{ fontSize: '1.8rem' }}>check_circle</span>
          </div>
        </div>
        <div className="stat-card stock-near">
          <div className="stat-title">Near Threshold</div>
          <div className="stat-value-row">
            <div className="stat-value">{counts.near}</div>
            <span className="material-symbols-outlined" style={{ fontSize: '1.8rem' }}>warning</span>
          </div>
        </div>
        <div className="stat-card stock-low">
          <div className="stat-title">Low Stock</div>
          <div className="stat-value-row">
            <div className="stat-value">{counts.low}</div>
            <span className="material-symbols-outlined" style={{ fontSize: '1.8rem' }}>error</span>
          </div>
        </div>
      </div>

      {/* Stock Table */}
      <div className="data-section">
        <div className="data-section-header">
          <div className="data-section-title">Resource Stock Levels</div>
          <button type="button" className="btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }} onClick={loadData}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>refresh</span> Refresh
          </button>
        </div>
        {isLoading ? (
          <LoadingBlock text="Loading stock levels..." />
        ) : error ? (
          <ErrorBlock text={error} onRetry={loadData} />
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Resource Type</th>
                  <th>Current Quantity</th>
                  <th>Threshold Level</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <EmptyRow colSpan={5} text="No stock thresholds configured for this department." />
                ) : (
                  rows.map((item) => (
                    <tr key={item.id}>
                      <td>{item.resourceType}</td>
                      <td>{item.currentQuantity}</td>
                      <td>{item.thresholdLevel}</td>
                      <td><StockBadge status={item.status} /></td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button type="button" className="btn-ghost btn-ghost-primary" onClick={() => setEditItem(item)}>
                          <span className="material-symbols-outlined">edit</span> Edit Threshold
                        </button>
                        {item.status === 'Low Stock' && (
                          <button type="button" className="btn-ghost btn-ghost-danger" onClick={() => sendStockRequest(item.resourceType)}>
                            <span className="material-symbols-outlined">send</span> Send Request
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editItem && (
        <EditThresholdModal
          item={editItem}
          isSaving={isSaving}
          onClose={() => setEditItem(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
