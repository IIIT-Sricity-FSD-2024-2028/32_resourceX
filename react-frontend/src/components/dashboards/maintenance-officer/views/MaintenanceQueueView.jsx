import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  fetchResources,
  fetchMaintenanceHistory,
  acceptMaintenance,
  repairMaintenance,
  scrapMaintenance
} from '../../../../services/maintenanceOfficer';

const STEP_MAP = {
  'Maintenance Requested': { label: 'Requested', next: 'Accept', action: 'accept', color: '#f59e0b', bg: '#fffbeb' },
  'Maintenance': { label: 'Under Maintenance', next: 'Mark Repaired', action: 'repair', color: '#ef4444', bg: '#fef2f2' },
  'Repaired': { label: 'Repaired', next: null, action: null, color: '#22c55e', bg: '#f0fdf4' },
};

export default function MaintenanceQueueView({ addToast }) {
  const { user } = useAuth();
  const department = user?.department || 'IT Services';

  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [scrapConfirmId, setScrapConfirmId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [resList, hist] = await Promise.all([
        fetchResources({ department }),
        fetchMaintenanceHistory().catch(() => [])
      ]);
      const list = Array.isArray(resList) ? resList : [];
      setQueue(list.filter(r => r.status === 'Maintenance Requested' || r.status === 'Maintenance'));
      setHistory(Array.isArray(hist) ? hist : []);
    } catch (err) {
      addToast(err.message || 'Failed to load maintenance queue.', 'error');
    } finally {
      setLoading(false);
    }
  }, [department, addToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAction = async (resourceId, action) => {
    const fns = { accept: acceptMaintenance, repair: repairMaintenance };
    try {
      setProcessingId(resourceId);
      await fns[action](resourceId);
      const msgs = { accept: 'Maintenance accepted. Resource is now under repair.', repair: 'Resource marked as Repaired.' };
      addToast(msgs[action], 'success');
      await loadData();
    } catch (err) {
      addToast(err.message || 'Action failed.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleScrap = async (resourceId) => {
    try {
      setProcessingId(resourceId);
      await scrapMaintenance(resourceId);
      addToast('Resource has been scrapped.', 'success');
      setScrapConfirmId(null);
      await loadData();
    } catch (err) {
      addToast(err.message || 'Scrap failed.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>Maintenance Queue</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            {queue.length} resource{queue.length !== 1 ? 's' : ''} requiring maintenance attention
          </p>
        </div>
        <button onClick={() => setShowHistory(!showHistory)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: showHistory ? '#1e293b' : '#f1f5f9', color: showHistory ? '#fff' : '#475569', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <span className="material-icons" style={{ fontSize: 18 }}>history</span>
          {showHistory ? 'Hide History' : 'Show History'}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading...</div>
      ) : queue.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0' }}>
          <span className="material-icons" style={{ fontSize: 48, color: '#22c55e', display: 'block', marginBottom: 12 }}>check_circle_outline</span>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1e293b' }}>No active maintenance</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>All resources are in good standing.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {queue.map(res => {
            const step = STEP_MAP[res.status] || {};
            const isProcessing = processingId === res.id;
            return (
              <div key={res.id} style={{ background: '#fff', border: `1px solid ${step.color}40`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                {/* Status bar */}
                <div style={{ background: step.bg, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${step.color}30` }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: step.color }}>{step.label}</span>
                  <span className="material-icons" style={{ fontSize: 20, color: step.color }}>build</span>
                </div>

                {/* Resource Info */}
                <div style={{ padding: '1rem' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{res.type}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span>ID: <strong style={{ color: '#3b82f6' }}>{res.id}</strong></span>
                    {res.serialNumber && <span>Serial: {res.serialNumber}</span>}
                    <span>Condition: {res.condition || '—'}</span>
                    {res.assignedTo && <span>Last assigned to: {res.assignedTo}</span>}
                  </div>

                  {/* Step indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '1rem' }}>
                    {['Maintenance Requested', 'Maintenance', 'Repaired'].map((s, i) => {
                      const statuses = ['Maintenance Requested', 'Maintenance', 'Repaired'];
                      const currentIdx = statuses.indexOf(res.status);
                      const done = i <= currentIdx;
                      return (
                        <React.Fragment key={s}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: done ? '#3b82f6' : '#e2e8f0', flexShrink: 0 }} />
                          {i < 2 && <div style={{ flex: 1, height: 2, background: i < currentIdx ? '#3b82f6' : '#e2e8f0' }} />}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {step.next && (
                      <button onClick={() => handleAction(res.id, step.action)} disabled={isProcessing}
                        style={{ flex: 1, padding: '9px 0', background: step.color, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: isProcessing ? 'not-allowed' : 'pointer', opacity: isProcessing ? 0.7 : 1 }}>
                        {isProcessing ? 'Processing...' : step.next}
                      </button>
                    )}
                    <button onClick={() => setScrapConfirmId(res.id)} disabled={isProcessing}
                      style={{ padding: '9px 14px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      Scrap
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* History section */}
      {showHistory && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', fontWeight: 600, fontSize: 15, color: '#1e293b' }}>
            Maintenance History ({history.length} entries)
          </div>
          {history.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: 14 }}>No history yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Resource ID', 'Type', 'Action', 'Outcome', 'Date'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 20).map((h, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', color: '#3b82f6', fontWeight: 600 }}>{h.resourceId || h.id}</td>
                    <td style={{ padding: '10px 14px', color: '#1e293b' }}>{h.resourceType || h.type || '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>{h.action || 'Maintenance'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: h.outcome === 'Repaired' ? '#f0fdf4' : '#fef2f2', color: h.outcome === 'Repaired' ? '#16a34a' : '#dc2626' }}>
                        {h.outcome || h.status || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>{h.date || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Scrap confirm modal */}
      {scrapConfirmId && (
        <div onClick={() => setScrapConfirmId(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: '2rem', width: 380, textAlign: 'center' }}>
            <span className="material-icons" style={{ fontSize: 48, color: '#ef4444', display: 'block', marginBottom: 12 }}>warning</span>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>Scrap this resource?</h3>
            <p style={{ margin: '0 0 1.5rem', fontSize: 13, color: '#64748b' }}>This will permanently mark the resource as Scrapped. This cannot be undone.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setScrapConfirmId(null)} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleScrap(scrapConfirmId)} style={{ padding: '10px 20px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Yes, Scrap</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
