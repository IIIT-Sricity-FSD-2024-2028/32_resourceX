import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  fetchStaffResources,
  fetchStaffReturnHistory,
  processStaffReturn
} from '../../../../services/staff';

/**
 * 4. Return Management View
 * Inspect returned assets and update inventory availability.
 */
export default function ReturnsView({ addToast }) {
  const { user } = useAuth();
  const department = user?.department || 'IT Services';

  const [returnsQueue, setReturnsQueue] = useState([]);
  const [returnConditions, setReturnConditions] = useState({});
  const [history, setHistory] = useState([]);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [allRes, histList] = await Promise.all([
        fetchStaffResources({ department }),
        fetchStaffReturnHistory().catch(() => [])
      ]);

      const resList = Array.isArray(allRes) ? allRes : [];
      const pendingReturns = resList.filter((r) => r.status === 'Returned');
      setReturnsQueue(pendingReturns);

      const hist = Array.isArray(histList) ? histList : [];
      setHistory(hist);
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to load return records.', 'error');
    } finally {
      setLoading(false);
    }
  }, [department, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleConditionChange = (id, cond) => {
    setReturnConditions((prev) => ({ ...prev, [id]: cond }));
  };

  const handleProcessReturn = async (id) => {
    const selected = returnConditions[id];
    if (!selected) {
      if (addToast) addToast('Please select a condition/destination before processing return.', 'error');
      return;
    }

    try {
      setProcessingId(id);
      const item = returnsQueue.find(r => r.id === id);

      let destination = 'Available';
      let condition = selected;
      if (selected === 'Maintenance') {
        destination = 'Maintenance Requested';
        condition = 'Damaged';
      } else if (selected === 'Bad') {
        destination = 'Scrapped';
        condition = 'Bad';
      }

      await processStaffReturn(id, {
        condition,
        destination,
        returnReason: item?.returnReason || 'General Return',
        maintenanceIssue: item?.returnNotes || item?.returnReason || 'Inspection required post-return',
      });

      if (addToast) {
        if (destination === 'Maintenance Requested') {
          addToast('Return processed. Asset routed to Maintenance Queue for repair.', 'success');
        } else if (destination === 'Scrapped') {
          addToast('Return processed. Resource marked as Scrap.', 'error');
        } else {
          addToast('Return processed. Resource restocked as Available.', 'success');
        }
      }

      setReturnConditions((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });

      await loadData();
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to process return.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="staff-dashboard-wrapper">
      <div className="staff-header-row">
        <div className="staff-header-titles">
          <h1 className="page-title">Return Management</h1>
          <p className="page-subtitle">Inspect returned assets and route them to inventory, maintenance, or scrap.</p>
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

      {/* Pending Returns Table */}
      <div className="data-section">
        <div className="data-section-header">
          <div className="data-section-title">Pending Returns</div>
        </div>

        {loading ? (
          <div className="staff-loading-container">
            <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>
              sync
            </span>
            <span>Loading pending returns...</span>
          </div>
        ) : returnsQueue.length === 0 ? (
          <div className="staff-empty-state">
            <span className="material-symbols-outlined">assignment_turned_in</span>
            <p>No returned items awaiting inspection in {department}.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Returned By</th>
                  <th>Reason for Return</th>
                  <th>Return Date</th>
                  <th>Condition Inspection & Action</th>
                  <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {returnsQueue.map((res) => {
                  const selectedCond = returnConditions[res.id] || '';
                  const isProcessing = processingId === res.id;

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
                      <td>{res.assignedTo && res.assignedTo !== 'None' ? res.assignedTo : 'Unknown'}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{res.returnReason || 'General Return'}</div>
                        {res.returnNotes && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic', maxWidth: '200px' }}>
                            "{res.returnNotes}"
                          </div>
                        )}
                      </td>
                      <td>{res.date || new Date().toLocaleDateString('en-US')}</td>
                      <td>
                        <select
                          className="form-control"
                          style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem', minWidth: '190px' }}
                          value={selectedCond}
                          onChange={(e) => handleConditionChange(res.id, e.target.value)}
                        >
                          <option value="">-- Select Destination --</option>
                          <option value="Good">Good &rarr; Restock Available</option>
                          <option value="Average">Average &rarr; Restock Available</option>
                          <option value="Maintenance">Damaged &rarr; Send to Maintenance Queue</option>
                          <option value="Bad">Bad / Broken &rarr; Scrap Asset</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem' }}
                          disabled={!selectedCond || isProcessing}
                          onClick={() => handleProcessReturn(res.id)}
                        >
                          {isProcessing ? 'Processing...' : 'Process'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Collapsible Return History */}
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
          <span>Return History</span>
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
                <p>No return history logs recorded.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Type</th>
                      <th>Returned By</th>
                      <th>Return Date</th>
                      <th>Processed Date</th>
                      <th>Condition</th>
                      <th>Final Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((log, index) => {
                      const isAvailable = log.finalStatus === 'Available';
                      const badgeClass = isAvailable ? 'allocated' : 'rejected';

                      return (
                        <tr key={log.id || `${log.code}-${index}`}>
                          <td className="td-id">{log.code || log.id}</td>
                          <td>{log.type}</td>
                          <td>{log.returnedBy || 'Unknown'}</td>
                          <td>{log.returnDate || 'N/A'}</td>
                          <td>{log.processDate || 'N/A'}</td>
                          <td>{log.condition || 'N/A'}</td>
                          <td>
                            <span className={`badge ${badgeClass}`}>{log.finalStatus}</span>
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
