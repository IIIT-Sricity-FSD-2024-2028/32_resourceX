import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { fetchResources, processReturn } from '../../../../services/maintenanceOfficer';

const CONDITIONS = ['Good', 'Average', 'Fair', 'Damaged', 'Bad'];

export default function ReturnProcessView({ addToast }) {
  const { user } = useAuth();
  const department = user?.department || 'IT Services';

  const [returnItems, setReturnItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [conditions, setConditions] = useState({});
  const [processingId, setProcessingId] = useState(null);

  const loadReturns = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchResources({ department });
      const list = Array.isArray(res) ? res : [];
      const returned = list.filter(r => r.status === 'Returned');
      setReturnItems(returned);
      const initCond = {};
      returned.forEach(r => { initCond[r.id] = r.condition || 'Good'; });
      setConditions(initCond);
    } catch (err) {
      addToast(err.message || 'Failed to load return queue.', 'error');
    } finally {
      setLoading(false);
    }
  }, [department, addToast]);

  useEffect(() => { loadReturns(); }, [loadReturns]);

  const handleProcess = async (resourceId) => {
    try {
      setProcessingId(resourceId);
      const condition = conditions[resourceId] || 'Good';
      await processReturn(resourceId, condition);
      addToast(`✅ Return processed. Resource condition set to "${condition}".`, 'success');
      await loadReturns();
    } catch (err) {
      addToast(err.message || 'Return processing failed.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>Return Processing</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
          {returnItems.length} resource{returnItems.length !== 1 ? 's' : ''} awaiting return inspection
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading returns...</div>
      ) : returnItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0' }}>
          <span className="material-icons" style={{ fontSize: 48, color: '#22c55e', display: 'block', marginBottom: 12 }}>assignment_turned_in</span>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1e293b' }}>No pending returns</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>All returned resources have been processed.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {returnItems.map(res => {
            const isProcessing = processingId === res.id;
            const cond = conditions[res.id] || 'Good';
            const condColor = { Good: '#22c55e', Average: '#3b82f6', Fair: '#f59e0b', Damaged: '#ef4444', Bad: '#dc2626' }[cond] || '#64748b';
            return (
              <div key={res.id} style={{ background: '#fff', border: '1px solid #c4b5fd', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ background: '#f5f3ff', padding: '0.75rem 1rem', borderBottom: '1px solid #ddd6fe', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed' }}>↩ RETURNED</span>
                  <span className="material-icons" style={{ fontSize: 20, color: '#7c3aed' }}>assignment_return</span>
                </div>
                <div style={{ padding: '1rem' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>{res.type}</div>
                  <div style={{ fontSize: 12, color: '#64748b', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: '1rem' }}>
                    <span>ID: <strong style={{ color: '#3b82f6' }}>{res.id}</strong></span>
                    {res.serialNumber && <span>Serial: {res.serialNumber}</span>}
                    <span>Returned by: <strong>{res.assignedTo || '—'}</strong></span>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Inspect Condition</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {CONDITIONS.map(c => {
                        const colors = { Good: '#22c55e', Average: '#3b82f6', Fair: '#f59e0b', Damaged: '#ef4444', Bad: '#dc2626' };
                        const selected = conditions[res.id] === c;
                        return (
                          <button key={c} onClick={() => setConditions(prev => ({ ...prev, [res.id]: c }))}
                            style={{ padding: '5px 12px', border: `1px solid ${selected ? colors[c] : '#e2e8f0'}`, borderRadius: 8, background: selected ? `${colors[c]}15` : '#fff', color: selected ? colors[c] : '#64748b', fontSize: 12, fontWeight: selected ? 700 : 400, cursor: 'pointer' }}>
                            {c}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button onClick={() => handleProcess(res.id)} disabled={isProcessing}
                    style={{ width: '100%', padding: '10px 0', background: isProcessing ? '#94a3b8' : '#7c3aed', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: isProcessing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span className="material-icons" style={{ fontSize: 18 }}>task_alt</span>
                    {isProcessing ? 'Processing...' : `Process Return as "${cond}"`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
