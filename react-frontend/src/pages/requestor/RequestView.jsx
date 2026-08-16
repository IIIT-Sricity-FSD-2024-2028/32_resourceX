import React, { useState, useEffect } from 'react';
import Store from '../../api/store.js';

export default function RequestView({ state, onSwitchView, onRefresh }) {
  const { departments, resourceCatalog, stock, resources } = state;
  const [dept, setDept] = useState('');
  const [type, setType] = useState('');
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');
  const [availableCount, setAvailableCount] = useState(null);
  const [typeOptions, setTypeOptions] = useState([]);

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
    setAvailableCount(null);
    setTypeOptions(getDeptResources(d));
  };

  const handleTypeChange = async (e) => {
    const t = e.target.value;
    setType(t);
    if (dept && t) {
      const avail = await Store.fetchResourceAvailability(dept, t);
      setAvailableCount(Number(avail?.availableCount || 0));
    } else {
      setAvailableCount(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = Store.getCurrentUser();
    if (!dept || !type || !qty || parseInt(qty) < 1 || !reason.trim()) {
      Store.showToast('Please fill in all fields correctly before submitting.', 'error');
      return;
    }
    const newId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    await Store.createRequest({ id: newId, department: dept, resourceType: type, quantity: parseInt(qty), requestor: user.name, requestorId: user.id, status: 'Pending', priority: 'Normal', date: dateStr, justification: reason });
    await onRefresh();
    Store.showToast(`Request Submitted Successfully! ID: ${newId}`, 'success');
    setDept(''); setType(''); setQty(''); setReason(''); setAvailableCount(null); setTypeOptions([]);
    onSwitchView('my-requests-view');
  };

  return (
    <div className="view-section">
      <h1 className="page-title">Request Resource</h1>
      <p className="page-subtitle">Submit a new request for organizational resources.</p>
      <div className="form-card">
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Managing Department</label>
            <select className="form-control" value={dept} onChange={handleDeptChange} required>
              <option value="" disabled>Select Department</option>
              {departments.map(d => <option key={d.id || d.name} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Resource Type</label>
            <select className="form-control" value={type} onChange={handleTypeChange} required>
              <option value="" disabled>Select Resource Type</option>
              {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {availableCount !== null && (
              <small style={{ display: 'block', color: availableCount > 0 ? '#16a34a' : '#dc2626', marginTop: '0.5rem', fontWeight: 500 }}>
                Available in Inventory: {availableCount}
              </small>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Quantity</label>
            <input type="number" className="form-control" min="1" value={qty} onChange={e => setQty(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Reason</label>
            <textarea className="form-control" rows="3" value={reason} onChange={e => setReason(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary">Submit Request</button>
        </form>
      </div>
    </div>
  );
}
