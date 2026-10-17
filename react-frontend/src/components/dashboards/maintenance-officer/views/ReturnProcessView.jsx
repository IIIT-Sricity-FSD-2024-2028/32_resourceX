import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { fetchResources, processReturn } from '../../../../services/maintenanceOfficer';

const CONDITIONS = ['Good', 'Average', 'Fair', 'Damaged', 'Bad'];

export default function ReturnProcessView({ addToast }) {
  const { user } = useAuth();
  const department = user?.department || 'IT Services';

  const [returnItems, setReturnItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Per-item inspector states
  const [itemForms, setItemForms] = useState({});

  const loadReturns = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchResources({ department });
      const list = Array.isArray(res) ? res : [];
      const returned = list.filter(r => r.status === 'Returned');
      setReturnItems(returned);

      const forms = {};
      returned.forEach(r => {
        // Smart default destination: if marked Damaged/Bad or returnReason indicates fault, suggest Maintenance
        const isFaulty = r.condition === 'Damaged' || r.condition === 'Bad' || (r.returnReason && r.returnReason.toLowerCase().includes('fault'));
        forms[r.id] = {
          condition: r.condition || (isFaulty ? 'Damaged' : 'Good'),
          destination: isFaulty ? 'Maintenance Requested' : 'Available',
          returnReason: r.returnReason || 'Project Completed',
          maintenanceIssue: r.returnNotes || (isFaulty ? 'Hardware inspection required post-return' : ''),
          officerNotes: '',
        };
      });
      setItemForms(forms);
    } catch (err) {
      addToast(err.message || 'Failed to load return queue.', 'error');
    } finally {
      setLoading(false);
    }
  }, [department, addToast]);

  useEffect(() => { loadReturns(); }, [loadReturns]);

  const updateForm = (id, field, value) => {
    setItemForms(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handleProcess = async (resourceId) => {
    const form = itemForms[resourceId] || {};
    const destination = form.destination || 'Available';
    const condition = form.condition || 'Good';

    if (destination === 'Maintenance Requested' && !form.maintenanceIssue?.trim()) {
      addToast('Please provide the maintenance issue details before routing to maintenance.', 'error');
      return;
    }

    try {
      setProcessingId(resourceId);
      await processReturn(resourceId, {
        condition,
        destination,
        returnReason: form.returnReason,
        maintenanceIssue: form.maintenanceIssue?.trim() || form.officerNotes?.trim() || 'Maintenance required post-return',
        notes: form.officerNotes?.trim() || '',
      });

      if (destination === 'Maintenance Requested') {
        addToast(`🛠 Item routed to Maintenance Queue for repair with issue logged.`, 'success');
      } else if (destination === 'Scrapped') {
        addToast(`Asset scrapped and decommissioned from inventory.`, 'success');
      } else {
        addToast(`✅ Return processed. Asset restocked to Available inventory as "${condition}".`, 'success');
      }

      await loadReturns();
    } catch (err) {
      addToast(err.message || 'Return processing failed.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>Return Processing & Inspection</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Inspect returned assets, review return reasons, and route them to Available Stock, Maintenance Bench, or Scrap.
          </p>
        </div>
        <button
          onClick={loadReturns}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
          Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading returns...</div>
      ) : returnItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32 }}>assignment_turned_in</span>
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#1e293b' }}>All Returns Processed</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 6, maxWidth: 380, margin: '6px auto 0' }}>
            There are currently no returned assets awaiting inspection. When users submit returns, they will appear here.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {returnItems.map(res => {
            const isProcessing = processingId === res.id;
            const form = itemForms[res.id] || {
              condition: 'Good',
              destination: 'Available',
              returnReason: res.returnReason || 'Project Completed',
              maintenanceIssue: '',
              officerNotes: '',
            };

            const condColors = { Good: '#16a34a', Average: '#2563eb', Fair: '#d97706', Damaged: '#ef4444', Bad: '#dc2626' };

            return (
              <div
                key={res.id}
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 16,
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Header card badge */}
                <div style={{ background: '#f5f3ff', padding: '0.85rem 1.25rem', borderBottom: '1px solid #ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#7c3aed' }}>assignment_return</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', letterSpacing: '0.04em' }}>RETURNED ASSET</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', background: '#eff6ff', padding: '3px 8px', borderRadius: 6 }}>
                    {res.id}
                  </span>
                </div>

                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                  {/* Asset Details */}
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{res.name || res.type}</h3>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      <span>Type: <strong style={{ color: '#334155' }}>{res.type}</strong></span>
                      {res.serialNumber && <span>SN: <strong style={{ color: '#334155' }}>{res.serialNumber}</strong></span>}
                      <span>From: <strong style={{ color: '#334155' }}>{res.assignedTo || '—'}</strong></span>
                    </div>
                  </div>

                  {/* Return Reason info badge */}
                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                      Reported Reason for Return
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: form.returnReason.includes('Fault') ? '#ef4444' : '#6366f1' }}>
                        {form.returnReason.includes('Fault') ? 'warning' : 'info'}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                        {res.returnReason || form.returnReason}
                      </span>
                    </div>
                    {res.returnNotes && (
                      <div style={{ fontSize: 12, color: '#475569', marginTop: 4, fontStyle: 'italic', background: '#fff', padding: '6px 8px', borderRadius: 6, border: '1px dashed #cbd5e1' }}>
                        "{res.returnNotes}"
                      </div>
                    )}
                  </div>

                  {/* Condition Evaluation */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      Physical / Functional Condition
                    </label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {CONDITIONS.map(c => {
                        const isSelected = form.condition === c;
                        const color = condColors[c];
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              updateForm(res.id, 'condition', c);
                              // Auto suggest destination if selecting Damaged/Bad
                              if (c === 'Damaged' || c === 'Bad') {
                                updateForm(res.id, 'destination', 'Maintenance Requested');
                              }
                            }}
                            style={{
                              padding: '5px 12px',
                              borderRadius: 8,
                              border: `1px solid ${isSelected ? color : '#e2e8f0'}`,
                              background: isSelected ? `${color}15` : '#fff',
                              color: isSelected ? color : '#64748b',
                              fontSize: 12,
                              fontWeight: isSelected ? 700 : 500,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                          >
                            {c}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Destination / Action Selector */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      Action / Routing Destination <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                      {[
                        { id: 'Available', label: 'Restock', sub: 'To Inventory', icon: 'check_circle', color: '#16a34a' },
                        { id: 'Maintenance Requested', label: 'Needs Maint.', sub: 'To Bench', icon: 'build', color: '#d97706' },
                        { id: 'Scrapped', label: 'Scrap', sub: 'Decommission', icon: 'delete_forever', color: '#dc2626' },
                      ].map(dest => {
                        const isSelected = form.destination === dest.id;
                        return (
                          <button
                            key={dest.id}
                            type="button"
                            onClick={() => updateForm(res.id, 'destination', dest.id)}
                            style={{
                              padding: '8px 6px',
                              borderRadius: 10,
                              border: `1.5px solid ${isSelected ? dest.color : '#e2e8f0'}`,
                              background: isSelected ? `${dest.color}10` : '#fff',
                              color: isSelected ? dest.color : '#64748b',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 2,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{dest.icon}</span>
                            <span style={{ fontSize: 11, fontWeight: 700 }}>{dest.label}</span>
                            <span style={{ fontSize: 9, opacity: 0.8 }}>{dest.sub}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* If Route to Maintenance: Issue description */}
                  {form.destination === 'Maintenance Requested' && (
                    <div style={{ background: '#fffbeb', padding: '10px 12px', borderRadius: 10, border: '1px solid #fde68a' }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#b45309', marginBottom: 4 }}>
                        Maintenance Issue to Address <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={form.maintenanceIssue}
                        onChange={(e) => updateForm(res.id, 'maintenanceIssue', e.target.value)}
                        placeholder="e.g., Damaged hinge, fan noisy, battery failing..."
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #fcd34d', fontSize: 12, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                      />
                      <div style={{ fontSize: 10, color: '#92400e', marginTop: 4 }}>
                        Item will appear directly in the Maintenance Queue for technician repair.
                      </div>
                    </div>
                  )}

                  {/* Officer Notes */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                      Inspection Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={form.officerNotes}
                      onChange={(e) => updateForm(res.id, 'officerNotes', e.target.value)}
                      placeholder="e.g., Cleaned exterior, all original accessories verified..."
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Submit Button */}
                  <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                    <button
                      onClick={() => handleProcess(res.id)}
                      disabled={isProcessing}
                      style={{
                        width: '100%',
                        padding: '10px 0',
                        background: isProcessing
                          ? '#94a3b8'
                          : form.destination === 'Maintenance Requested'
                          ? '#d97706'
                          : form.destination === 'Scrapped'
                          ? '#dc2626'
                          : '#16a34a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        {form.destination === 'Maintenance Requested' ? 'build' : form.destination === 'Scrapped' ? 'delete_forever' : 'check'}
                      </span>
                      {isProcessing
                        ? 'Processing...'
                        : form.destination === 'Maintenance Requested'
                        ? 'Send to Maintenance Queue'
                        : form.destination === 'Scrapped'
                        ? 'Confirm Scrap Asset'
                        : `Restock as "${form.condition}"`}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
