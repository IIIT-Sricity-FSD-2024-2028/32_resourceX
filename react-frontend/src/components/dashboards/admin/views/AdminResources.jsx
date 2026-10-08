import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  fetchAdminResources,
  fetchAdminRequests,
  approveAdminRequest,
  rejectAdminRequest
} from '../../../../services/admin';

export default function AdminResources() {
  const context = useOutletContext() || {};
  const { addToast = () => {} } = context;

  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'inventory'
  const [resources, setResources] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [resList, reqList] = await Promise.all([
        fetchAdminResources(),
        fetchAdminRequests()
      ]);
      setResources(resList || []);
      setRequests(reqList || []);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Failed to load assets & requisitions.');
      addToast(err.message || 'Error loading resources', 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id) => {
    try {
      const updated = await approveAdminRequest(id);
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
      addToast(`Requisition ${id} approved! ✅`, 'success');
    } catch (err) {
      addToast(`Approval failed: ${err.message} ❌`, 'error');
    }
  };

  const handleReject = async (id) => {
    try {
      const updated = await rejectAdminRequest(id);
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
      addToast(`Requisition ${id} rejected! ⚠️`, 'success');
    } catch (err) {
      addToast(`Rejection failed: ${err.message} ❌`, 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-color, #0F386E)' }}>
            Resources & Hardware Allocations
          </h1>
          <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.875rem' }}>
            Verify physical warehouse allocations, incoming employee requisitions, and inventory stock.
          </p>
        </div>
        {/* Toggle subtab buttons */}
        <div style={{ display: 'flex', backgroundColor: '#e2e8f0', padding: '3px', borderRadius: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              backgroundColor: activeTab === 'requests' ? 'white' : 'transparent',
              color: activeTab === 'requests' ? 'var(--primary-color, #0F386E)' : '#64748b',
              boxShadow: activeTab === 'requests' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Requisitions ({requests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              backgroundColor: activeTab === 'inventory' ? 'white' : 'transparent',
              color: activeTab === 'inventory' ? 'var(--primary-color, #0F386E)' : '#64748b',
              boxShadow: activeTab === 'inventory' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Physical Inventory ({resources.length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
          Loading resource database...
        </div>
      ) : error ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#ef4444' }}>
          {error}
        </div>
      ) : activeTab === 'requests' ? (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>Employee Requisition Requests</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: '#64748b' }}>
                  <th style={{ padding: '0.85rem 1.5rem' }}>ID & Item</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Requestor</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Department</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1.5rem', textAlign: 'right' }}>Admin Decision</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                      No requisitions registered.
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1.5rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.resourceType} (x{r.quantity || 1})</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.id} • {r.date || 'Recent'}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>{r.requestor}</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>{r.department}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor:
                              r.status === 'Approved' || r.status === 'Allocated'
                                ? '#dcfce7'
                                : r.status === 'Pending'
                                ? '#fef9c3'
                                : '#fee2e2',
                            color:
                              r.status === 'Approved' || r.status === 'Allocated'
                                ? '#166534'
                                : r.status === 'Pending'
                                ? '#854d0e'
                                : '#991b1b'
                          }}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1.5rem', textAlign: 'right' }}>
                        {r.status === 'Pending' ? (
                          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                            <button
                              type="button"
                              onClick={() => handleApprove(r.id)}
                              style={{
                                padding: '0.3rem 0.7rem',
                                fontSize: '0.75rem',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: '#dcfce7',
                                color: '#166534',
                                cursor: 'pointer',
                                fontWeight: 600
                              }}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(r.id)}
                              style={{
                                padding: '0.3rem 0.7rem',
                                fontSize: '0.75rem',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: '#fee2e2',
                                color: '#b91c1c',
                                cursor: 'pointer',
                                fontWeight: 600
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Processed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>Cataloged Physical Inventory</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: '#64748b' }}>
                  <th style={{ padding: '0.85rem 1.5rem' }}>Asset Identifier</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Category / Name</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Assigned Division</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Availability</th>
                </tr>
              </thead>
              <tbody>
                {resources.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                      No physical inventory items indexed yet.
                    </td>
                  </tr>
                ) : (
                  resources.map((res) => (
                    <tr key={res.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1.5rem', fontWeight: 600, color: '#0F386E' }}>{res.id}</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#0f172a' }}>{res.type || res.name}</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{res.department}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: res.status === 'Available' ? '#dcfce7' : '#e0f2fe', color: res.status === 'Available' ? '#166534' : '#0369a1' }}>
                          {res.status || 'Available'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
