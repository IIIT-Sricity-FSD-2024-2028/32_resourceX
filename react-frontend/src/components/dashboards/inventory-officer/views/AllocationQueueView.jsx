import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  fetchApprovedRequests,
  fetchAvailableResources,
  allocateRequest
} from '../../../../services/inventoryOfficer';

function normalizeToken(v) {
  return String(v || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}
function matchesType(resource, requestedType) {
  const t = normalizeToken(requestedType);
  const rt = normalizeToken(resource?.type);
  if (!t || !rt) return false;
  if (t === rt) return true;
  const strip = s => s.endsWith('s') ? s.slice(0, -1) : s;
  return strip(t) === strip(rt) || t.replace(/s/g, '') === rt.replace(/s/g, '');
}

export default function AllocationQueueView({ addToast }) {
  const { user } = useAuth();
  const department = user?.department || 'IT Services';

  const [requests, setRequests] = useState([]);
  const [availableByType, setAvailableByType] = useState({});
  const [selectedResources, setSelectedResources] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allocatingId, setAllocatingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const reqList = await fetchApprovedRequests({ department });
      const list = Array.isArray(reqList) ? reqList : [];
      setRequests(list);

      const allAvail = await fetchAvailableResources({ department });
      const availList = Array.isArray(allAvail) ? allAvail.filter(r => r.status === 'Available') : [];

      const map = {};
      list.forEach(req => {
        const matching = availList.filter(r => matchesType(r, req.resourceType));
        map[req.id] = matching;
      });
      setAvailableByType(map);
    } catch (err) {
      addToast(err.message || 'Failed to load allocation queue.', 'error');
    } finally {
      setLoading(false);
    }
  }, [department, addToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleResource = (reqId, resourceId) => {
    setSelectedResources(prev => {
      const current = prev[reqId] || [];
      return { ...prev, [reqId]: current.includes(resourceId) ? current.filter(id => id !== resourceId) : [...current, resourceId] };
    });
  };

  const handleAllocate = async (req) => {
    const selected = selectedResources[req.id] || [];
    if (selected.length < req.quantity) {
      addToast(`Please select exactly ${req.quantity} resource(s). Currently ${selected.length} selected.`, 'error');
      return;
    }
    try {
      setAllocatingId(req.id);
      await allocateRequest(req.id, selected);
      addToast(`✅ Successfully allocated ${req.quantity}x ${req.resourceType} to ${req.requestor}`, 'success');
      setSelectedResources(prev => { const n = { ...prev }; delete n[req.id]; return n; });
      setOpenDropdown(null);
      await loadData();
    } catch (err) {
      addToast(err.message || 'Allocation failed.', 'error');
    } finally {
      setAllocatingId(null);
    }
  };

  const filtered = requests.filter(r =>
    !searchQuery || r.resourceType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.requestor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>Allocation Queue</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            {requests.length} approved request{requests.length !== 1 ? 's' : ''} awaiting resource allocation
          </p>
        </div>
        <div style={{ position: 'relative' }}>
          <span className="material-icons" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#94a3b8' }}>search</span>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by type, requestor..."
            style={{ padding: '8px 12px 8px 34px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, width: 240, outline: 'none', background: '#fff' }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading allocation queue...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0' }}>
          <span className="material-icons" style={{ fontSize: 48, color: '#22c55e', display: 'block', marginBottom: 12 }}>check_circle_outline</span>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1e293b' }}>All caught up!</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>No approved requests pending allocation.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(req => {
            const avail = availableByType[req.id] || [];
            const selected = selectedResources[req.id] || [];
            const hasEnough = avail.length >= req.quantity;
            const isAllocating = allocatingId === req.id;
            const isOpen = openDropdown === req.id;

            return (
              <div key={req.id} style={{ background: '#fff', border: `1px solid ${hasEnough ? '#e2e8f0' : '#fca5a5'}`, borderRadius: 14, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  {/* Request Info */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6', background: '#eff6ff', padding: '2px 8px', borderRadius: 6 }}>{req.id}</span>
                      <span style={{ fontSize: 12, color: '#64748b' }}>{req.date}</span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                      {req.resourceType} <span style={{ color: '#64748b', fontWeight: 400 }}>× {req.quantity}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      <span className="material-icons" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 3 }}>person</span>
                      {req.requestor}
                      {req.requirementDateDisplay && (
                        <span style={{ marginLeft: 12 }}>
                          <span className="material-icons" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 3 }}>schedule</span>
                          {req.requirementDateDisplay} → {req.returnDateDisplay || '—'}
                        </span>
                      )}
                    </div>
                    {req.justification && (
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, fontStyle: 'italic', maxWidth: 400 }}>
                        "{req.justification}"
                      </div>
                    )}
                  </div>

                  {/* Availability & Allocate */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                    <div style={{ fontSize: 12, color: hasEnough ? '#22c55e' : '#ef4444', fontWeight: 600, background: hasEnough ? '#f0fdf4' : '#fef2f2', padding: '4px 12px', borderRadius: 20 }}>
                      {avail.length} available / {req.quantity} needed
                    </div>

                    {hasEnough && (
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={() => setOpenDropdown(isOpen ? null : req.id)}
                          style={{ padding: '8px 14px', background: selected.length === req.quantity ? '#22c55e' : '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: selected.length === req.quantity ? '#fff' : '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <span className="material-icons" style={{ fontSize: 16 }}>inventory</span>
                          {selected.length}/{req.quantity} selected
                          <span className="material-icons" style={{ fontSize: 16 }}>{isOpen ? 'expand_less' : 'expand_more'}</span>
                        </button>
                        {isOpen && (
                          <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 50, minWidth: 280, maxHeight: 260, overflowY: 'auto' }}>
                            <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                              Select {req.quantity} resource(s)
                            </div>
                            {avail.map(res => {
                              const checked = selected.includes(res.id);
                              const disabled = !checked && selected.length >= req.quantity;
                              return (
                                <label key={res.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, borderBottom: '1px solid #f8fafc' }}>
                                  <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggleResource(req.id, res.id)} style={{ width: 15, height: 15 }} />
                                  <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{res.id}</div>
                                    <div style={{ fontSize: 11, color: '#64748b' }}>{res.serialNumber || 'No serial'} · {res.condition || '—'}</div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => handleAllocate(req)}
                      disabled={isAllocating || selected.length < req.quantity || !hasEnough}
                      style={{
                        padding: '9px 20px', background: selected.length >= req.quantity && hasEnough ? '#3b82f6' : '#e2e8f0',
                        color: selected.length >= req.quantity && hasEnough ? '#fff' : '#94a3b8',
                        border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: selected.length >= req.quantity ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', gap: 6
                      }}
                    >
                      <span className="material-icons" style={{ fontSize: 16 }}>sync_alt</span>
                      {isAllocating ? 'Allocating...' : !hasEnough ? 'Insufficient Stock' : 'Allocate Now'}
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
