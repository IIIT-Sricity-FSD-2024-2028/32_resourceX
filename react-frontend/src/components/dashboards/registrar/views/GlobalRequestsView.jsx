import React, { useState, useEffect } from 'react';
import { fetchRequests, fetchDepartments } from '../../../../services/registrar';

/**
 * 2. Global Requests View (replicates sys-overview-view from registrar.html & registrar.js)
 */
export default function GlobalRequestsView() {
  const [requests, setRequests] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDept, setFilterDept] = useState('All');
  const [loading, setLoading] = useState(true);

  // 1. Fetch departments dynamically from backend on component mount
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const data = await fetchDepartments();
        if (Array.isArray(data)) {
          setDepartments(data);
        }
      } catch (err) {
        console.error('Error fetching departments from backend:', err);
      }
    };

    loadDepartments();
  }, []);

  // 2. Fetch requests based on active dropdown filters
  const renderGlobalRequests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== 'All') params.status = filterStatus;
      if (filterDept !== 'All') params.department = filterDept;

      const data = await fetchRequests(params);
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching global requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    renderGlobalRequests();
  }, [filterStatus, filterDept]);

  return (
    <div id="sys-overview-view" className="view-section active">
      <h1 className="page-title">Global Requests Filter</h1>
      <p className="page-subtitle">Unified view of all departmental requests and current statuses.</p>

      {/* Filter Row matching exact registrar.html */}
      <div
        style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border-color)',
          marginBottom: '2rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        <select
          id="filterStatus"
          className="form-control"
          style={{ width: '200px' }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="All">Filter Status: All</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Allocated">Allocated</option>
          <option value="Rejected">Rejected</option>
        </select>

        {/* Dynamic department dropdown fetched from backend */}
        <select
          id="filterDept"
          className="form-control"
          style={{ width: '200px' }}
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
        >
          <option value="All">Filter Dept: All</option>
          {departments.map((dept) => (
            <option key={dept.id || dept.name} value={dept.name}>
              {dept.name}
            </option>
          ))}
        </select>
      </div>

      {/* Requests Table matching exact registrar.html */}
      <div className="data-section">
        <table className="table">
          <thead>
            <tr>
              <th>Req ID</th>
              <th>Dept</th>
              <th>Resource Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                  {loading ? 'Loading requests...' : 'No requests found.'}
                </td>
              </tr>
            ) : (
              requests.map((r) => {
                const badgeClass =
                  r.status === 'Approved' || r.status === 'Allocated'
                    ? 'allocated'
                    : r.status === 'Pending'
                    ? 'pending'
                    : 'rejected';

                return (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.department}</td>
                    <td>{r.resourceType}</td>
                    <td>
                      <span className={`badge ${badgeClass}`}>{r.status}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
