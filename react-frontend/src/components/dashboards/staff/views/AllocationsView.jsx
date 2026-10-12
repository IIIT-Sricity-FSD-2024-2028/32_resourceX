import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { fetchStaffRequests, fetchStaffResources, allocateStaffRequest } from '../../../../services/staff';
import '../StaffDashboard.css';

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
 * 1. Allocation Requests View
 * Preserves the exact UI structure, table columns, multi-select dropdown, and actions from staff.html.
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
  const [statusFilter, setStatusFilter] = useState('Pending'); // 'Pending' | 'All' | 'Allocated'
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch department requests
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
          `Request ${req.id} Allocated. ${selected.length} resource(s) assigned successfully.`,
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
      if (statusFilter === 'Pending') return req.status === 'Approved';
      if (statusFilter === 'Allocated') return req.status === 'Allocated';
      return true; // 'All'
    })
    .filter((req) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        req.id?.toLowerCase().includes(q) ||
        req.resourceType?.toLowerCase().includes(q) ||
        req.requestor?.toLowerCase().includes(q)
      );
    });

  const pendingRequests = requests.filter((r) => r.status === 'Approved');

  // Check if any dropdown is currently open to adjust bottom spacing
  const isAnyDropdownOpen = !!openDropdownId;

  return (
    <div className="staff-dashboard-wrapper">
      {/* Title & Page Header matching staff.html */}
      <div className="staff-header-row">
        <div className="staff-header-titles">
          <h1 className="page-title">Allocation Requests</h1>
          <p className="page-subtitle">Assign physical inventory assets to approved department requests.</p>
        </div>
      </div>

      {/* Main Data Section matching staff.html */}
      <div
        className="data-section"
        style={{
          overflow: 'visible',
          minHeight: '320px',
          paddingBottom: isAnyDropdownOpen ? '160px' : '1.5rem',
          transition: 'padding-bottom 0.2s ease'
        }}
      >
        <div className="data-section-header">
          <div className="data-section-title">Pending Assignments</div>
        </div>

        {loading ? (
          <div className="staff-loading-container">
            <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>
              sync
            </span>
            <span>Loading allocation requests...</span>
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="staff-empty-state">
            <span className="material-symbols-outlined">assignment_turned_in</span>
            <p>No pending allocation assignments for {department}.</p>
          </div>
        ) : (
          <div className="table-responsive" style={{ overflow: 'visible' }}>
            <table className="table" style={{ overflow: 'visible' }}>
              <thead>
                <tr>
                  <th>Req ID</th>
                  <th>Asset Type</th>
                  <th>Qty</th>
                  <th>Select Resources</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody id="allocation-tbody">
                {pendingRequests.map((req) => {
                  const matching = availableResources[req.id] || [];
                  const selected = selectedResources[req.id] || [];
                  const isComplete = selected.length === req.quantity;
                  const isOpen = openDropdownId === req.id;
                  const isProcessing = allocatingId === req.id;

                  return (
                    <tr key={req.id}>
                      <td className="td-id">{req.id}</td>
                      <td>{req.resourceType}</td>
                      <td>{String(req.quantity).padStart(2, '0')}</td>
                      <td style={{ overflow: 'visible' }}>
                        <div
                          className="multi-select-container"
                          style={{ position: 'relative', zIndex: isOpen ? 1000 : 1 }}
                        >
                          <div
                            className={`multi-select-header ${isOpen ? 'active' : ''}`}
                            id={`multi-header-${req.id}`}
                            onClick={() => handleToggleDropdown(req.id)}
                          >
                            <span
                              className="multi-select-title"
                              id={`multi-title-${req.id}`}
                              style={{
                                color: isComplete ? '#16a34a' : 'inherit',
                                fontWeight: isComplete ? 700 : 500
                              }}
                            >
                              {isComplete
                                ? `${selected.length}/${req.quantity} Selected ✅`
                                : `Select Resources (${selected.length}/${req.quantity})`}
                            </span>
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: '1.2rem', color: '#94a3b8' }}
                            >
                              {isOpen ? 'expand_less' : 'expand_more'}
                            </span>
                          </div>

                          {isOpen && (
                            <div
                              className="multi-select-dropdown"
                              id={`multi-drop-${req.id}`}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                zIndex: 99999,
                                background: '#ffffff',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                marginTop: '4px',
                                maxHeight: '180px',
                                overflowY: 'auto',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                              }}
                            >
                              {matching.length === 0 ? (
                                <div
                                  style={{
                                    padding: '0.6rem',
                                    textAlign: 'center',
                                    color: '#94a3b8',
                                    fontSize: '0.8rem'
                                  }}
                                >
                                  No matching resources available in your department inventory
                                </div>
                              ) : (
                                matching.map((res) => {
                                  const isChecked = selected.includes(res.id);
                                  return (
                                    <label key={res.id}>
                                      <input
                                        type="checkbox"
                                        value={res.id}
                                        className={`alloc-cb-${req.id}`}
                                        checked={isChecked}
                                        onChange={() => handleCheckboxChange(req.id, res.id)}
                                      />
                                      <span>
                                        {res.id} - {res.name || res.type}
                                      </span>
                                      <span className="multi-status-text">{res.condition || 'Good'}</span>
                                    </label>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => handleAllocate(req)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? 'Allocating...' : 'Allocate'}
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
    </div>
  );
}
