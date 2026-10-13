import React, { useState, useEffect } from 'react';
import { fetchRegistrarRequests } from '../../../../services/registrar';

/**
 * GlobalRequestsView
 * Unified platform view for the Registrar to inspect resource requisitions
 * and fulfillment lifecycles across all university departments.
 */
export default function GlobalRequestsView({ addToast }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch requests from backend
  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build params for API request
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (departmentFilter !== 'All') params.department = departmentFilter;

      const data = await fetchRegistrarRequests(params);
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching global requests:', err);
      setError('Unable to load requests from server.');
      if (addToast) addToast('Error loading requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Reload when filter dropdowns change
  useEffect(() => {
    loadRequests();
  }, [statusFilter, departmentFilter]);

  // Client-side search filtering
  const displayedRequests = requests.filter((req) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchId = (req.id || '').toLowerCase().includes(query);
    const matchType = (req.resourceType || '').toLowerCase().includes(query);
    const matchUser = (req.requestor || req.requestedBy || '').toLowerCase().includes(query);
    const matchDept = (req.department || '').toLowerCase().includes(query);
    return matchId || matchType || matchUser || matchDept;
  });

  // Calculate summary counts
  const totalCount = requests.length;
  const pendingCount = requests.filter((r) => r.status === 'Pending').length;
  const approvedCount = requests.filter((r) => r.status === 'Approved').length;
  const allocatedCount = requests.filter((r) => r.status === 'Allocated').length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
      case 'Allocated':
        return <span className="badge badge-allocated">{status}</span>;
      case 'Pending':
        return <span className="badge badge-pending">{status}</span>;
      case 'Rejected':
        return <span className="badge badge-rejected">{status}</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-color, #0F386E)', marginBottom: '0.25rem' }}>
            Global Requests Overview
          </h1>
          <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.9rem' }}>
            Monitor and audit resource allocations across all departments and faculty members.
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={loadRequests}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>refresh</span>
          Refresh
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
        <div style={{ background: '#ffffff', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Visible</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0F386E', marginTop: '0.25rem' }}>{totalCount}</div>
        </div>

        <div style={{ background: '#ffffff', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ color: '#d97706', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Pending</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#d97706', marginTop: '0.25rem' }}>{pendingCount}</div>
        </div>

        <div style={{ background: '#ffffff', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ color: '#16a34a', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Approved</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#16a34a', marginTop: '0.25rem' }}>{approvedCount}</div>
        </div>

        <div style={{ background: '#ffffff', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ color: '#0284c7', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Allocated</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0284c7', marginTop: '0.25rem' }}>{allocatedCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: '#ffffff',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color, #e2e8f0)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        <div style={{ flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search by Request ID, staff name, or item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        </div>

        <div style={{ width: '180px' }}>
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          >
            <option value="All">Filter Status: All</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Allocated">Allocated</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div style={{ width: '200px' }}>
          <select
            className="form-control"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          >
            <option value="All">Filter Dept: All</option>
            <option value="IT Services">IT Services</option>
            <option value="HR Dept">HR Dept</option>
            <option value="Operations">Operations</option>
            <option value="Facilities">Facilities</option>
            <option value="Administration">Administration</option>
            <option value="Engineering">Engineering</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: 'var(--shadow-sm)', padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1.25rem' }}>
          System Requisitions ({displayedRequests.length})
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}>
              sync
            </span>
            <p style={{ marginTop: '0.5rem' }}>Loading global requests...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
            <p>{error}</p>
            <button type="button" className="btn-secondary" onClick={loadRequests} style={{ marginTop: '0.5rem' }}>
              Retry
            </button>
          </div>
        ) : displayedRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: '#cbd5e1' }}>
              inbox
            </span>
            <p style={{ marginTop: '0.5rem', fontWeight: 500 }}>No requests match the selected filters.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Req ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Requestor</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Department</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Resource Type</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Qty</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {displayedRequests.map((req) => (
                  <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0F386E' }}>
                      {req.id}
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontWeight: 500, color: '#0f172a' }}>
                      {req.requestor || req.requestedBy || 'Staff Member'}
                    </td>

                    <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                      {req.department}
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontWeight: 500 }}>
                      {req.resourceType}
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      {req.quantity}
                    </td>

                    <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                      {req.date || '—'}
                    </td>

                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      {getStatusBadge(req.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
