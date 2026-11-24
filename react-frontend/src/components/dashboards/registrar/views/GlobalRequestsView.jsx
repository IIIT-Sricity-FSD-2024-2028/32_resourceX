import React, { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  fetchRequests,
  fetchDepartments,
  selectRegistrarRequests,
  selectRegistrarDepartments,
  selectRegistrarRequestsLoading,
} from '../../../../store/slices/registrar/registrarSlice';

/**
 * 2. Global Requests View (replicates sys-overview-view from registrar.html & registrar.js)
 */
export default function GlobalRequestsView() {
  const dispatch = useAppDispatch();
  const requests = useAppSelector(selectRegistrarRequests);
  const departments = useAppSelector(selectRegistrarDepartments);
  const {
    requestsError,
    departmentsLoading,
    departmentsError,
  } = useAppSelector((state) => state.registrar);
  const loading = useAppSelector(selectRegistrarRequestsLoading);
  const error = requestsError || departmentsError;
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDept, setFilterDept] = useState('All');
  const [searchId, setSearchId] = useState('');

  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  const renderGlobalRequests = useCallback(() => {
    const params = {};
    if (filterStatus !== 'All') params.status = filterStatus;
    if (filterDept !== 'All') params.department = filterDept;
    dispatch(fetchRequests(params));
  }, [dispatch, filterDept, filterStatus]);

  useEffect(() => {
    renderGlobalRequests();
  }, [renderGlobalRequests]);

  const query = searchId.trim().toLowerCase();
  const visibleRequests = query
    ? requests.filter((r) =>
        [r.id, r.department, r.resourceType, r.status, r.requestor]
          .some((v) => String(v || '').toLowerCase().includes(query))
      )
    : requests;

  return (
    <div id="sys-overview-view" className="view-section active">
      <h1 className="page-title">Global Requests Filter</h1>
      <p className="page-subtitle">Unified view of all departmental requests and current statuses.</p>
      {error && (
        <div role="alert" style={{ marginBottom: '1rem', padding: '1rem', color: '#b91c1c', background: '#fef2f2', borderRadius: 10 }}>
          Failed to load registrar data: {error}
          <button type="button" onClick={() => {
            dispatch(fetchDepartments());
            renderGlobalRequests();
          }} style={{ marginLeft: 12 }}>
            Retry
          </button>
        </div>
      )}

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
        <input
          id="searchReqId"
          type="text"
          className="form-control"
          style={{ flex: '1 1 320px' }}
          placeholder="Search by Req ID, department, resource type or status..."
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
        />

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
          disabled={departmentsLoading}
        >
          <option value="All">{departmentsLoading ? 'Loading departments...' : 'Filter Dept: All'}</option>
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
            {visibleRequests.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                  {loading ? 'Loading requests...' : 'No requests found.'}
                </td>
              </tr>
            ) : (
              visibleRequests.map((r) => {
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
