import React, { useState } from 'react';
import Store from '../../api/store.js';

function StatusBadge({ status }) {
  if (status === 'Allocated') return <span className="badge allocated">{status}</span>;
  if (status === 'Approved') return <span className="badge approved">{status}</span>;
  if (status === 'Pending') return <span className="badge pending">{status}</span>;
  if (status === 'Rejected') return <span className="badge rejected">{status}</span>;
  return <span className="badge">{status}</span>;
}

export default function MyRequestsView({ state, onRefresh, onSwitchView }) {
  const { requests, summary } = state;
  const [filter, setFilter] = useState('All');

  const pending = summary?.pendingRequests ?? requests.filter(r => r.status === 'Pending').length;
  const approved = summary?.approvedRequests ?? requests.filter(r => r.status === 'Approved').length;
  const allocated = summary?.allocatedRequests ?? requests.filter(r => r.status === 'Allocated').length;
  const total = summary?.totalRequests ?? requests.length;
  const completionRate = total > 0 ? Math.round(((approved + allocated) / total) * 100) : 0;

  const filtered = filter === 'All' ? requests : requests.filter(r => r.status === filter);

  const confirmReceipt = async (reqId) => {
    await Store.confirmReceipt(reqId);
    await onRefresh();
    alert('Item successfully received and confirmed.');
    onSwitchView('my-resources-view');
  };

  return (
    <div className="view-section">
      <h1 className="page-title">My Requests</h1>
      <p className="page-subtitle">Track and manage your resource allocation requests. Review statuses, confirm receipts, and audit your history across departments.</p>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Total Pending</div>
          <div className="stat-value-row">
            <div className="stat-value">{String(pending).padStart(2, '0')}</div>
            <span className="badge pending">Action Needed</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Approved</div>
          <div className="stat-value-row">
            <div className="stat-value">{String(approved).padStart(2, '0')}</div>
            <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>Processing</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Ready for Pickup</div>
          <div className="stat-value-row" style={{ borderLeft: '4px solid #16a34a', paddingLeft: '1rem' }}>
            <div className="stat-value" style={{ color: '#16a34a' }}>{String(allocated).padStart(2, '0')}</div>
            <span className="badge allocated">Allocated</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Completion Rate</div>
          <div className="stat-value-row">
            <div className="stat-value" style={{ color: '#0f172a' }}>{completionRate}%</div>
          </div>
        </div>
      </div>

      <div className="data-section">
        <div className="data-section-header">
          <div className="data-section-title">Active Requests</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: '#64748b' }}>filter_list</span>
              <select className="form-control" style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem', borderRadius: '6px', minWidth: '140px' }}
                value={filter} onChange={e => setFilter(e.target.value)}>
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Allocated">Allocated</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }} onClick={() => setFilter('All')}>Reset</button>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Request ID</th><th>Department</th><th>Resource Type</th>
                <th>Quantity</th><th>Date</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(req => (
                <tr key={req.id}>
                  <td className="td-id">{req.id}</td>
                  <td>{req.department}</td>
                  <td>{req.resourceType}</td>
                  <td>{String(req.quantity).padStart(2, '0')}</td>
                  <td>{req.date}</td>
                  <td><StatusBadge status={req.status} /></td>
                  <td style={{ textAlign: 'right' }}>
                    {req.status === 'Allocated'
                      ? <button className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }} onClick={() => confirmReceipt(req.id)}>I RECEIVED</button>
                      : req.status === 'Rejected'
                      ? <span title="View Reason">ℹ️</span>
                      : <button className="icon-btn">⋮</button>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
