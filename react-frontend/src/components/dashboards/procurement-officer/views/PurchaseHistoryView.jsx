import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { fetchProcurements } from '../../../../services/procurementOfficer';
import TableToolbar, { matchesSearch, uniqueOptions } from '../../../common/TableToolbar';

const STATUS_COLORS = {
  Approved: { bg: '#eff6ff', text: '#2563eb' },
  'PO Created': { bg: '#fef3c7', text: '#d97706' },
  Fulfilled: { bg: '#ecfdf5', text: '#16a34a' },
  Registered: { bg: '#f5f3ff', text: '#7c3aed' },
};

export default function PurchaseHistoryView({ addToast }) {
  const { user } = useAuth();
  const department = user?.department || 'IT Services';

  const [procurements, setProcurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [previewFile, setPreviewFile] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchProcurements({ department });
      const raw = Array.isArray(res) ? res : [];
      // Exclude pending and rejected
      const list = raw.filter(p => !['Pending Approval', 'Pending', 'Rejected'].includes(p.status));
      setProcurements(list.filter(p => p.vendor || p.poNumber || ['PO Created', 'Fulfilled', 'Registered'].includes(p.status)));
    } catch (err) {
      addToast(err.message || 'Failed to load history.', 'error');
    } finally {
      setLoading(false);
    }
  }, [department, addToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = procurements.filter(p =>
    (statusFilter === 'All' || p.status === statusFilter) &&
    matchesSearch(searchQuery, p.id, p.vendor, p.poNumber, p.invoice, p.resourceType, p.item, p.status, p.date, p.receivedDate)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>Purchase History</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            All purchase orders, supplier invoices, and fulfilled procurements ({filtered.length} entries)
          </p>
        </div>
      </div>

      <TableToolbar
        standalone
        search={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search by order ID, item, PO #, vendor, invoice or date..."
        filters={[
          { label: 'All Statuses', value: statusFilter, onChange: setStatusFilter, options: uniqueOptions(procurements, 'status') },
        ]}
        resultCount={filtered.length}
        totalCount={procurements.length}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading history...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0' }}>
          <span className="material-icons" style={{ fontSize: 48, color: '#94a3b8', display: 'block', marginBottom: 12 }}>receipt_long</span>
          <div style={{ fontSize: 15, color: '#64748b' }}>No purchase records found.</div>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Order ID', 'Item & Qty', 'PO #', 'Vendor', 'Invoice', 'Status', 'Date', 'Documents'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((proc, i) => {
                const sc = STATUS_COLORS[proc.status] || { bg: '#f8fafc', text: '#64748b' };
                return (
                  <tr key={proc.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#2563eb' }}>{proc.id}</td>
                    <td style={{ padding: '12px 14px', color: '#1e293b', fontWeight: 600 }}>
                      {proc.resourceType || proc.item || '—'}
                      <span style={{ fontSize: 12, color: '#64748b', marginLeft: 6 }}>× {proc.quantity}</span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#0284c7', fontWeight: 600 }}>{proc.poNumber || '—'}</td>
                    <td style={{ padding: '12px 14px', color: '#1e293b' }}>{proc.vendor || '—'}</td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>
                      {proc.invoice ? (
                        <div>
                          <strong>{proc.invoice}</strong>
                          {proc.invoiceAmount && <div style={{ fontSize: 11, color: '#16a34a' }}>{proc.invoiceAmount}</div>}
                        </div>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: sc.bg, color: sc.text }}>
                        {proc.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>{proc.date || '—'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {proc.poFileName && (proc.poFileDataUrl || proc.poFile) && (
                          <button
                            onClick={() => setPreviewFile({
                              name: proc.poFileName || `PO_${proc.id}`,
                              type: proc.poFileType,
                              dataUrl: proc.poFileDataUrl || proc.poFile
                            })}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                          >
                            <span className="material-icons" style={{ fontSize: 13 }}>description</span>
                            PO
                          </button>
                        )}
                        {proc.invoiceFile || proc.invoiceFileDataUrl ? (
                          <button
                            onClick={() => setPreviewFile({
                              name: proc.invoiceFileName || `Invoice_${proc.id}`,
                              type: proc.invoiceFileType,
                              dataUrl: proc.invoiceFile || proc.invoiceFileDataUrl
                            })}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: '#ecfdf5', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                          >
                            <span className="material-icons" style={{ fontSize: 13 }}>receipt</span>
                            Invoice
                          </button>
                        ) : null}
                        {!proc.poFileName && !proc.invoiceFile && !proc.invoiceFileDataUrl && (
                          <span style={{ fontSize: 12, color: '#94a3b8' }}>—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {previewFile && (
        <div onClick={() => setPreviewFile(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', width: '90%', maxWidth: 700, maxHeight: '85vh', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{previewFile.name}</h3>
              <button onClick={() => setPreviewFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#64748b' }}>✕</button>
            </div>
            {previewFile.type?.startsWith('image/') ? (
              <img src={previewFile.dataUrl} alt={previewFile.name} style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: 8 }} />
            ) : (
              <iframe src={previewFile.dataUrl} title={previewFile.name} style={{ flex: 1, border: 'none', borderRadius: 8, minHeight: 400 }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
