import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  fetchDepartments,
  fetchResourceCatalog,
  fetchStock,
  fetchResources,
  fetchProcurements,
  createProcurement
} from '../../../../services/requestor';

export default function ProcurementView({ addToast, onPreviewFile }) {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [stock, setStock] = useState([]);
  const [existingResources, setExistingResources] = useState([]);
  const [procurements, setProcurements] = useState([]);

  const [selectedDept, setSelectedDept] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');

  // Spec file state: { name, size, type, dataUrl, rawFile }
  const [specFile, setSpecFile] = useState(null);
  const [fileWarning, setFileWarning] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [depts, cat, stk, resList, procList] = await Promise.all([
        fetchDepartments().catch(() => []),
        fetchResourceCatalog().catch(() => []),
        fetchStock().catch(() => []),
        fetchResources().catch(() => []),
        fetchProcurements().catch(() => [])
      ]);
      setDepartments(depts || []);
      setCatalog(cat || []);
      setStock(stk || []);
      setExistingResources(resList || []);
      setProcurements(procList || []);
    } catch (err) {
      console.error('Failed to load procurement metadata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getDeptResourceTypes = (deptName) => {
    if (!deptName) return [];

    const catEntry = catalog.find((c) => c.department === deptName);
    if (catEntry && Array.isArray(catEntry.resourceTypes) && catEntry.resourceTypes.length > 0) {
      return [...catEntry.resourceTypes];
    }

    const stockRows = stock.filter((s) => s.department === deptName);
    if (stockRows.length > 0) {
      return [...new Set(stockRows.map((s) => s.resourceType))];
    }

    const resTypes = existingResources
      .filter((r) => r.department === deptName)
      .map((r) => r.type);
    return [...new Set(resTypes)];
  };

  const handleDeptChange = (e) => {
    setSelectedDept(e.target.value);
    setSelectedType('');
  };

  const handleFileProcess = (file) => {
    if (!file) return;
    const ALLOWED = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg'
    ];
    const MAX_MB = 5;

    if (!ALLOWED.includes(file.type)) {
      addToast('❌ Unsupported file type. Please upload PDF, DOC, DOCX, PNG or JPG.', 'error');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      addToast(`❌ File too large. Maximum size is ${MAX_MB} MB.`, 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSpecFile({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: event.target.result,
        rawFile: file
      });
      setFileWarning(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFileProcess(file);
  };

  const removeFile = () => {
    setSpecFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDept || !selectedType.trim() || isNaN(quantity) || quantity < 1 || !reason.trim()) {
      addToast('Please fill in all fields correctly before submitting.', 'error');
      return;
    }

    if (!specFile) {
      addToast('⚠️ Please attach a Resource Specification / Intent File before submitting.', 'warning');
      setFileWarning(true);
      return;
    }

    const newId = `PRC-${Math.floor(1000 + Math.random() * 9000)}`;
    const dateStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const payload = {
      id: newId,
      item: selectedType,
      resourceType: selectedType,
      department: selectedDept,
      requester: user?.name || 'Requestor',
      requestedById: user?.id,
      requesterRole: user?.role || 'Requestor',
      quantity: Number(quantity),
      status: 'Pending Approval',
      priority: 'Normal',
      date: dateStr,
      justification: reason,
      specFileName: specFile.name,
      specFileType: specFile.type,
      specFileDataUrl: specFile.dataUrl
    };

    setSubmitting(true);
    try {
      await createProcurement(payload, specFile.rawFile);
      addToast(`Procurement Request Submitted Successfully! ID: ${newId}`, 'success');

      // Reset form
      setSelectedDept('');
      setSelectedType('');
      setQuantity(1);
      setReason('');
      setSpecFile(null);
      setFileWarning(false);

      // Reload procurement history
      const updated = await fetchProcurements();
      setProcurements(updated || []);
    } catch (err) {
      console.error('Procurement submit error:', err);
      addToast(`❌ Failed to submit: ${err.message || 'Unknown error. Please try again.'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const availableTypes = getDeptResourceTypes(selectedDept);
  const myProcs = procurements.filter(
    (p) => p.requester === user?.name || p.requestedById === user?.id
  );

  return (
    <div className="view-section">
      <h1 className="page-title">Procurement Request</h1>
      <p className="page-subtitle">
        Submit a request to procure new resources not currently available in the inventory.
      </p>

      <div className="form-card">
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Requesting Department</label>
            <select
              className="form-control"
              value={selectedDept}
              onChange={handleDeptChange}
              required
            >
              <option value="" disabled>Select Department</option>
              {departments.map((d) => (
                <option key={d.id || d.name} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Resource Type / Name</label>
            <select
              className="form-control"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              disabled={!selectedDept}
              required
            >
              <option value="" disabled>
                {!selectedDept ? 'Select a Department First' : availableTypes.length === 0 ? 'No Catalog Configured for Department' : 'Select Resource Type'}
              </option>
              {availableTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Quantity</label>
            <input
              type="number"
              className="form-control"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Reason</label>
            <textarea
              className="form-control"
              rows="4"
              placeholder="Explain why this procurement is needed based on business requirements..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Resource Specification / Intent File
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400 }}>
                {' '} (Required — PDF, DOC, DOCX, PNG, JPG · max 5 MB)
              </span>
            </label>

            {!specFile ? (
              <div
                className={`file-upload-zone ${isDragOver ? 'dragover' : ''}`}
                style={{ borderColor: fileWarning ? '#f59e0b' : undefined }}
                onClick={() => document.getElementById('proc-spec-file-input')?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
              >
                <span className="material-symbols-outlined">upload_file</span>
                <p>
                  Drag &amp; drop your file here or <strong style={{ color: 'var(--primary-color, #0F386E)' }}>browse</strong>
                </p>
                <p style={{ fontSize: '0.72rem', marginTop: '0.3rem' }}>
                  Supports: PDF, DOC, DOCX, PNG, JPG
                </p>
                <input
                  type="file"
                  id="proc-spec-file-input"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
              </div>
            ) : (
              <div className="file-preview-box">
                <span className="material-symbols-outlined file-icon">description</span>
                <div className="file-info">
                  <div className="file-name">{specFile.name}</div>
                  <div className="file-size">
                    {(specFile.size / 1024).toFixed(1)} KB
                  </div>
                </div>
                <button
                  type="button"
                  className="file-remove-btn"
                  title="Remove file"
                  onClick={removeFile}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Submitting Procurement...' : 'Submit Procurement Request'}
          </button>
        </form>
      </div>

      {/* Procurement History Table */}
      <div className="data-section" style={{ marginTop: '2rem' }}>
        <div className="data-section-header">
          <div className="data-section-title">My Procurement History</div>
          <button
            className="btn-secondary"
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
            onClick={loadData}
          >
            Refresh
          </button>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Item Name</th>
                <th>Qty</th>
                <th>Date Submitted</th>
                <th>Status</th>
                <th>Spec File</th>
                <th>Invoice</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Loading procurement history...
                  </td>
                </tr>
              ) : myProcs.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    No procurement history found.
                  </td>
                </tr>
              ) : (
                myProcs.map((proc) => {
                  let statusBadgeClass = 'badge';
                  if (proc.status === 'Approved' || proc.status === 'Completed') {
                    statusBadgeClass = 'badge approved';
                  } else if (proc.status === 'Pending Approval' || proc.status === 'Pending') {
                    statusBadgeClass = 'badge pending';
                  } else if (proc.status === 'Rejected') {
                    statusBadgeClass = 'badge rejected';
                  }

                  const specCell = proc.specFileName ? (
                    <button
                      type="button"
                      className="spec-file-link"
                      onClick={() =>
                        onPreviewFile({
                          name: proc.specFileName,
                          type: proc.specFileType || 'application/pdf',
                          dataUrl: proc.specFileDataUrl
                        })
                      }
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>visibility</span>
                      {proc.specFileName}
                    </button>
                  ) : (
                    <span style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>—</span>
                  );

                  const invoiceCell = proc.invoiceFileName ? (
                    <button
                      type="button"
                      className="spec-file-link"
                      onClick={() =>
                        onPreviewFile({
                          name: proc.invoiceFileName,
                          type: proc.invoiceFileType || 'application/pdf',
                          dataUrl: proc.invoiceFileDataUrl
                        })
                      }
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>visibility</span>
                      {proc.invoiceFileName}
                    </button>
                  ) : (
                    <span style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>—</span>
                  );

                  return (
                    <tr key={proc.id}>
                      <td className="td-id">{proc.id}</td>
                      <td>{proc.item || proc.resourceType}</td>
                      <td>{String(proc.quantity).padStart(2, '0')}</td>
                      <td>{proc.date}</td>
                      <td>
                        <span className={statusBadgeClass}>{proc.status}</span>
                      </td>
                      <td>{specCell}</td>
                      <td>{invoiceCell}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
