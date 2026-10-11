import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { fetchStaffRequests, fetchStaffResources, allocateStaffRequest } from '../../../../services/staff';

function normalizeResourceToken(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(v\d+|inch|inches|sets|set|bundles|bundle)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getResourceTypeAliases(resourceType) {
  const normalized = normalizeResourceToken(resourceType);
  const aliasMap = {
    laptop: ['laptop', 'developer laptop', 'laptop bundle'],
    'developer laptops': ['laptop', 'developer laptop'],
    'laptop bundles': ['laptop', 'laptop bundle'],
    monitor: ['monitor', 'electronics'],
    projector: ['projector', 'electronics'],
    'projector screens': ['projector', 'electronics'],
    tablet: ['tablet', 'electronics'],
    printer: ['printer', 'electronics'],
    router: ['router', 'switch', 'network switch', 'hardware'],
    'cisco routers': ['router', 'switch', 'network switch', 'hardware'],
    'server blades': ['server blade', 'hardware'],
    'server blades v2': ['server blade', 'hardware'],
    accessories: ['accessories', 'keyboard', 'mouse', 'remote', 'headset'],
    'ergonomic keyboards': ['keyboard', 'accessories'],
    electronics: ['electronics', 'monitor', 'projector', 'tablet', 'printer'],
    furniture: ['furniture', 'desk', 'chair', 'table', 'whiteboard'],
    'standing desks': ['desk', 'furniture'],
    'office desks': ['desk', 'furniture'],
    'conference tables': ['table', 'furniture'],
    whiteboards: ['whiteboard', 'furniture'],
    hardware: ['hardware', 'server blade', 'router', 'switch'],
    appliance: ['appliance', 'coffee machine'],
    'walkie talkies': ['electronics', 'accessories', 'walkie talkie'],
    'microscope sets': ['microscope', 'electronics']
  };
  const aliases = aliasMap[normalized] || [];
  return [...new Set([normalized, ...aliases].map((item) => normalizeResourceToken(item)).filter(Boolean))];
}

function resourceMatchesType(resource, requestedType) {
  const aliases = getResourceTypeAliases(requestedType);
  const resourceType = normalizeResourceToken(resource?.type);
  const resourceName = normalizeResourceToken(resource?.name);

  return aliases.some((alias) => {
    return (
      resourceType === alias ||
      resourceName === alias ||
      resourceType.includes(alias) ||
      resourceName.includes(alias) ||
      alias.includes(resourceType) ||
      alias.includes(resourceName)
    );
  });
}

/**
 * Allocation Dispatch View
 * Preserves the previous UI table structure, multiple rows, and full dispatch functionality.
 */
export default function AllocationsView({ addToast }) {
  const { user } = useAuth();
  const department = user?.department || 'IT Services';

  const [requests, setRequests] = useState([]);
  const [availableResources, setAvailableResources] = useState({});
  const [selectedResources, setSelectedResources] = useState({});
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allocatingId, setAllocatingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all department requests so staff sees the full allocation pipeline
      const reqList = await fetchStaffRequests({ department });
      const list = Array.isArray(reqList) ? reqList : [];
      setRequests(list);

      // Fetch all available inventory for this department
      const allRes = await fetchStaffResources({ status: 'Available', department });
      const availList = Array.isArray(allRes) ? allRes.filter((r) => r.status === 'Available') : [];

      // Map available resources matching each request's resource type
      const resMap = {};
      list.forEach((req) => {
        const matching = availList.filter((res) => resourceMatchesType(res, req.resourceType));
        // Fallback: if no strict match, provide other available resources in this department
        resMap[req.id] = matching.length > 0 ? matching : availList;
      });

      setAvailableResources(resMap);
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to load allocation requests.', 'error');
    } finally {
      setLoading(false);
    }
  }, [department, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Click outside listener for dropdowns
  useEffect(() => {
    function handleClickOutside(e) {
      if (!e.target.closest('.multi-select-container')) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleDropdown = (reqId) => {
    setOpenDropdownId((prev) => (prev === reqId ? null : reqId));
  };

  const handleCheckboxChange = (reqId, resourceId) => {
    setSelectedResources((prev) => {
      const current = prev[reqId] || [];
      const exists = current.includes(resourceId);
      const updated = exists ? current.filter((id) => id !== resourceId) : [...current, resourceId];
      return { ...prev, [reqId]: updated };
    });
  };

  const handleAllocate = async (req) => {
    const selected = selectedResources[req.id] || [];

    if (selected.length !== req.quantity) {
      if (addToast) {
        addToast(
          `Please select exactly ${req.quantity} resource(s) for this request (you selected ${selected.length}).`,
          'error'
        );
      }
      return;
    }

    try {
      setAllocatingId(req.id);
      await allocateStaffRequest(req.id, selected);
      if (addToast) {
        addToast(
          `Order ${req.id} Dispatched. ${selected.length} resource(s) allocated successfully.`,
          'success'
        );
      }
      // Reset selection for this request
      setSelectedResources((prev) => {
        const next = { ...prev };
        delete next[req.id];
        return next;
      });
      setOpenDropdownId(null);
      await loadData();
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to allocate request.', 'error');
    } finally {
      setAllocatingId(null);
    }
  };

  // Filter & Search logic
  const filteredRequests = requests
    .filter((req) => {
      if (filterStatus === 'Ready') return req.status === 'Approved';
      if (filterStatus === 'Pending') return req.status === 'Pending';
      if (filterStatus === 'Allocated') return req.status === 'Allocated';
      return true;
    })
    .filter((req) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        req.id?.toLowerCase().includes(q) ||
        req.resourceType?.toLowerCase().includes(q) ||
        req.requestor?.toLowerCase().includes(q) ||
        req.department?.toLowerCase().includes(q)
      );
    });

  const readyCount = requests.filter((r) => r.status === 'Approved').length;
  const pendingCount = requests.filter((r) => r.status === 'Pending').length;
  const allocatedCount = requests.filter((r) => r.status === 'Allocated').length;

  return (
    <div className="staff-dashboard-wrapper">
      {/* Title & Controls */}
      <div className="staff-header-row" style={{ marginBottom: '1.25rem' }}>
        <div className="staff-header-titles">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F386E', marginBottom: '0.25rem' }}>
            Allocation Dispatch
          </h2>
          <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.85rem' }}>
            Assign and issue physical inventory serials to department hardware requests.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={loadData}
            style={{ fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem' }}
            disabled={loading}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              refresh
            </span>
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem'
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setFilterStatus('All')}
            className={filterStatus === 'All' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', borderRadius: '6px' }}
          >
            All Orders ({requests.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('Ready')}
            className={filterStatus === 'Ready' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', borderRadius: '6px' }}
          >
            Ready for Handout ({readyCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('Pending')}
            className={filterStatus === 'Pending' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', borderRadius: '6px' }}
          >
            Pending Approval ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('Allocated')}
            className={filterStatus === 'Allocated' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', borderRadius: '6px' }}
          >
            Dispatched ({allocatedCount})
          </button>
        </div>

        <div style={{ position: 'relative', minWidth: '220px' }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: '0.6rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              fontSize: '18px'
            }}
          >
            search
          </span>
          <input
            type="text"
            className="input-field"
            placeholder="Search ref, user, asset..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              paddingLeft: '2.1rem',
              fontSize: '0.825rem',
              paddingTop: '0.4rem',
              paddingBottom: '0.4rem',
              borderRadius: '6px'
            }}
          />
        </div>
      </div>

      {/* Main Table Container */}
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid var(--border-color, #e2e8f0)',
          boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
          padding: '1.25rem'
        }}
      >
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1rem' }}>
          Pending Asset Dispatch Orders
        </h2>

        {loading ? (
          <div className="staff-loading-container">
            <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>
              sync
            </span>
            <span>Loading dispatch orders...</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="staff-empty-state" style={{ padding: '2rem 1rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: '#94a3b8' }}>
              assignment_turned_in
            </span>
            <p style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.9rem' }}>
              No dispatch orders match the current filter.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color, #e2e8f0)', color: '#64748b' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Order Ref</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Target User</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Department</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Asset Type</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Qty</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Dispatch Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => {
                  const matching = availableResources[req.id] || [];
                  const selected = selectedResources[req.id] || [];
                  const isComplete = selected.length === req.quantity;
                  const isOpen = openDropdownId === req.id;
                  const isProcessing = allocatingId === req.id;
                  const isApproved = req.status === 'Approved';
                  const isAllocated = req.status === 'Allocated';
                  const isPending = req.status === 'Pending';

                  return (
                    <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0F386E' }}>
                        {req.id}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#1e293b' }}>
                        {req.requestor || 'Staff User'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                        {req.department || department}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 500, color: '#0f172a' }}>
                        {req.resourceType}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>
                        {req.quantity}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {isApproved && (
                          <span
                            style={{
                              backgroundColor: '#dcfce7',
                              color: '#15803d',
                              fontWeight: 600,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>done</span>
                            Ready to Handout
                          </span>
                        )}
                        {isPending && (
                          <span
                            style={{
                              backgroundColor: '#fef3c7',
                              color: '#b45309',
                              fontWeight: 600,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>hourglass_empty</span>
                            Pending Approval
                          </span>
                        )}
                        {isAllocated && (
                          <span
                            style={{
                              backgroundColor: '#e0f2fe',
                              color: '#0369a1',
                              fontWeight: 600,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>check_circle</span>
                            Dispatched
                          </span>
                        )}
                        {!isApproved && !isPending && !isAllocated && (
                          <span
                            style={{
                              backgroundColor: '#f1f5f9',
                              color: '#475569',
                              fontWeight: 600,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem'
                            }}
                          >
                            {req.status}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        {isApproved ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <div className="multi-select-container" style={{ minWidth: '190px', textAlign: 'left' }}>
                              <div
                                className={`multi-select-header ${isOpen ? 'active' : ''}`}
                                onClick={() => handleToggleDropdown(req.id)}
                                style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', borderRadius: '6px' }}
                              >
                                <span
                                  className="multi-select-title"
                                  style={{
                                    color: isComplete ? '#16a34a' : 'inherit',
                                    fontWeight: isComplete ? 700 : 500,
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  {isComplete
                                    ? `${selected.length}/${req.quantity} Selected ✅`
                                    : `Select Serial (${selected.length}/${req.quantity})`}
                                </span>
                                <span
                                  className="material-symbols-outlined"
                                  style={{ fontSize: '1.1rem', color: '#94a3b8' }}
                                >
                                  {isOpen ? 'expand_less' : 'expand_more'}
                                </span>
                              </div>

                              {isOpen && (
                                <div className="multi-select-dropdown" style={{ right: 0, minWidth: '260px' }}>
                                  {matching.length === 0 ? (
                                    <div
                                      style={{
                                        padding: '0.75rem',
                                        textAlign: 'center',
                                        color: '#94a3b8',
                                        fontSize: '0.8rem'
                                      }}
                                    >
                                      No available matching stock found
                                    </div>
                                  ) : (
                                    matching.map((res) => {
                                      const isChecked = selected.includes(res.id);
                                      return (
                                        <label key={res.id}>
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => handleCheckboxChange(req.id, res.id)}
                                          />
                                          <span>
                                            <strong>{res.serialNumber || res.id}</strong> — {res.name || res.type}
                                          </span>
                                          <span className="multi-status-text">{res.condition || 'Good'}</span>
                                        </label>
                                      );
                                    })
                                  )}
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              className="btn-primary"
                              style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                              onClick={() => handleAllocate(req)}
                              disabled={isProcessing || !isComplete}
                              title={!isComplete ? `Select ${req.quantity} item(s) first` : ''}
                            >
                              {isProcessing ? 'Issuing...' : 'Issue Serial & Confirm'}
                            </button>
                          </div>
                        ) : isAllocated ? (
                          <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>
                            Completed
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                            Awaiting Approval
                          </span>
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
    </div>
  );
}
