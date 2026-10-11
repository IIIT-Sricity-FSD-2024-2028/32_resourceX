import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { fetchStaffProcurements, registerStaffProcurement } from '../../../../services/staff';

export default function RegistrationView({ addToast, onRegistrationComplete, onPreviewInvoice }) {
  const { user } = useAuth();
  const department = user?.department || 'IT Services';

  const [procurements, setProcurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({}); // procId -> array of rows
  const [submittingId, setSubmittingId] = useState(null);

  const loadProcurements = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchStaffProcurements({ department });
      const list = Array.isArray(res) ? res : [];
      // Fulfilled purchases are ready for serial registration
      const fulfilled = list.filter((p) => p.status === 'Fulfilled');
      setProcurements(fulfilled);

      // Pre-initialize row data for each procurement
      const initData = {};
      fulfilled.forEach((p) => {
        const qty = parseInt(p.quantity, 10) || 1;
        const rows = [];
        for (let i = 0; i < qty; i++) {
          const code = `RES-${p.id.replace(/[^a-zA-Z0-9]/g, '')}-${String(i + 1).padStart(2, '0')}`;
          rows.push({
            id: code,
            code: code,
            name: '',
            type: p.resourceType || p.item,
            serialNumber: '',
            location: 'Main Warehouse',
            condition: 'New',
            status: 'Available',
            vendor: p.vendor || '',
            invoice: p.invoice || ''
          });
        }
        initData[p.id] = rows;
      });
      setFormData(initData);
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to load registrations.', 'error');
    } finally {
      setLoading(false);
    }
  }, [department, addToast]);

  useEffect(() => {
    loadProcurements();
  }, [loadProcurements]);

  const handleRowChange = (procId, index, field, value) => {
    setFormData((prev) => {
      const rows = [...(prev[procId] || [])];
      rows[index] = { ...rows[index], [field]: value };
      return { ...prev, [procId]: rows };
    });
  };

  const handleSubmit = async (procId) => {
    const rows = formData[procId] || [];
    if (rows.length === 0) return;

    // Validate fields
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.name?.trim()) {
        if (addToast) addToast(`Please enter Model for item #${i + 1}.`, 'error');
        return;
      }
      if (!r.serialNumber?.trim()) {
        if (addToast) addToast(`Please enter Serial Number for item #${i + 1}.`, 'error');
        return;
      }
      if (!r.location?.trim()) {
        if (addToast) addToast(`Please enter Location for item #${i + 1}.`, 'error');
        return;
      }
    }

    try {
      setSubmittingId(procId);
      const resourcesPayload = rows.map((r) => ({
        ...r,
        department,
        assignedTo: 'None',
        date: new Date().toLocaleDateString('en-US')
      }));

      await registerStaffProcurement(procId, resourcesPayload);
      if (addToast) {
        addToast(`Successfully registered ${rows.length} assets to ${department} inventory!`, 'success');
      }

      await loadProcurements();
      if (onRegistrationComplete) onRegistrationComplete();
    } catch (err) {
      if (addToast) addToast(err.message || 'Registration failed.', 'error');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="view-section active">
      <h1 className="page-title">Bulk Resource Registration</h1>
      <p className="page-subtitle">Process delivered purchases by logging serial records per invoice.</p>

      {loading ? (
        <div className="staff-loading-container">
          <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>
            sync
          </span>
          <span>Loading delivered purchases...</span>
        </div>
      ) : procurements.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px dashed #cbd5e1',
            color: '#64748b'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '3.5rem', opacity: 0.5, marginBottom: '1rem', display: 'block' }}>
            inventory
          </span>
          <p style={{ fontSize: '1.15rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
            No Pending Registrations
          </p>
          <p style={{ fontSize: '0.875rem' }}>
            Purchases logged from Procurement Tasks will appear here for serial registration.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {procurements.map((p) => {
            const rows = formData[p.id] || [];
            const isSubmitting = submittingId === p.id;
            const qty = parseInt(p.quantity, 10) || 1;

            return (
              <div
                key={p.id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
                  padding: '1.5rem'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1.5rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid #e2e8f0',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>
                      Register Purchase: {p.resourceType || p.item}
                    </h3>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      Procurement ID: <strong>{p.id}</strong> | Quantity Expected: <strong>{qty}</strong>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                    <div>Vendor: <strong>{p.vendor || 'N/A'}</strong></div>
                    <div>Invoice: <strong>{p.invoice || 'N/A'}</strong></div>
                    {p.invoiceFileName && (
                      <div style={{ marginTop: '0.25rem' }}>
                        <button
                          type="button"
                          onClick={() => onPreviewInvoice && onPreviewInvoice(p)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#2563eb',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            padding: 0
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>visibility</span>
                          {p.invoiceFileName}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="table-responsive" style={{ marginBottom: '1.5rem' }}>
                  <table className="table" style={{ background: '#f8fafc', borderRadius: '8px' }}>
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Model</th>
                        <th>S/N <span style={{ color: '#ef4444' }}>*</span></th>
                        <th>Location</th>
                        <th>Condition</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, idx) => (
                        <tr key={row.id}>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={row.code}
                              readOnly
                              style={{ backgroundColor: '#f1f5f9', fontSize: '0.8rem' }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Model (e.g. Latitude 5540)"
                              value={row.name}
                              onChange={(e) => handleRowChange(p.id, idx, 'name', e.target.value)}
                              style={{ fontSize: '0.8rem' }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Serial Number"
                              value={row.serialNumber}
                              onChange={(e) => handleRowChange(p.id, idx, 'serialNumber', e.target.value)}
                              style={{ fontSize: '0.8rem' }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Location"
                              value={row.location}
                              onChange={(e) => handleRowChange(p.id, idx, 'location', e.target.value)}
                              style={{ fontSize: '0.8rem' }}
                            />
                          </td>
                          <td>
                            <select
                              className="form-control"
                              value={row.condition}
                              onChange={(e) => handleRowChange(p.id, idx, 'condition', e.target.value)}
                              style={{ fontSize: '0.8rem' }}
                            >
                              <option value="New">New</option>
                              <option value="Good">Good</option>
                              <option value="Average">Average</option>
                              <option value="Bad">Bad</option>
                            </select>
                          </td>
                          <td>
                            <select
                              className="form-control"
                              value={row.status}
                              onChange={(e) => handleRowChange(p.id, idx, 'status', e.target.value)}
                              style={{ fontSize: '0.8rem' }}
                            >
                              <option value="Available">Available</option>
                              <option value="Maintenance">Maintenance</option>
                              <option value="Scrapped">Scrapped</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleSubmit(p.id)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Registering...' : 'Submit & Register Assets'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
