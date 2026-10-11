import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { fetchStaffProcurements, logStaffPurchase } from '../../../../services/staff';

export default function ProcurementTasksView({ addToast, onProcurementLogged }) {
  const { user } = useAuth();
  const department = user?.department || 'IT Services';

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formInputs, setFormInputs] = useState({}); // procId -> { vendor, invoice, file, fileName, fileDataUrl }
  const [submittingId, setSubmittingId] = useState(null);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchStaffProcurements({ department });
      const list = Array.isArray(res) ? res : [];
      // Only approved procurements need to be logged by staff
      setTasks(list.filter((p) => p.status === 'Approved'));
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to load procurement tasks.', 'error');
    } finally {
      setLoading(false);
    }
  }, [department, addToast]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleInputChange = (procId, field, value) => {
    setFormInputs((prev) => ({
      ...prev,
      [procId]: {
        ...(prev[procId] || {}),
        [field]: value
      }
    }));
  };

  const handleFileChange = (procId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg'
    ];
    if (!allowed.includes(file.type)) {
      if (addToast) addToast('Unsupported file type. Please upload PDF, DOC, DOCX, PNG or JPG.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      if (addToast) addToast('File too large. Maximum size is 5 MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setFormInputs((prev) => ({
        ...prev,
        [procId]: {
          ...(prev[procId] || {}),
          file,
          fileName: file.name,
          fileDataUrl: uploadEvent.target?.result
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleLogPurchase = async (proc) => {
    const inputs = formInputs[proc.id] || {};
    const vendor = (inputs.vendor || '').trim();
    const invoice = (inputs.invoice || '').trim();

    if (!vendor) {
      if (addToast) addToast('Please enter a vendor name.', 'error');
      return;
    }
    if (!invoice) {
      if (addToast) addToast('Please enter an invoice number.', 'error');
      return;
    }

    try {
      setSubmittingId(proc.id);
      await logStaffPurchase(proc.id, {
        vendor,
        invoice,
        invoiceFile: inputs.fileDataUrl || undefined,
        invoiceFileName: inputs.fileName || undefined,
        invoiceFileSize: inputs.file ? inputs.file.size : undefined,
        invoiceFileType: inputs.file ? inputs.file.type : undefined
      });

      if (addToast) {
        addToast(`Purchase logged for ${proc.id} (${vendor}) successfully.`, 'success');
      }

      setFormInputs((prev) => {
        const next = { ...prev };
        delete next[proc.id];
        return next;
      });

      await loadTasks();
      if (onProcurementLogged) onProcurementLogged();
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to log purchase.', 'error');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="view-section active">
      <h1 className="page-title">Procurement Fulfillment</h1>
      <p className="page-subtitle">
        Process Registrar-approved purchases by logging vendor and invoice data.
      </p>

      <div className="data-section">
        {loading ? (
          <div className="staff-loading-container">
            <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>
              sync
            </span>
            <span>Loading procurement tasks...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="staff-empty-state" style={{ padding: '3rem 1rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#94a3b8' }}>
              assignment_turned_in
            </span>
            <p style={{ marginTop: '0.75rem', fontSize: '1rem', color: '#64748b' }}>
              No pending procurement tasks for {department}.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table" id="proctask-tbody">
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>TASK ID / TYPE</th>
                  <th style={{ width: '15%' }}>QTY FOUND</th>
                  <th style={{ width: '45%' }}>VENDOR & INVOICE</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((p) => {
                  const inputs = formInputs[p.id] || {};
                  const isSubmitting = submittingId === p.id;
                  const displayId = `PT-${p.id.split('-')[1] || p.id}`;

                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="td-id">{displayId}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {p.resourceType || p.item}
                        </div>
                      </td>
                      <td>{p.quantity}</td>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          style={{ marginBottom: '0.35rem', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                          placeholder="Vendor Name"
                          value={inputs.vendor || ''}
                          onChange={(e) => handleInputChange(p.id, 'vendor', e.target.value)}
                        />
                        <input
                          type="text"
                          className="form-control"
                          style={{ marginBottom: '0.35rem', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                          placeholder="Invoice Number"
                          value={inputs.invoice || ''}
                          onChange={(e) => handleInputChange(p.id, 'invoice', e.target.value)}
                        />
                        <input
                          type="file"
                          style={{ fontSize: '0.75rem', width: '100%' }}
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                          onChange={(e) => handleFileChange(p.id, e)}
                        />
                        {inputs.fileName && (
                          <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.2rem', fontWeight: 500 }}>
                            Attached: {inputs.fileName}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => handleLogPurchase(p)}
                          disabled={isSubmitting}
                          style={{ fontSize: '0.825rem', padding: '0.45rem 1rem' }}
                        >
                          {isSubmitting ? 'Logging...' : 'Log Purchase'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
