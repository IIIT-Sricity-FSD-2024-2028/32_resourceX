import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { fetchProcurements, logPurchase } from '../../../../services/procurementOfficer';

export default function ProcurementOrdersView({ addToast }) {
  const { user } = useAuth();
  const department = user?.department || 'IT Services';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formInputs, setFormInputs] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('Approved');

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchProcurements({ department });
      setOrders(Array.isArray(res) ? res : []);
    } catch (err) {
      addToast(err.message || 'Failed to load orders.', 'error');
    } finally {
      setLoading(false);
    }
  }, [department, addToast]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const handleInputChange = (procId, field, value) => {
    setFormInputs(prev => ({ ...prev, [procId]: { ...(prev[procId] || {}), [field]: value } }));
  };

  const handleFileChange = (procId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg'];
    if (!allowed.includes(file.type)) { addToast('Unsupported file type. Use PDF, DOC, DOCX, PNG or JPG.', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { addToast('File too large. Max 5 MB.', 'error'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      handleInputChange(procId, 'file', file);
      handleInputChange(procId, 'fileName', file.name);
      handleInputChange(procId, 'fileDataUrl', ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleLogPurchase = async (procId) => {
    const inputs = formInputs[procId] || {};
    if (!inputs.vendor?.trim()) { addToast('Enter vendor name.', 'error'); return; }
    if (!inputs.invoice?.trim()) { addToast('Enter invoice number.', 'error'); return; }
    try {
      setSubmittingId(procId);
      await logPurchase(procId, {
        vendor: inputs.vendor,
        invoice: inputs.invoice,
        invoiceFile: inputs.fileDataUrl,
        invoiceFileName: inputs.fileName,
        invoiceFileType: inputs.file?.type
      });
      addToast('✅ Purchase logged successfully!', 'success');
      setFormInputs(prev => { const n = { ...prev }; delete n[procId]; return n; });
      await loadOrders();
    } catch (err) {
      addToast(err.message || 'Failed to log purchase.', 'error');
    } finally {
      setSubmittingId(null);
    }
  };

  const STATUS_COLORS = {
    Approved: { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    Fulfilled: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
    Registered: { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
    Pending: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    Rejected: { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5' },
  };

  const filterOptions = ['All', 'Approved', 'Fulfilled', 'Registered', 'Pending', 'Rejected'];
  const displayed = orders.filter(o => statusFilter === 'All' || o.status === statusFilter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>Procurement Orders</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            {orders.filter(o => o.status === 'Approved').length} orders awaiting purchase logging
          </p>
        </div>
        <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 10, padding: 4, flexWrap: 'wrap' }}>
          {filterOptions.map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              style={{ padding: '6px 14px', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: statusFilter === f ? '#fff' : 'transparent', color: statusFilter === f ? '#1e293b' : '#64748b', boxShadow: statusFilter === f ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
              {f} {f !== 'All' ? `(${orders.filter(o => o.status === f).length})` : `(${orders.length})`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading orders...</div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0' }}>
          <span className="material-icons" style={{ fontSize: 48, color: '#22c55e', display: 'block', marginBottom: 12 }}>shopping_cart</span>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1e293b' }}>No orders to show</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>Adjust your filter or wait for new approvals.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {displayed.map(proc => {
            const sc = STATUS_COLORS[proc.status] || { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' };
            const inputs = formInputs[proc.id] || {};
            const isSubmitting = submittingId === proc.id;
            const showForm = proc.status === 'Approved' && !proc.vendor;
            return (
              <div key={proc.id} style={{ background: '#fff', border: `1px solid ${sc.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                {/* Order Header */}
                <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, borderBottom: `1px solid ${sc.border}`, background: sc.bg }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', background: '#eff6ff', padding: '2px 8px', borderRadius: 6 }}>{proc.id}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{proc.resourceType || proc.item} × {proc.quantity}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20, background: '#fff', color: sc.text, border: `1px solid ${sc.border}` }}>{proc.status}</span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{proc.department} · {proc.date}</span>
                  </div>
                </div>

                {/* Existing vendor info (logged) */}
                {proc.vendor && (
                  <div style={{ padding: '0.75rem 1.25rem', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>Vendor: <strong style={{ color: '#1e293b' }}>{proc.vendor}</strong></span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>Invoice: <strong style={{ color: '#1e293b' }}>{proc.invoice}</strong></span>
                  </div>
                )}

                {/* Log Purchase form */}
                {showForm && (
                  <div style={{ padding: '1.25rem' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: '1rem' }}>Log Purchase Details</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                      {[
                        { label: 'Vendor Name *', field: 'vendor', placeholder: 'e.g. Dell India Pvt Ltd' },
                        { label: 'Invoice Number *', field: 'invoice', placeholder: 'e.g. INV-2024-001' },
                      ].map(({ label, field, placeholder }) => (
                        <div key={field}>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>{label}</label>
                          <input
                            value={inputs[field] || ''}
                            onChange={e => handleInputChange(proc.id, field, e.target.value)}
                            placeholder={placeholder}
                            style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                          />
                        </div>
                      ))}
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>Invoice File (optional)</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                            onChange={e => handleFileChange(proc.id, e)}
                            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 1 }}
                          />
                          <div style={{ padding: '9px 12px', border: '1px dashed #cbd5e1', borderRadius: 8, fontSize: 12, color: inputs.fileName ? '#1e293b' : '#94a3b8', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="material-icons" style={{ fontSize: 16, color: '#64748b' }}>upload_file</span>
                            {inputs.fileName || 'Upload PDF, DOC, PNG, JPG (max 5 MB)'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleLogPurchase(proc.id)} disabled={isSubmitting}
                      style={{ padding: '10px 24px', background: isSubmitting ? '#94a3b8' : '#3b82f6', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="material-icons" style={{ fontSize: 18 }}>receipt</span>
                      {isSubmitting ? 'Logging...' : 'Log Purchase'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
