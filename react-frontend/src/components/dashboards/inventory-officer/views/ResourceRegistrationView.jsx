import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  fetchProcurements,
  registerProcurement
} from '../../../../services/inventoryOfficer';

const CONDITIONS = ['New', 'Good', 'Average', 'Fair'];

export default function ResourceRegistrationView({ addToast }) {
  const { user } = useAuth();
  const department = user?.department || 'IT Services';

  const [procurements, setProcurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  const loadProcurements = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchProcurements({ department });
      const list = Array.isArray(res) ? res : [];
      const fulfilled = list.filter(p => p.status === 'Fulfilled');
      setProcurements(fulfilled);

      const initData = {};
      fulfilled.forEach(p => {
        const qty = parseInt(p.quantity, 10) || 1;
        const rows = [];
        for (let i = 0; i < qty; i++) {
          const code = `RES-${p.id.replace(/[^a-zA-Z0-9]/g, '')}-${String(i + 1).padStart(2, '0')}`;
          rows.push({
            id: code, code, name: '', type: p.resourceType || p.item || '',
            serialNumber: '', location: 'Main Warehouse', condition: 'New',
            status: 'Available', vendor: p.vendor || '', invoice: p.invoice || ''
          });
        }
        initData[p.id] = rows;
      });
      setFormData(initData);
    } catch (err) {
      addToast(err.message || 'Failed to load fulfilled procurements.', 'error');
    } finally {
      setLoading(false);
    }
  }, [department, addToast]);

  useEffect(() => { loadProcurements(); }, [loadProcurements]);

  const handleRowChange = (procId, index, field, value) => {
    setFormData(prev => {
      const rows = [...(prev[procId] || [])];
      rows[index] = { ...rows[index], [field]: value };
      return { ...prev, [procId]: rows };
    });
  };

  const handleRegister = async (procId) => {
    const rows = formData[procId] || [];
    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].name?.trim()) { addToast(`Enter model/name for item #${i + 1}.`, 'error'); return; }
      if (!rows[i].serialNumber?.trim()) { addToast(`Enter serial number for item #${i + 1}.`, 'error'); return; }
    }
    try {
      setSubmittingId(procId);
      await registerProcurement(procId, rows);
      addToast(`✅ ${rows.length} resource(s) registered into inventory!`, 'success');
      await loadProcurements();
    } catch (err) {
      addToast(err.message || 'Registration failed.', 'error');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>Resource Registration</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
          Register delivered assets from fulfilled procurement orders into inventory
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading fulfilled orders...</div>
      ) : procurements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0' }}>
          <span className="material-icons" style={{ fontSize: 48, color: '#3b82f6', display: 'block', marginBottom: 12 }}>inventory_2</span>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1e293b' }}>No fulfilled orders</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>
            Fulfilled procurement orders from the Procurement Officer will appear here for registration.
          </div>
        </div>
      ) : (
        procurements.map(proc => {
          const rows = formData[proc.id] || [];
          const isSubmitting = submittingId === proc.id;
          return (
            <div key={proc.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              {/* Procurement Header */}
              <div style={{ padding: '1rem 1.25rem', background: 'linear-gradient(135deg, #1e293b, #334155)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#93c5fd', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 6 }}>{proc.id}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{proc.resourceType || proc.item} × {proc.quantity}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                    Vendor: {proc.vendor || '—'} · Invoice: {proc.invoice || '—'} · Dept: {proc.department}
                  </div>
                </div>
                {proc.invoiceFile && (
                  <button
                    onClick={() => setPreviewFile({ name: proc.invoiceFileName || `Invoice_${proc.id}`, type: proc.invoiceFileType || 'application/pdf', dataUrl: proc.invoiceFile })}
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <span className="material-icons" style={{ fontSize: 14 }}>receipt</span>
                    View Invoice
                  </button>
                )}
              </div>

              {/* Asset Rows */}
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {rows.map((row, i) => (
                  <div key={i} style={{ padding: '1rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6', marginBottom: 10 }}>Asset #{i + 1} — {row.id}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                      {[
                        { label: 'Model / Name *', field: 'name', placeholder: 'e.g. Dell Latitude 5520' },
                        { label: 'Serial Number *', field: 'serialNumber', placeholder: 'e.g. SN-12345' },
                        { label: 'Location', field: 'location', placeholder: 'e.g. Main Warehouse' },
                      ].map(({ label, field, placeholder }) => (
                        <div key={field}>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>{label}</label>
                          <input
                            value={row[field] || ''}
                            onChange={e => handleRowChange(proc.id, i, field, e.target.value)}
                            placeholder={placeholder}
                            style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                          />
                        </div>
                      ))}
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Condition</label>
                        <select
                          value={row.condition || 'New'}
                          onChange={e => handleRowChange(proc.id, i, 'condition', e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' }}
                        >
                          {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => handleRegister(proc.id)}
                  disabled={isSubmitting}
                  style={{ alignSelf: 'flex-end', padding: '10px 24px', background: isSubmitting ? '#94a3b8' : '#3b82f6', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <span className="material-icons" style={{ fontSize: 18 }}>label</span>
                  {isSubmitting ? 'Registering...' : `Register ${rows.length} Asset${rows.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* Invoice Preview Modal */}
      {previewFile && (
        <div onClick={() => setPreviewFile(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', width: '90%', maxWidth: 700, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{previewFile.name}</h3>
              <button onClick={() => setPreviewFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#64748b' }}>✕</button>
            </div>
            {previewFile.type?.startsWith('image/') ? (
              <img src={previewFile.dataUrl} alt={previewFile.name} style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: 8 }} />
            ) : (
              <iframe src={previewFile.dataUrl} title={previewFile.name} style={{ flex: 1, border: 'none', borderRadius: 8, minHeight: 400 }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
