import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  fetchProcurements,
  createPurchaseOrder,
  logPurchase
} from '../../../../services/procurementOfficer';
import TableToolbar, { matchesSearch } from '../../../common/TableToolbar';

export default function ProcurementOrdersView({ addToast }) {
  const { user } = useAuth();
  const department = user?.department || 'IT Services';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formInputs, setFormInputs] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [previewFile, setPreviewFile] = useState(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchProcurements({ department });
      const raw = Array.isArray(res) ? res : [];
      // Procurement Orders strictly manages active orders: Approved -> PO Created -> Fulfilled -> Registered
      // Indents are managed in the dedicated "Department Indents" view
      const list = raw.filter(p => ['Approved', 'PO Created', 'Fulfilled', 'Registered'].includes(p.status));
      setOrders(list);

      // Pre-fill sensible default form state
      setFormInputs(prev => {
        const next = { ...prev };
        list.forEach(p => {
          if (!next[p.id]) {
            const numPart = p.id.replace(/[^0-9]/g, '') || String(Math.floor(100 + Math.random() * 900));
            next[p.id] = {
              vendor: p.vendor || '',
              invoice: p.invoice || `INV-${numPart}`,
              invoiceAmount: p.invoiceAmount || '',
            };
          }
        });
        return next;
      });
    } catch (err) {
      addToast(err.message || 'Failed to load procurement orders.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const handleInputChange = (procId, field, value) => {
    setFormInputs(prev => ({
      ...prev,
      [procId]: { ...(prev[procId] || {}), [field]: value }
    }));
  };

  const handleFileUpload = (procId, type, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg'];
    if (!allowed.includes(file.type)) {
      addToast('Please upload a PDF, DOC, DOCX, PNG, or JPG file.', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      addToast('File too large. Maximum size is 10 MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormInputs(prev => ({
        ...prev,
        [procId]: {
          ...(prev[procId] || {}),
          [`${type}File`]: file,
          [`${type}FileName`]: file.name,
          [`${type}FileType`]: file.type,
          [`${type}FileDataUrl`]: ev.target.result,
        }
      }));
      addToast(`Selected file: ${file.name}`, 'info');
    };
    reader.readAsDataURL(file);
  };

  // Stage 1: Upload Purchase Order File -> PO Created
  const handleUploadPO = async (proc) => {
    const inputs = formInputs[proc.id] || {};
    if (!inputs.poFileDataUrl && !inputs.poFileName) {
      addToast('Please choose or upload a Purchase Order file.', 'error');
      return;
    }

    try {
      setSubmittingId(proc.id);
      const poNum = inputs.poFileName
        ? inputs.poFileName.replace(/\.[^/.]+$/, '')
        : `PO-${proc.id.replace(/[^0-9]/g, '')}`;

      await createPurchaseOrder(proc.id, {
        poNumber: poNum,
        vendor: inputs.vendor?.trim() || proc.vendor || 'Authorized Supplier',
        poFileName: inputs.poFileName,
        poFileType: inputs.poFileType,
        poFileDataUrl: inputs.poFileDataUrl,
      });

      addToast(`✅ Purchase order file uploaded! Status updated to PO Created.`, 'success');
      await loadOrders();
    } catch (err) {
      addToast(err.message || 'Failed to upload purchase order.', 'error');
    } finally {
      setSubmittingId(null);
    }
  };

  // Stage 2: Upload Invoice & Fulfill
  const handleUploadInvoiceAndFulfill = async (proc) => {
    const inputs = formInputs[proc.id] || {};
    if (!inputs.invoiceFileDataUrl && !inputs.invoice?.trim()) {
      addToast('Please upload the invoice file or enter an invoice number.', 'error');
      return;
    }

    try {
      setSubmittingId(proc.id);
      const invNum = inputs.invoice?.trim() || (inputs.invoiceFileName ? inputs.invoiceFileName.replace(/\.[^/.]+$/, '') : `INV-${proc.id.replace(/[^0-9]/g, '')}`);

      await logPurchase(proc.id, {
        vendor: inputs.vendor || proc.vendor || 'Vendor',
        invoice: invNum,
        invoiceAmount: inputs.invoiceAmount?.trim(),
        invoiceFileName: inputs.invoiceFileName,
        invoiceFileType: inputs.invoiceFileType,
        invoiceFileDataUrl: inputs.invoiceFileDataUrl,
      });

      addToast('📦 Delivery & Invoice recorded! Order is now Fulfilled.', 'success');
      await loadOrders();
    } catch (err) {
      addToast(err.message || 'Failed to save invoice.', 'error');
    } finally {
      setSubmittingId(null);
    }
  };

  const STATUS_CONFIG = {
    'Approved': { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', step: 1, label: 'Approved (Upload PO)' },
    'PO Created': { bg: '#fef3c7', text: '#d97706', border: '#fde68a', step: 2, label: 'PO Uploaded (Upload Invoice)' },
    'Fulfilled': { bg: '#ecfdf5', text: '#16a34a', border: '#86efac', step: 3, label: 'Fulfilled & Invoiced' },
    'Registered': { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe', step: 4, label: 'In Inventory' },
  };

  const PIPELINE_STEPS = [
    { num: 1, label: '1. Approved', icon: 'check_circle' },
    { num: 2, label: '2. PO Uploaded', icon: 'description' },
    { num: 3, label: '3. Fulfilled (Invoiced)', icon: 'receipt' },
    { num: 4, label: '4. In Inventory', icon: 'inventory_2' },
  ];

  const getStepNumber = (status) => {
    switch (status) {
      case 'Approved': return 1;
      case 'PO Created': return 2;
      case 'Fulfilled': return 3;
      case 'Registered': return 4;
      default: return 1;
    }
  };

  const ORDER_STATUSES = [
    { value: 'Approved', label: 'Approved' },
    { value: 'PO Created', label: 'PO Uploaded' },
    { value: 'Fulfilled', label: 'Fulfilled' },
    { value: 'Registered', label: 'In Inventory' },
  ];
  const orderType = (o) => o.resourceType || o.item;
  const displayed = orders.filter(o =>
    (statusFilter === 'All' || o.status === statusFilter) &&
    matchesSearch(search, o.id, orderType(o), o.department, o.requestedBy, o.requester, o.poNumber, o.vendor, o.invoice, o.status)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>Procurement Orders</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Upload Purchase Orders and attach supplier invoices to fulfill orders.
          </p>
        </div>
      </div>

      {!loading && orders.length > 0 && (
        <TableToolbar
          standalone
          search={search}
          onSearchChange={setSearch}
          placeholder="Search by order ID, item, department, PO #, vendor or invoice..."
          filters={[
            {
              label: 'All Statuses',
              value: statusFilter,
              onChange: setStatusFilter,
              options: ORDER_STATUSES.map((st) => ({ ...st, label: `${st.label} (${orders.filter((o) => o.status === st.value).length})` })),
            },
          ]}
          resultCount={displayed.length}
          totalCount={orders.length}
        />
      )}

      {/* Orders List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading orders...</div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0' }}>
          <span className="material-icons" style={{ fontSize: 48, color: '#94a3b8', display: 'block', marginBottom: 12 }}>shopping_cart</span>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1e293b' }}>
            {search.trim() ? 'No orders match your search' : 'No orders in this stage'}
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            {search.trim() ? 'Try a different search or clear the filters.' : 'Choose a different status in the dropdown above.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {displayed.map(proc => {
            const sc = STATUS_CONFIG[proc.status] || { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', label: proc.status };
            const inputs = formInputs[proc.id] || {};
            const isSubmitting = submittingId === proc.id;
            const currentStep = getStepNumber(proc.status);

            return (
              <div
                key={proc.id}
                style={{
                  background: '#ffffff',
                  border: `1px solid ${sc.border}`,
                  borderRadius: 14,
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                {/* Order Top Summary Bar */}
                <div
                  style={{
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                    background: sc.bg,
                    borderBottom: `1px solid ${sc.border}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', background: '#ffffff', padding: '4px 10px', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                      {proc.id}
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                      {proc.resourceType || proc.item} × {proc.quantity}
                    </span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                      Department: <strong style={{ color: '#334155' }}>{proc.department}</strong>
                    </span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                      Requested by: <strong style={{ color: '#334155' }}>{proc.requestedBy || proc.requester || 'User'}</strong>
                    </span>
                  </div>

                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: 20,
                    background: '#ffffff',
                    color: sc.text,
                    border: `1px solid ${sc.border}`
                  }}>
                    {sc.label}
                  </span>
                </div>

                {/* Progress Pipeline */}
                <div style={{ padding: '0.85rem 1.25rem', background: '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {PIPELINE_STEPS.map(s => {
                      const isDone = currentStep > s.num;
                      const isCurrent = currentStep === s.num;
                      const dotBg = isDone ? '#22c55e' : isCurrent ? '#2563eb' : '#e2e8f0';
                      const textColor = isDone ? '#166534' : isCurrent ? '#1d4ed8' : '#94a3b8';

                      return (
                        <div key={s.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                          <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: dotBg,
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 700,
                            boxShadow: isCurrent ? '0 0 0 3px rgba(37,99,235,0.2)' : 'none'
                          }}>
                            {isDone ? (
                              <span className="material-icons" style={{ fontSize: 16 }}>check</span>
                            ) : (
                              <span className="material-icons" style={{ fontSize: 15 }}>{s.icon}</span>
                            )}
                          </div>
                          <span style={{ fontSize: 11, fontWeight: isCurrent ? 700 : 500, color: textColor, marginTop: 4, textAlign: 'center' }}>
                            {s.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Stage Action Body */}
                <div style={{ padding: '1.25rem' }}>

                  {/* STAGE 1: Approved -> Upload Purchase Order File */}
                  {proc.status === 'Approved' && (
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.85rem' }}>
                        <span className="material-icons" style={{ fontSize: 22, color: '#2563eb' }}>upload_file</span>
                        <div>
                          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
                            Step 1: Upload Purchase Order File
                          </h4>
                          <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                            Attach your official Purchase Order file (PDF, PNG, JPG, or DOC). No manual typing required.
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', alignItems: 'end', marginBottom: '1rem' }}>
                        {/* File Upload Box */}
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>
                            Purchase Order Document *
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                              onChange={e => handleFileUpload(proc.id, 'po', e)}
                              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 2, width: '100%', height: '100%' }}
                            />
                            <div style={{
                              padding: '12px 14px',
                              border: inputs.poFileName ? '2px solid #3b82f6' : '2px dashed #cbd5e1',
                              borderRadius: 10,
                              background: inputs.poFileName ? '#eff6ff' : '#ffffff',
                              color: inputs.poFileName ? '#1d4ed8' : '#64748b',
                              fontSize: 13,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              cursor: 'pointer'
                            }}>
                              <span className="material-icons" style={{ fontSize: 22, color: inputs.poFileName ? '#2563eb' : '#94a3b8' }}>
                                {inputs.poFileName ? 'check_circle' : 'attach_file'}
                              </span>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <strong style={{ display: 'block', fontSize: 13 }}>
                                  {inputs.poFileName || 'Click to select PO file (PDF / Image)'}
                                </strong>
                                <span style={{ fontSize: 11, color: '#94a3b8' }}>Supports PDF, PNG, JPG, DOC up to 10MB</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Vendor Name */}
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>
                            Vendor / Supplier Name (optional)
                          </label>
                          <input
                            value={inputs.vendor || ''}
                            onChange={e => handleInputChange(proc.id, 'vendor', e.target.value)}
                            placeholder="e.g. Dell, Cisco, OfficeSupplies Co"
                            style={{ width: '100%', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: 10, fontSize: 13, background: '#fff', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleUploadPO(proc)}
                        disabled={isSubmitting}
                        style={{
                          padding: '10px 24px',
                          background: isSubmitting ? '#94a3b8' : '#2563eb',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 9,
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: isSubmitting ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          boxShadow: '0 2px 6px rgba(37,99,235,0.25)'
                        }}
                      >
                        <span className="material-icons" style={{ fontSize: 18 }}>cloud_upload</span>
                        {isSubmitting ? 'Uploading...' : 'Save & Issue Purchase Order'}
                      </button>
                    </div>
                  )}

                  {/* STAGE 2: PO Created -> Upload Invoice & Fulfill */}
                  {proc.status === 'PO Created' && (
                    <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 12, padding: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="material-icons" style={{ fontSize: 22, color: '#7c3aed' }}>receipt_long</span>
                          <div>
                            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#5b21b6' }}>
                              Step 2: Upload Invoice File & Fulfill Order
                            </h4>
                            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                              Attach the final supplier invoice document to complete and fulfill the procurement order.
                            </p>
                          </div>
                        </div>

                        {/* View Attached PO File */}
                        {proc.poFileName && (proc.poFileDataUrl || proc.poFile) && (
                          <button
                            onClick={() => setPreviewFile({
                              name: proc.poFileName || 'Purchase Order',
                              type: proc.poFileType,
                              dataUrl: proc.poFileDataUrl || proc.poFile
                            })}
                            style={{
                              padding: '6px 14px',
                              background: '#ffffff',
                              border: '1px solid #c4b5fd',
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                              color: '#7c3aed',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            <span className="material-icons" style={{ fontSize: 16 }}>description</span>
                            View Attached PO ({proc.poFileName})
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'end', marginBottom: '1rem' }}>
                        {/* Invoice File Upload */}
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#5b21b6', marginBottom: 5 }}>
                            Upload Invoice Document *
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                              onChange={e => handleFileUpload(proc.id, 'invoice', e)}
                              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 2, width: '100%', height: '100%' }}
                            />
                            <div style={{
                              padding: '12px 14px',
                              border: inputs.invoiceFileName ? '2px solid #7c3aed' : '2px dashed #c4b5fd',
                              borderRadius: 10,
                              background: inputs.invoiceFileName ? '#f5f3ff' : '#ffffff',
                              color: inputs.invoiceFileName ? '#5b21b6' : '#6b7280',
                              fontSize: 13,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              cursor: 'pointer'
                            }}>
                              <span className="material-icons" style={{ fontSize: 22, color: inputs.invoiceFileName ? '#7c3aed' : '#94a3b8' }}>
                                {inputs.invoiceFileName ? 'check_circle' : 'receipt'}
                              </span>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <strong style={{ display: 'block', fontSize: 13 }}>
                                  {inputs.invoiceFileName || 'Click to select Invoice file (PDF / Image)'}
                                </strong>
                                <span style={{ fontSize: 11, color: '#94a3b8' }}>Invoice scan, receipt, or bill</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Invoice Number */}
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#5b21b6', marginBottom: 5 }}>
                            Invoice Number (optional)
                          </label>
                          <input
                            value={inputs.invoice || ''}
                            onChange={e => handleInputChange(proc.id, 'invoice', e.target.value)}
                            placeholder="e.g. INV-2026-9041"
                            style={{ width: '100%', padding: '12px 14px', border: '1px solid #c4b5fd', borderRadius: 10, fontSize: 13, background: '#fff', boxSizing: 'border-box' }}
                          />
                        </div>

                        {/* Total Amount */}
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#5b21b6', marginBottom: 5 }}>
                            Total Bill Amount ($) (optional)
                          </label>
                          <input
                            value={inputs.invoiceAmount || ''}
                            onChange={e => handleInputChange(proc.id, 'invoiceAmount', e.target.value)}
                            placeholder="e.g. $4,500"
                            style={{ width: '100%', padding: '12px 14px', border: '1px solid #c4b5fd', borderRadius: 10, fontSize: 13, background: '#fff', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleUploadInvoiceAndFulfill(proc)}
                        disabled={isSubmitting}
                        style={{
                          padding: '10px 24px',
                          background: isSubmitting ? '#94a3b8' : '#7c3aed',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 9,
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: isSubmitting ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          boxShadow: '0 2px 6px rgba(124,58,237,0.25)'
                        }}
                      >
                        <span className="material-icons" style={{ fontSize: 18 }}>task_alt</span>
                        {isSubmitting ? 'Saving...' : 'Record Invoice & Mark Fulfilled'}
                      </button>
                    </div>
                  )}

                  {/* STAGE 3 & 4: Fulfilled & Registered */}
                  {(proc.status === 'Fulfilled' || proc.status === 'Registered') && (
                    <div style={{
                      background: proc.status === 'Registered' ? '#f5f3ff' : '#ecfdf5',
                      border: `1px solid ${proc.status === 'Registered' ? '#ddd6fe' : '#a7f3d0'}`,
                      borderRadius: 12,
                      padding: '1.1rem 1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className="material-icons" style={{
                          fontSize: 28,
                          color: proc.status === 'Registered' ? '#7c3aed' : '#16a34a'
                        }}>
                          {proc.status === 'Registered' ? 'verified' : 'inventory_2'}
                        </span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                            {proc.status === 'Registered'
                              ? 'Delivered & Assets Successfully Registered in Inventory'
                              : 'Order Fulfilled — Ready for Inventory Officer to Ingest Assets'}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                            Vendor: <strong>{proc.vendor || 'Supplier'}</strong> · Invoice: <strong>{proc.invoice || 'Logged'}</strong> {proc.poNumber ? `· PO: ${proc.poNumber}` : ''}
                          </div>
                        </div>
                      </div>

                      {/* Document Quick View Buttons */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {proc.poFileName && (proc.poFileDataUrl || proc.poFile) && (
                          <button
                            onClick={() => setPreviewFile({
                              name: proc.poFileName || 'Purchase Order',
                              type: proc.poFileType,
                              dataUrl: proc.poFileDataUrl || proc.poFile
                            })}
                            style={{
                              padding: '6px 14px',
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                              color: '#2563eb',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            <span className="material-icons" style={{ fontSize: 16 }}>description</span>
                            View PO File
                          </button>
                        )}

                        {(proc.invoiceFileName || proc.invoiceFile || proc.invoiceFileDataUrl) && (
                          <button
                            onClick={() => setPreviewFile({
                              name: proc.invoiceFileName || `Invoice_${proc.id}`,
                              type: proc.invoiceFileType,
                              dataUrl: proc.invoiceFile || proc.invoiceFileDataUrl
                            })}
                            style={{
                              padding: '6px 14px',
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                              color: '#16a34a',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            <span className="material-icons" style={{ fontSize: 16 }}>receipt</span>
                            View Invoice File
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <div
          onClick={() => setPreviewFile(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: '1.5rem',
              width: '100%',
              maxWidth: 750,
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-icons" style={{ fontSize: 22, color: '#2563eb' }}>description</span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{previewFile.name}</h3>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', fontSize: 16, color: '#64748b' }}
              >
                ✕
              </button>
            </div>
            {previewFile.type?.startsWith('image/') ? (
              <img
                src={previewFile.dataUrl}
                alt={previewFile.name}
                style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: 8 }}
              />
            ) : (
              <iframe
                src={previewFile.dataUrl}
                title={previewFile.name}
                style={{ flex: 1, border: 'none', borderRadius: 8, minHeight: 460 }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
