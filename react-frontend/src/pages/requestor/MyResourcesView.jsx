import React, { useState } from 'react';
import Store from '../../api/store.js';

export default function MyResourcesView({ state, onRefresh }) {
  const { resources } = state;
  const [search, setSearch] = useState('');

  const filtered = resources.filter(r =>
    r.id?.toLowerCase().includes(search.toLowerCase()) ||
    r.type?.toLowerCase().includes(search.toLowerCase())
  );

  const requestMaintenance = async (resId) => {
    if (window.confirm('Submit maintenance request for this resource?')) {
      await Store.requestMaintenance(resId);
      await onRefresh();
    }
  };

  const returnResource = async (resId) => {
    if (window.confirm('Are you sure you want to return this resource? It will be sent to Staff for Verification.')) {
      await Store.initiateReturn(resId);
      await onRefresh();
      alert('Resource returned successfully. Status moved to Returned.');
    }
  };

  const confirmRepairedAllocation = async (resId) => {
    await Store.confirmRepairedAllocation(resId);
    await onRefresh();
  };

  const getStatusBadge = (status) => {
    if (status === 'Allocated') return <span className="badge allocated">{status}</span>;
    if (status === 'Maintenance Requested' || status === 'Maintenance') return <span className="badge maintenance">{status}</span>;
    if (status === 'Repaired') return <span className="badge allocated" style={{ background: '#dcfce7', color: '#166534' }}>Repaired</span>;
    return <span className="badge">{status}</span>;
  };

  const getActions = (res) => {
    if (res.status === 'Allocated') {
      return (
        <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" style={{ fontSize: '0.82rem', padding: '0.3rem 0.8rem', whiteSpace: 'nowrap' }} onClick={() => requestMaintenance(res.id)}>🛠 Maintenance</button>
          <button className="btn-danger" style={{ fontSize: '0.82rem', padding: '0.3rem 0.8rem', whiteSpace: 'nowrap' }} onClick={() => returnResource(res.id)}>⮌ Return</button>
        </div>
      );
    }
    if (res.status === 'Maintenance Requested' || res.status === 'Maintenance') {
      return <span className="text-muted" style={{ fontSize: '0.75rem' }}>Under Review</span>;
    }
    if (res.status === 'Repaired') {
      return <button className="btn-primary" style={{ fontSize: '0.75rem' }} onClick={() => confirmRepairedAllocation(res.id)}>Confirm Allocation</button>;
    }
    return null;
  };

  return (
    <div className="view-section">
      <h1 className="page-title">My Resources</h1>
      <p className="page-subtitle">Currently allocated resources to you.</p>
      <div className="data-section">
        <div className="data-section-header">
          <div className="data-section-title">Allocated Assets</div>
          <div className="search-bar" style={{ width: '250px' }}>
            <span className="material-symbols-outlined" style={{ color: '#94a3b8' }}>search</span>
            <input type="text" placeholder="Search resources..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Resource Code</th><th>Resource Type</th><th>Department</th>
                <th>Allocated Date</th><th>Status</th><th style={{ textAlign: 'right', minWidth: '210px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(res => (
                <tr key={res.id}>
                  <td className="td-id">{res.id}</td>
                  <td>{res.type}</td>
                  <td>{res.department}</td>
                  <td>{res.date}</td>
                  <td>{getStatusBadge(res.status)}</td>
                  <td style={{ textAlign: 'right' }}>{getActions(res)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
