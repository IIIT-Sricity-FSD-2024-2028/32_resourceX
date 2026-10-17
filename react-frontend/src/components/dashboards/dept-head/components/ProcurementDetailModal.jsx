import React, { useEffect, useState } from 'react';
import { editDeptProcurement, cancelDeptProcurement, fetchDeptResourceTypes } from '../../../../services/deptHead';
import DocumentUpload from '../../../common/DocumentUpload';
import StageTracker, { AttachmentButton, ReasonCallout, formatStamp, formatYmd, skipStagesFrom, toYmd } from '../../../common/StageTracker';

// The stage that is in progress for each status of the happy path
const CURRENT_STAGE = {
  'Pending Approval': 'review',
  Pending: 'registrar',
  Approved: 'po',
  'PO Created': 'delivery',
  'Out for Delivery': 'delivery',
  Fulfilled: 'registered',
};

function buildStages(proc) {
  // Older procurements raised by requestors went through a dept head approval step first
  const hadDeptReview = proc.status === 'Pending Approval' || proc.deptApprovedAt || proc.rejectedStage === 'Dept Head';
  const stages = [
    { key: 'submitted', label: 'Request Submitted', icon: 'send', state: 'done',
      time: formatStamp(proc.createdAt) || proc.date, note: `By ${proc.requester || proc.requestedBy}` },
    hadDeptReview && { key: 'review', label: 'Dept Head Approval', icon: 'how_to_reg',
      note: 'Awaiting department head review' },
    { key: 'registrar', label: 'Registrar Approval', icon: 'gavel', note: 'Awaiting registrar sign-off' },
    { key: 'po', label: 'Purchase Order', icon: 'request_quote', note: 'Procurement officer issues the PO' },
    { key: 'delivery', label: 'Delivery', icon: 'local_shipping', note: 'Vendor ships the order' },
    { key: 'registered', label: 'Added to Inventory', icon: 'inventory_2', note: 'Inventory officer registers the items' },
  ].filter(Boolean);
  const byKey = Object.fromEntries(stages.map((s) => [s.key, s]));

  // Notes for stages that have completed
  const doneNotes = {
    review: () => ({ note: proc.deptApprovedBy ? `Approved by ${proc.deptApprovedBy}` : 'Approved', time: formatStamp(proc.deptApprovedAt) }),
    registrar: () => ({ note: proc.registrarApprovedBy ? `Approved by ${proc.registrarApprovedBy}` : 'Approved', time: formatStamp(proc.registrarApprovedAt) }),
    po: () => ({
      note: [proc.poNumber && `PO ${proc.poNumber}`, proc.vendor].filter(Boolean).join(' · ') || 'Purchase order issued',
      time: formatStamp(proc.poCreatedAt) || proc.poDate,
    }),
    delivery: () => ({ note: proc.receivedDate ? `Received ${proc.receivedDate}` : 'Delivered', time: formatStamp(proc.fulfilledAt) }),
    registered: () => ({ note: 'Items registered in inventory', time: formatStamp(proc.registeredAt) }),
  };
  const markDoneBefore = (index) => {
    stages.slice(1, index).forEach((s) => Object.assign(s, { state: 'done' }, doneNotes[s.key]()));
  };

  if (proc.status === 'Rejected') {
    const stage = byKey.review && (proc.rejectedStage === 'Dept Head' || (!proc.rejectedStage && !proc.deptApprovedAt))
      ? byKey.review
      : byKey.registrar;
    const index = stages.indexOf(stage);
    markDoneBefore(index);
    Object.assign(stage, {
      state: 'rejected',
      label: `Rejected by ${stage.key === 'review' ? 'Dept Head' : 'Registrar'}`,
      note: proc.rejectedBy ? `Rejected by ${proc.rejectedBy}` : 'This procurement was rejected',
      time: formatStamp(proc.rejectedAt),
    });
    skipStagesFrom(stages, index + 1);
  } else if (proc.status === 'Cancelled') {
    const stage = proc.registrarApprovedAt ? byKey.po : proc.deptApprovedAt || !byKey.review ? byKey.registrar : byKey.review;
    const index = stages.indexOf(stage);
    markDoneBefore(index);
    Object.assign(stage, {
      state: 'cancelled',
      label: 'Cancelled',
      note: proc.cancelledBy ? `Cancelled by ${proc.cancelledBy}` : 'This procurement was cancelled',
      time: formatStamp(proc.cancelledAt),
    });
    skipStagesFrom(stages, index + 1);
  } else if (proc.status === 'Registered') {
    markDoneBefore(stages.length);
  } else {
    const current = byKey[CURRENT_STAGE[proc.status]];
    if (current) {
      const index = stages.indexOf(current);
      markDoneBefore(index);
      current.state = 'current';
      if (proc.status === 'PO Created') {
        current.note = 'Waiting for the vendor to dispatch';
      } else if (proc.status === 'Out for Delivery') {
        current.note = [proc.carrier, proc.trackingNumber && `Tracking ${proc.trackingNumber}`].filter(Boolean).join(' · ') || 'Out for delivery';
        current.time = proc.expectedDeliveryDate ? `Expected ${formatYmd(proc.expectedDeliveryDate) || proc.expectedDeliveryDate}` : formatStamp(proc.dispatchedAt);
      }
      stages.slice(index + 1).forEach((s) => { s.state = 'upcoming'; });
    }
  }
  stages.forEach((s) => { if (!s.state) s.state = 'upcoming'; });
  return stages;
}

export default function ProcurementDetailModal({ procurement, onClose, onChanged, addToast, onOpenFile }) {
  const [mode, setMode] = useState('view'); // view | edit | cancel
  const [saving, setSaving] = useState(false);
  const [resourceTypes, setResourceTypes] = useState([]);
  const [form, setForm] = useState({});
  const [cancelReason, setCancelReason] = useState('');
  const [newSpec, setNewSpec] = useState(null);
  const [specOpen, setSpecOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => { setMode('view'); setSpecOpen(false); }, [procurement?.status]);

  if (!procurement) return null;

  const proc = procurement;
  const canEdit = proc.status === 'Pending' || proc.status === 'Pending Approval';
  const canCancel = ['Pending Approval', 'Pending', 'Approved'].includes(proc.status);
  const stages = buildStages(proc);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minTarget = toYmd(tomorrow);

  const startEdit = async () => {
    setForm({
      resourceType: proc.resourceType || proc.item,
      quantity: proc.quantity,
      priority: proc.priority || 'Normal',
      targetDate: proc.targetDate?.slice(0, 10) || '',
      justification: proc.justification || '',
    });
    setNewSpec(null);
    setMode('edit');
    try {
      setResourceTypes((await fetchDeptResourceTypes(proc.department)) || []);
    } catch {
      setResourceTypes([]);
    }
  };

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    const quantity = Number(form.quantity);
    if (!form.resourceType || !Number.isInteger(quantity) || quantity < 1 || !form.justification.trim()) {
      addToast('Please fill in all fields correctly.', 'error');
      return;
    }
    setSaving(true);
    try {
      await editDeptProcurement(proc.id, {
        resourceType: form.resourceType,
        quantity,
        priority: form.priority,
        justification: form.justification.trim(),
        targetDate: form.targetDate,
        targetDateDisplay: formatYmd(form.targetDate),
        ...(newSpec && {
          specFileName: newSpec.documentFileName,
          specFileType: newSpec.documentFileType,
          specFileDataUrl: newSpec.documentFileDataUrl,
        }),
      });
      addToast('Procurement updated.', 'success');
      setMode('view');
      await onChanged();
    } catch (err) {
      addToast(err.message || 'Failed to update procurement.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Upload or replace just the specification file, without opening the full edit form
  const handleSaveSpec = async () => {
    if (!newSpec) {
      addToast('Choose a file to upload first.', 'error');
      return;
    }
    setSaving(true);
    try {
      await editDeptProcurement(proc.id, {
        specFileName: newSpec.documentFileName,
        specFileType: newSpec.documentFileType,
        specFileDataUrl: newSpec.documentFileDataUrl,
      });
      addToast('Specification file updated.', 'success');
      setSpecOpen(false);
      setNewSpec(null);
      await onChanged();
    } catch (err) {
      addToast(err.message || 'Failed to update the specification file.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    setSaving(true);
    try {
      await cancelDeptProcurement(proc.id, cancelReason.trim() || undefined);
      addToast('Procurement cancelled.', 'success');
      setCancelReason('');
      await onChanged();
    } catch (err) {
      addToast(err.message || 'Failed to cancel procurement.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const typeOptions = [...new Set([proc.resourceType || proc.item, ...resourceTypes].filter(Boolean))];

  const details = [
    ['Department', proc.department],
    ['Resource Type', proc.item || proc.resourceType],
    ['Quantity', String(proc.quantity).padStart(2, '0')],
    ['Priority', proc.priority || 'Normal'],
    ['Submitted On', proc.date],
    ['Needed By', proc.targetDateDisplay || formatYmd(proc.targetDate)],
    ['Vendor', proc.vendor],
    ['PO Number', proc.poNumber],
    ['Carrier', proc.carrier],
    ['Tracking Number', proc.trackingNumber],
    ['Invoice', proc.invoice],
  ].filter(([, v]) => v);

  const attachments = [
    ['Invoice File', 'invoice', proc.invoiceFileName],
  ].filter(([, , name]) => name);

  return (
    <div className="rq-modal-backdrop" onClick={onClose}>
      <div className="rq-modal rq-modal--wide" role="dialog" aria-modal="true" aria-labelledby="proc-modal-title" onClick={(e) => e.stopPropagation()}>
        <div className="rq-modal-header">
          <div>
            <div className="rq-modal-eyebrow">Procurement Tracking</div>
            <h2 id="proc-modal-title" className="rq-modal-title">
              {proc.id}
              <span className={`badge ${proc.status.toLowerCase().replace(/\s+/g, '-')}`}>{proc.status}</span>
            </h2>
          </div>
          <button className="btn-close" aria-label="Close" onClick={onClose} />
        </div>

        <div className="rq-modal-body">
          <StageTracker stages={stages} />

          {mode === 'edit' ? (
            <form className="rq-edit-form" onSubmit={handleSave}>
              <div className="rq-form-grid">
                <label className="form-group">
                  <span className="form-label">Resource Type</span>
                  <select className="form-control" value={form.resourceType} onChange={setField('resourceType')}>
                    {typeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label className="form-group">
                  <span className="form-label">Quantity</span>
                  <input className="form-control" type="number" min="1" value={form.quantity} onChange={setField('quantity')} />
                </label>
                <label className="form-group">
                  <span className="form-label">Priority</span>
                  <select className="form-control" value={form.priority} onChange={setField('priority')}>
                    {['Low', 'Normal', 'High'].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>
                <label className="form-group">
                  <span className="form-label">Needed By (optional)</span>
                  <input className="form-control" type="date" min={minTarget} value={form.targetDate} onChange={setField('targetDate')} />
                </label>
              </div>
              <label className="form-group">
                <span className="form-label">Justification</span>
                <textarea className="form-control" rows="3" value={form.justification} onChange={setField('justification')} />
              </label>
              <DocumentUpload
                label="Replace Specification File (optional)"
                onChange={setNewSpec}
                hint={proc.specFileName ? `Current: ${proc.specFileName}. PDF, PNG or JPG, up to 5 MB.` : undefined}
              />
              <div className="rq-actions">
                <button type="button" className="btn-secondary" onClick={() => setMode('view')} disabled={saving}>Discard</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          ) : (
            <>
              {proc.status === 'Rejected' && (
                <ReasonCallout tone="rejected" title="Rejection reason" reason={proc.rejectionReason || 'No reason was recorded.'} />
              )}
              {proc.status === 'Cancelled' && (
                <ReasonCallout tone="cancelled" title="Cancellation reason" reason={proc.cancelReason} />
              )}
              <dl className="rq-details">
                {details.map(([label, value]) => (
                  <div key={label} className="rq-detail">
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              {proc.justification && (
                <div className="rq-justification">
                  <div className="rq-detail-label">Justification</div>
                  <p>{proc.justification}</p>
                </div>
              )}
              <div className="rq-letter">
                <div className="rq-letter-row">
                  <div>
                    <div className="rq-detail-label">Resource Specification File</div>
                    {proc.specFileName ? (
                      <AttachmentButton name={proc.specFileName} onPreview={() => onOpenFile('spec')} />
                    ) : (
                      <div className="rq-letter-empty">No specification file attached</div>
                    )}
                  </div>
                  {canEdit && mode === 'view' && !specOpen && (
                    <button
                      type="button"
                      className="btn-secondary rq-letter-btn"
                      onClick={() => { setNewSpec(null); setSpecOpen(true); }}
                    >
                      <span className="material-symbols-outlined">upload_file</span>
                      {proc.specFileName ? 'Replace' : 'Upload'}
                    </button>
                  )}
                </div>
                {specOpen && (
                  <div className="rq-letter-upload">
                    <DocumentUpload label="New specification file" onChange={setNewSpec} />
                    <div className="rq-actions">
                      <button type="button" className="btn-secondary" onClick={() => setSpecOpen(false)} disabled={saving}>Discard</button>
                      <button type="button" className="btn-primary" onClick={handleSaveSpec} disabled={saving || !newSpec}>
                        {saving ? 'Saving...' : 'Save File'}
                      </button>
                    </div>
                  </div>
                )}
                {canEdit && !specOpen && (
                  <div className="rq-letter-hint">You can change the specification file until the registrar approves this procurement.</div>
                )}
              </div>
              {attachments.map(([label, kind, name]) => (
                <div key={label} className="rq-justification">
                  <div className="rq-detail-label">{label}</div>
                  <AttachmentButton name={name} onPreview={() => onOpenFile(kind)} />
                </div>
              ))}

              {mode === 'cancel' && (
                <div className="rq-cancel-box">
                  <div className="rq-cancel-title">Cancel this procurement?</div>
                  <p>
                    {proc.status === 'Approved'
                      ? 'The registrar has approved it; cancelling tells the procurement officer not to issue a purchase order.'
                      : 'The registrar will be notified that it no longer needs approval.'}
                  </p>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Reason (optional)"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                  <div className="rq-actions">
                    <button className="btn-secondary" onClick={() => setMode('view')} disabled={saving}>Keep Procurement</button>
                    <button className="btn-danger" onClick={handleCancel} disabled={saving}>
                      {saving ? 'Cancelling...' : 'Confirm Cancel'}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'view' && !specOpen && (canEdit || canCancel) && (
                <div className="rq-actions">
                  {canCancel && (
                    <button className="btn-danger" onClick={() => setMode('cancel')}>Cancel Procurement</button>
                  )}
                  {canEdit && (
                    <button className="btn-secondary" onClick={startEdit}>Edit Procurement</button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
