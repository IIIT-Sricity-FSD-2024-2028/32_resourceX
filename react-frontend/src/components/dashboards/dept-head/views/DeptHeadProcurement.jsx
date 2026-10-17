import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import {
  fetchDeptProcurements,
  fetchDeptResourceTypes,
  createDeptProcurement
} from '../../../../services/deptHead';
import { StatusBadge, EmptyRow, ErrorBlock, FileLink, LoadingBlock } from '../components/deptHeadUtils';
import TableToolbar, { matchesSearch, uniqueOptions } from '../../../common/TableToolbar';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg'
];
const MAX_MB = 5;

const formatSize = (bytes) => {
  const kb = bytes / 1024;
  return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(2)} MB`;
};

/**
 * #procurement-view from department_head.html
 * New procurement form (multipart upload of spec file) + recent procurements table.
 */
export default function DeptHeadProcurement() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast = () => {}, openProcurementFile = () => {} } = useOutletContext() || {};

  const fileInputRef = useRef(null);
  const typeSelectRef = useRef(null);

  const [types, setTypes] = useState([]);
  const [procurements, setProcurements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({ resourceType: '', quantity: '', justification: '', targetDate: '' });
  const [specFile, setSpecFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileWarning, setFileWarning] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const procType = (p) => p.resourceType || p.item;
  const visibleProcurements = procurements.filter((p) =>
    (statusFilter === 'All' || p.status === statusFilter) &&
    (typeFilter === 'All' || procType(p) === typeFilter) &&
    matchesSearch(search, p.id, procType(p), p.status, p.targetDateDisplay, p.targetDate, p.justification, p.vendor)
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [procs, typeList] = await Promise.all([
        fetchDeptProcurements(),
        user?.department ? fetchDeptResourceTypes(user.department) : Promise.resolve([])
      ]);
      setProcurements(procs || []);
      setTypes(typeList || []);
    } catch (err) {
      setError(err.message || 'Failed to load procurement data.');
      addToast(err.message || 'Error loading procurements', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast, user?.department]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Pre-fill from "Send Request" (Stock Monitoring) or the Low Stock banner
  useEffect(() => {
    const preset = location.state?.resourceType;
    if (preset) {
      setForm((f) => ({ ...f, resourceType: preset }));
      setTimeout(() => typeSelectRef.current?.focus(), 50);
      // clear router state so a refresh doesn't re-apply it
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);

  // ---- File handling ----
  const readFile = (file) => {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      addToast('❌ Unsupported file type. Please upload PDF, DOC, DOCX, PNG or JPG.', 'error');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      addToast(`❌ File too large. Maximum size is ${MAX_MB} MB.`, 'error');
      return;
    }
    setSpecFile(file);
    setFileWarning(false);
  };

  const onFileSelected = (e) => {
    readFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    readFile(e.dataTransfer?.files?.[0]);
  };

  // ---- Submit ----
  const handleSubmit = async (e) => {
    e.preventDefault();
    const qty = parseInt(form.quantity, 10);

    if (!form.resourceType.trim() || Number.isNaN(qty) || qty < 1 || !form.justification.trim()) {
      addToast('Please fill in all fields correctly before submitting.', 'error');
      return;
    }

    if (!specFile) {
      addToast('⚠️ Please attach a Resource Specification / Intent File before submitting.', 'error');
      setFileWarning(true);
      return;
    }

    const payload = {
      item: form.resourceType,
      resourceType: form.resourceType,
      quantity: qty,
      department: user?.department,
      requester: user?.name,
      requestedBy: user?.name,
      requestedById: user?.id,
      requesterRole: user?.role,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      targetDate: form.targetDate || undefined,
      expectedDeliveryDate: form.targetDate || undefined,
      justification: form.justification.trim()
    };

    setIsSubmitting(true);
    try {
      const created = await createDeptProcurement(payload, specFile);
      if (created) setProcurements((prev) => [created, ...prev.filter((p) => p.id !== created.id)]);
      addToast('Procurement Request submitted and sent to Registrar for approval.', 'success');
      setForm({ resourceType: '', quantity: '', justification: '', targetDate: '' });
      setSpecFile(null);
    } catch (err) {
      addToast('❌ Failed to submit: ' + (err.message || 'Unknown error. Please try again.'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeOptions = form.resourceType && !types.includes(form.resourceType) ? [form.resourceType, ...types] : types;

  return (
    <div className="view-section">
      <h1 className="page-title">Procurement Requests</h1>
      <p className="page-subtitle">Submit and track requests for new resource acquisitions to the Registrar.</p>

      <div className="dh-proc-layout">
        {/* New Procurement Form */}
        <div className="form-card" style={{ flex: 1 }}>
          <h3 className="data-section-title" style={{ marginBottom: '1rem' }}>New Procurement</h3>
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">Resource Type / Model</label>
              <select
                ref={typeSelectRef}
                className="form-control"
                value={form.resourceType}
                onChange={(e) => setForm({ ...form, resourceType: e.target.value })}
                required
              >
                {typeOptions.length === 0 ? (
                  <option value="" disabled>No Catalog Configured for Department</option>
                ) : (
                  <option value="" disabled>Select Resource Type</option>
                )}
                {typeOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Quantity Required</label>
              <input
                type="number"
                min="1"
                className="form-control"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Target / Needed By Date (Suggested)
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400 }}> (Desired fulfillment timeline · fulfillment accepted even if later)</span>
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className="form-control"
                value={form.targetDate}
                onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Justification</label>
              <textarea
                className="form-control"
                rows="3"
                value={form.justification}
                onChange={(e) => setForm({ ...form, justification: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Resource Specification / Intent File
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400 }}> (PDF, DOC, DOCX, PNG, JPG · max 5 MB)</span>
              </label>

              {!specFile ? (
                <div
                  className={`file-upload-zone ${dragOver ? 'dragover' : ''} ${fileWarning ? 'warning' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                >
                  <span className="material-symbols-outlined upload-icon">upload_file</span>
                  <p>
                    Drag &amp; drop your file here or <strong style={{ color: 'var(--primary-color,#3b82f6)' }}>browse</strong>
                  </p>
                  <p style={{ fontSize: '0.72rem', marginTop: '0.3rem' }}>Supports: PDF, DOC, DOCX, PNG, JPG</p>
                </div>
              ) : (
                <div className="file-preview-box">
                  <span className="material-symbols-outlined file-icon">description</span>
                  <div className="file-info">
                    <div className="file-name">{specFile.name}</div>
                    <div className="file-size">{formatSize(specFile.size)}</div>
                  </div>
                  <button type="button" className="file-remove-btn" title="Remove file" onClick={() => setSpecFile(null)}>✕</button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                style={{ display: 'none' }}
                onChange={onFileSelected}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit to Registrar'}
            </button>
          </form>
        </div>

        {/* Recent Procurements */}
        <div className="data-section" style={{ flex: 1.5, marginBottom: 0 }}>
          <div className="data-section-header">
            <div className="data-section-title">Recent Procurement Requests</div>
            <button type="button" className="btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }} onClick={loadData}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>refresh</span> Refresh
            </button>
          </div>
          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder="Search by Proc ID, type, status or date..."
            filters={[
              { label: 'All Statuses', value: statusFilter, onChange: setStatusFilter, options: uniqueOptions(procurements, 'status') },
              { label: 'All Types', value: typeFilter, onChange: setTypeFilter, options: uniqueOptions(procurements, procType) },
            ]}
            resultCount={visibleProcurements.length}
            totalCount={procurements.length}
          />
          {isLoading ? (
            <LoadingBlock text="Loading procurements..." />
          ) : error ? (
            <ErrorBlock text={error} onRetry={loadData} />
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Proc ID</th>
                    <th>Type</th>
                    <th>Qty</th>
                    <th>Needed By</th>
                    <th>Status</th>
                    <th>Spec File</th>
                    <th>Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleProcurements.length === 0 ? (
                    <EmptyRow colSpan={7} text={procurements.length === 0 ? 'No procurement requests yet.' : 'No procurement requests match your search.'} />
                  ) : (
                    visibleProcurements.map((p) => (
                      <tr key={p.id}>
                        <td className="td-id">{p.id}</td>
                        <td>{p.resourceType || p.item}</td>
                        <td>{p.quantity}</td>
                        <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                          {p.targetDateDisplay || p.targetDate ? (
                            <span style={{ fontWeight: 500, color: '#334155' }}>
                              📅 {p.targetDateDisplay || p.targetDate}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>—</span>
                          )}
                        </td>
                        <td><StatusBadge status={p.status} /></td>
                        <td><FileLink name={p.specFileName} onClick={() => openProcurementFile(p, 'spec')} /></td>
                        <td><FileLink name={p.invoiceFileName} onClick={() => openProcurementFile(p, 'invoice')} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
