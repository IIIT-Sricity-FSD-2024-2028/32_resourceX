import React, { useState } from 'react';
import Store from '../../api/store.js';

export default function ProcurementView({ state, onRefresh }) {
  const { departments, resourceCatalog, stock, resources, procurements } = state;
  const [dept, setDept] = useState('');
  const [type, setType] = useState('');
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');
  const [typeOptions, setTypeOptions] = useState([]);

  const user = Store.getCurrentUser();

  const getDeptResources = (d) => {
    const entry = (resourceCatalog || []).find(item => item.department === d);
    if (entry && Array.isArray(entry.resourceTypes) && entry.resourceTypes.length) return [...entry.resourceTypes];
    const stockRows = (stock || []).filter(item => item.department === d);
    if (stockRows.length) return [...new Set(stockRows.map(item => item.resourceType))];
    const resTypes = (resources || []).filter(r => r.department === d).map(r => r.type);
    return [...new Set(resTypes)];
  };

  const handleDeptChange = (e) => {
    const d = e.target.value;
    setDept(d);
    setType('');
    setTypeOptions(getDeptResources(d));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dept || !type.trim() || !qty || parseInt(qty) < 1 || !reason.trim()) {
      Store.showToast('Please fill in all fields correctly before submitting.', 'error');
      return;
    }
    const newId = `PRC-${Math.floor(1000 + Math.random() * 9000)}`;
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    await Store.createProcurement({ id: newId, item: type, resourceType: type, department: dept, requester: user.name, requestedById: user.id, quantity: parseInt(qty), status: 'Pending Approval', priority: 'Normal', date: dateStr, justification: reason });
    await onRefresh();
    Store.showToast(`Procurement Request Submitted! ID: ${newId}`, 'success');
    setDept(''); setType(''); setQty(''); setReason(''); setTypeOptions([]);
  };

  const myProcs = (procurements || []).filter(p => p.requester === user?.name || p.requestedById === user?.id);

  const getProcBadge = (status) => {
    if (status === 'Approved' || status === 'Completed') return <span className="badge" style={{ background: '#dcfce7', color: '#166534' }}>{status}</span>;
    if (status === 'Pending Approval') return <span className="badge pending">{status}</span>;
    if (status === 'Rejected') return <span className="badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>{status}</span>;
    return <span className="badge" style={{ background: '#cbd5e1', color: '#0f172a' }}>{status}</span>;
  };

  return (
    <div className="view-section" style={{ padding: '2rem' }}>
      <h1 className="page-title">Procurement Request</h1>
      <p className="page-subtitle">Submit a request to procure new resources not currently available in the inventory.</p>

      <div className="form-card">
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Requesting Department</label>
            <select className="form-control" value={dept} onChange={handleDeptChange} required>
              <option value="" disabled>Select Department</option>
              {departments.map(d => <option key={d.id || d.name} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Resource Type / Name</label>
            <select className="form-control" value={type} onChange={e => setType(e.target.value)} required>
              <option value="" disabled>Select Resource Type</option>
              {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Quantity</label>
            <input type="number" className="form-control" min="1" value={qty} onChange={e => setQty(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Reason</label>
            <textarea className="form-control" rows="4" placeholder="Explain why this procurement is needed based on business requirements..." value={reason} onChange={e => setReason(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary">Submit Procurement Request</button>
        </form>
      </div>

      <div className="data-section" style={{ marginTop: '2rem' }}>
        <div className="data-section-header">
          <div className="data-section-title">My Procurement History</div>
          <button className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={onRefresh}>Refresh</button>
        </div>
        <table className="table">
          <thead>
            <tr><th>Request ID</th><th>Item Name</th><th>Qty</th><th>Date Submitted</th><th>Status</th></tr>
          </thead>
          <tbody>
            {myProcs.map(proc => (
              <tr key={proc.id}>
                <td className="td-id">{proc.id}</td>
                <td>{proc.item}</td>
                <td>{String(proc.quantity).padStart(2, '0')}</td>
                <td>{proc.date}</td>
                <td>{getProcBadge(proc.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
