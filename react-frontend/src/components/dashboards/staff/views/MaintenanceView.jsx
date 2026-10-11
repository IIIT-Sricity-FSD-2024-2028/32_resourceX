import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  fetchStaffResources,
  fetchStaffMaintenanceHistory,
  acceptStaffMaintenance,
  repairStaffMaintenance,
  scrapStaffMaintenance
} from '../../../../services/staff';

/**
 * 3. Maintenance Management View
 * Track and resolve active repair tickets.
 */
export default function MaintenanceView({ addToast }) {
  const { user } = useAuth();
  const department = user?.department || 'IT Services';

  const [activeQueue, setActiveQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [allRes, histList] = await Promise.all([
        fetchStaffResources({ department }),
        fetchStaffMaintenanceHistory().catch(() => [])
      ]);

      const resList = Array.isArray(allRes) ? allRes : [];
      // Active queue contains resources with status 'Maintenance Requested' or 'Maintenance'
      const queue = resList.filter(
        (r) => r.status === 'Maintenance Requested' || r.status === 'Maintenance'
      );
      setActiveQueue(queue);

      const hist = Array.isArray(histList) ? histList : [];
      setHistory(hist);
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to load maintenance records.', 'error');
    } finally {
      setLoading(false);
    }
  }, [department, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAccept = async (id) => {
    try {
      setProcessingId(id);
      await acceptStaffMaintenance(id);
      if (addToast) addToast('Maintenance accepted. Resource is now under maintenance.', 'success');
      await loadData();
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to accept maintenance.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRepair = async (id) => {
    try {
      setProcessingId(id);
      await repairStaffMaintenance(id);
      if (addToast) addToast('Resource marked as repaired. User notified.', 'success');
      await loadData();
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to mark as repaired.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleScrap = async (id) => {
    const confirmed = window.confirm('Permanently scrap this resource from maintenance?');
    if (!confirmed) return;

    try {
      setProcessingId(id);
      await scrapStaffMaintenance(id);
      if (addToast) addToast('Resource marked as scrap. User notified.', 'error');
      await loadData();
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to scrap resource.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="staff-dashboard-wrapper">
      <div className="staff-header-row">
        <div className="staff-header-titles">
          <h1 className="page-title">Maintenance Management</h1>
          <p className="page-subtitle">Track and resolve active repair tickets.</p>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={loadData}
          style={{ fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          disabled={loading}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            refresh
          </span>
          Refresh
        </button>
      </div>

      {/* Active Repair Queue */}
      <div className="data-section">
        <div className="data-section-header">
          <div className="data-section-title">Active Repair Queue</div>
        </div>

        {loading ? (
          <div className="staff-loading-container">
            <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>
              sync
            </span>
            <span>Loading repair queue...</span>
          </div>
        ) : activeQueue.length === 0 ? (
          <div className="staff-empty-state">
            <span className="material-symbols-outlined">build_circle</span>
            <p>No active maintenance tickets for {department}. All equipment is operational.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Allocated To</th>
                  <th>Issue/Status</th>
                  <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeQueue.map((res) => {
                  const isProcessing = processingId === res.id;
                  const isRequested = res.status === 'Maintenance Requested';
                  const isUnderMaintenance = res.status === 'Maintenance';
                  const statusLabel = isUnderMaintenance ? 'Under Maintenance' : res.status;

                  return (
                    <tr key={res.id}>
                      <td className="td-id">{res.code || res.id}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{res.type}</div>
                        {res.name && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                            {res.name}
                          </div>
                        )}
                      </td>
                      <td>{res.assignedTo && res.assignedTo !== 'None' ? res.assignedTo : 'Unassigned'}</td>
                      <td>
                        <span className="badge pending">{statusLabel}</span>
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {isRequested && (
                          <>
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ fontSize: '0.75rem', marginRight: '6px', padding: '0.25rem 0.65rem' }}
                              onClick={() => handleAccept(res.id)}
                              disabled={isProcessing}
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              className="btn-danger"
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                              onClick={() => handleScrap(res.id)}
                              disabled={isProcessing}
                            >
                              Reject &rarr; Scrap
                            </button>
                          </>
                        )}

                        {isUnderMaintenance && (
                          <>
                            <button
                              type="button"
                              className="btn-primary"
                              style={{
                                fontSize: '0.75rem',
                                backgroundColor: '#16a34a',
                                marginRight: '6px',
                                padding: '0.25rem 0.65rem'
                              }}
                              onClick={() => handleRepair(res.id)}
                              disabled={isProcessing}
                            >
                              Mark Repaired
                            </button>
                            <button
                              type="button"
                              className="btn-danger"
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                              onClick={() => handleScrap(res.id)}
                              disabled={isProcessing}
                            >
                              Mark Scrap
                            </button>
                          </>
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

      {/* Collapsible Maintenance History */}
      <div
        className="collapsible-header"
        onClick={() => setIsHistoryExpanded((prev) => !prev)}
        role="button"
        tabIndex={0}
      >
        <div className="collapsible-header-left">
          <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>
            history
          </span>
          <span>Maintenance History</span>
          <span className="badge pending" style={{ marginLeft: '8px' }}>
            {history.length}
          </span>
        </div>
        <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>
          {isHistoryExpanded ? 'expand_less' : 'expand_more'}
        </span>
      </div>

      {isHistoryExpanded && (
        <div className="collapsible-content">
          <div className="data-section" style={{ marginTop: '0' }}>
            {history.length === 0 ? (
              <div className="staff-empty-state">
                <span className="material-symbols-outlined">history_toggle_off</span>
                <p>No maintenance history records found.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Type</th>
                      <th>Allocated To</th>
                      <th>Issue</th>
                      <th>Action Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((log, index) => {
                      const isRepaired = log.status === 'Repaired';
                      const badgeClass = isRepaired ? 'allocated' : 'rejected';

                      return (
                        <tr key={log.id || `${log.code}-${index}`}>
                          <td className="td-id">{log.code || log.id}</td>
                          <td>{log.type}</td>
                          <td>{log.allocatedTo || 'Unassigned'}</td>
                          <td>{log.issue || 'Routine'}</td>
                          <td>{log.actionDate || 'N/A'}</td>
                          <td>
                            <span className={`badge ${badgeClass}`}>{log.status}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
