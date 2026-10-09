import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import AdminModal from '../../components/dashboards/admin/components/AdminModal';
import StatusBadge from './components/StatusBadge';
import EmptyRow from './components/EmptyRow';
import { fetchDeptStock, updateStockThreshold } from '../../services/deptHead';

const SUMMARY_CARDS = [
  { status: 'Safe', title: 'Safe Stock', cls: 'stock-safe', icon: 'check_circle' },
  { status: 'Near Threshold', title: 'Near Threshold', cls: 'stock-near', icon: 'warning' },
  { status: 'Low Stock', title: 'Low Stock', cls: 'stock-low', icon: 'error' }
];

/**
 * Replica of stock-monitoring-view from department_head.html
 * Current quantity (available units) and status are computed by the backend.
 */
export default function StockMonitoring() {
  const { addToast = () => {}, department } = useOutletContext() || {};
  const navigate = useNavigate();

  const [stock, setStock] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [editTarget, setEditTarget] = useState(null);
  const [thresholdInput, setThresholdInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadStock = useCallback(async () => {
    try {
      const rows = await fetchDeptStock(department);
      setStock(rows || []);
    } catch (err) {
      addToast(err.message || 'Failed to load stock levels', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [department, addToast]);

  useEffect(() => {
    loadStock();
  }, [loadStock]);

  const counts = useMemo(() => {
    const c = { Safe: 0, 'Near Threshold': 0, 'Low Stock': 0 };
    stock.forEach((row) => {
      if (c[row.status] !== undefined) c[row.status]++;
    });
    return c;
  }, [stock]);

  const openEdit = (row) => {
    setEditTarget(row);
    setThresholdInput(String(row.thresholdLevel ?? ''));
  };

  const closeEdit = () => {
    setEditTarget(null);
    setThresholdInput('');
  };

  const handleSaveThreshold = async () => {
    if (!editTarget || isSaving) return;
    const val = Number(thresholdInput);
    if (thresholdInput.trim() === '' || !Number.isInteger(val) || val < 0) {
      addToast('Threshold must be a non-negative integer.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await updateStockThreshold(editTarget.id, val);
      addToast(`Threshold for ${editTarget.resourceType} updated to ${val}.`, 'success');
      closeEdit();
      await loadStock();
    } catch (err) {
      addToast(err.message || 'Failed to update threshold', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Integration hook: the Procurement page reads location.state.resourceType to prefill its form
  const handleSendRequest = (row) => {
    navigate('/dashboard/dept-head/procurement', { state: { resourceType: row.resourceType } });
  };

  return (
    <div className="view-section active">
      <h1 className="page-title">Low Stock Monitoring</h1>
      <p className="page-subtitle">Monitor resource stock levels and set thresholds for your department.</p>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '2rem' }}>
        {SUMMARY_CARDS.map((card) => (
          <div className={`stat-card ${card.cls}`} key={card.status}>
            <div className="stat-title">{card.title}</div>
            <div className="stat-value-row">
              <div className="stat-value">{isLoading ? '–' : counts[card.status]}</div>
              <span className="material-symbols-outlined" style={{ fontSize: '1.8rem' }}>{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="data-section">
        <div className="data-section-header">
          <div className="data-section-title">Resource Stock Levels</div>
        </div>
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
              {stock.length === 0 ? (
                <EmptyRow colSpan={5} isLoading={isLoading} message="No stock thresholds configured for this department." />
              ) : (
                stock.map((row) => (
                  <tr key={row.id}>
                    <td style={{ fontWeight: 500 }}>{row.resourceType}</td>
                    <td>{row.currentQuantity}</td>
                    <td>{row.thresholdLevel}</td>
                    <td><StatusBadge status={row.status} /></td>
                    <td className="dh-action-cell">
                      <button type="button" className="btn-ghost btn-ghost-primary" onClick={() => openEdit(row)}>
                        <span className="material-symbols-outlined">edit</span> Edit Threshold
                      </button>
                      {row.status === 'Low Stock' && (
                        <button type="button" className="btn-ghost btn-ghost-danger" onClick={() => handleSendRequest(row)}>
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
      </div>

      <AdminModal
        isOpen={Boolean(editTarget)}
        title="Edit Threshold"
        onClose={closeEdit}
        onConfirm={handleSaveThreshold}
        confirmText={isSaving ? 'Saving…' : 'Save Threshold'}
      >
        {editTarget && (
          <form onSubmit={(e) => { e.preventDefault(); handleSaveThreshold(); }}>
            <div className="stock-modal-resource-info">Resource: {editTarget.resourceType}</div>
            <div className="stock-modal-field">
              <label className="stock-modal-label" htmlFor="stock-current-qty">Current Quantity</label>
              <input
                id="stock-current-qty"
                type="number"
                className="stock-modal-input"
                value={editTarget.currentQuantity}
                disabled
              />
            </div>
            <div className="stock-modal-field">
              <label className="stock-modal-label" htmlFor="stock-threshold-input">Threshold Level</label>
              <input
                id="stock-threshold-input"
                type="number"
                min="0"
                step="1"
                className="stock-modal-input"
                value={thresholdInput}
                onChange={(e) => setThresholdInput(e.target.value)}
                autoFocus
              />
            </div>
          </form>
        )}
      </AdminModal>
    </div>
  );
}
