import React, { useEffect, useState } from 'react';
import { editRequest, cancelRequest, fetchResourceCatalog } from '../../../../services/requestor';
import DocumentUpload from '../../../common/DocumentUpload';
import StageTracker, { AttachmentButton, ReasonCallout, formatStamp, formatYmd, skipStagesFrom, toYmd } from '../../../common/StageTracker';

const MIN_LEAD_DAYS = 2;

// Each stage is one of: done | current | rejected | cancelled | upcoming | skipped
function buildStages(req) {
  const stages = [
    { key: 'submitted', label: 'Request Submitted', icon: 'send', state: 'done',
      time: formatStamp(req.createdAt) || req.date, note: `By ${req.requestor}` },
    { key: 'review', label: 'Dept Head Approval', icon: 'how_to_reg', state: 'upcoming',
      note: 'Awaiting department head review' },
    { key: 'allocation', label: 'Inventory Allocation', icon: 'inventory_2', state: 'upcoming',
      note: 'Inventory officer assigns resources' },
    { key: 'received', label: 'Resource Received', icon: 'task_alt', state: 'upcoming',
      note: 'Confirm once you have the resource' },
  ];
  const [, review, allocation, received] = stages;
  const approvedNote = () => {
    review.state = 'done';
    review.time = formatStamp(req.approvedAt);
    review.note = req.approvedBy ? `Approved by ${req.approvedBy}` : 'Approved';
  };
  const allocatedNote = () => {
    allocation.state = 'done';
    allocation.time = formatStamp(req.allocatedAt);
    allocation.note = req.allocatedBy ? `Allocated by ${req.allocatedBy}` : 'Resources allocated';
  };
  const skipRest = (from) => skipStagesFrom(stages, from);

  switch (req.status) {
    case 'Pending':
      review.state = 'current';
      break;
    case 'Approved':
      approvedNote();
      allocation.state = 'current';
      allocation.note = 'Waiting for the inventory officer to allocate';
      break;
    case 'Allocated':
      approvedNote();
      allocatedNote();
      received.state = 'current';
      received.note = 'Ready for pickup — confirm when received';
      break;
    case 'Completed':
      approvedNote();
      allocatedNote();
      received.state = 'done';
      received.time = formatStamp(req.receivedAt);
      received.note = 'Receipt confirmed';
      break;
    case 'Rejected':
      review.state = 'rejected';
      review.label = 'Rejected by Dept Head';
      review.time = formatStamp(req.rejectedAt);
      // The full reason is shown in the callout under the tracker
      review.note = req.rejectedBy ? `Rejected by ${req.rejectedBy}` : 'The department head rejected this request';
      skipRest(2);
      break;
    case 'Cancelled': {
      const target = req.approvedAt ? allocation : review;
      if (req.approvedAt) approvedNote();
      target.state = 'cancelled';
      target.label = 'Cancelled by You';
      target.time = formatStamp(req.cancelledAt);
      target.note = req.cancelReason ? `Reason: ${req.cancelReason}` : 'You cancelled this request';
      skipRest(stages.indexOf(target) + 1);
      break;
    }
    default:
      break;
  }
  return stages;
}

export default function RequestDetailModal({ request, onClose, onChanged, onConfirmReceipt, receiptLoading, addToast, onPreviewFile }) {
  const [mode, setMode] = useState('view'); // view | edit | cancel
  const [saving, setSaving] = useState(false);
  const [resourceTypes, setResourceTypes] = useState([]);
  const [form, setForm] = useState({});
  const [cancelReason, setCancelReason] = useState('');
  const [newLetter, setNewLetter] = useState(null);
  const [letterOpen, setLetterOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Leave edit / cancel mode if the request moved on (e.g. after saving)
  useEffect(() => { setMode('view'); setLetterOpen(false); }, [request?.status]);

  if (!request) return null;

  const canEdit = request.status === 'Pending';
  const canCancel = request.status === 'Pending' || request.status === 'Approved';
  const canReceive = request.status === 'Allocated';
  const stages = buildStages(request);

  const earliest = new Date();
  earliest.setDate(earliest.getDate() + MIN_LEAD_DAYS);
  const minRequirement = toYmd(earliest);

  const startEdit = async () => {
    setForm({
      resourceType: request.resourceType,
      quantity: request.quantity,
      priority: request.priority || 'Normal',
      requirementDate: request.requirementDate?.slice(0, 10) || '',
      returnDate: request.returnDate?.slice(0, 10) || '',
      justification: request.justification || '',
    });
    setNewLetter(null);
    setMode('edit');
    try {
      const catalog = await fetchResourceCatalog();
      const entry = (catalog || []).find((c) => c.department === request.department);
      setResourceTypes(entry?.resourceTypes || []);
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
    if (form.requirementDate && form.requirementDate !== request.requirementDate?.slice(0, 10) && form.requirementDate < minRequirement) {
      addToast(`Requirement date must be ${formatYmd(minRequirement)} or later.`, 'error');
      return;
    }
    if (form.requirementDate && form.returnDate && form.returnDate <= form.requirementDate) {
      addToast('Return date must be after the requirement date.', 'error');
      return;
    }
    setSaving(true);
    try {
      await editRequest(request.id, {
        resourceType: form.resourceType,
        quantity,
        priority: form.priority,
        justification: form.justification.trim(),
        ...(form.requirementDate && {
          requirementDate: form.requirementDate,
          requirementDateDisplay: formatYmd(form.requirementDate),
        }),
        ...(form.returnDate && {
          returnDate: form.returnDate,
          returnDateDisplay: formatYmd(form.returnDate),
        }),
        ...(newLetter && {
          letterFileName: newLetter.documentFileName,
          letterFileType: newLetter.documentFileType,
          letterFileDataUrl: newLetter.documentFileDataUrl,
        }),
      });
      addToast('Request updated.', 'success');
      setMode('view');
      await onChanged();
    } catch (err) {
      addToast(err.message || 'Failed to update request.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Upload or replace just the letter, without opening the full edit form
  const handleSaveLetter = async () => {
    if (!newLetter) {
      addToast('Choose a file to upload first.', 'error');
      return;
    }
    setSaving(true);
    try {
      await editRequest(request.id, {
        letterFileName: newLetter.documentFileName,
        letterFileType: newLetter.documentFileType,
        letterFileDataUrl: newLetter.documentFileDataUrl,
      });
      addToast('Request letter updated.', 'success');
      setLetterOpen(false);
      setNewLetter(null);
      await onChanged();
    } catch (err) {
      addToast(err.message || 'Failed to update the request letter.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    setSaving(true);
    try {
      await cancelRequest(request.id, cancelReason.trim() || undefined);
      addToast('Request cancelled.', 'success');
      setCancelReason('');
      await onChanged();
    } catch (err) {
      addToast(err.message || 'Failed to cancel request.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const typeOptions = [...new Set([request.resourceType, ...resourceTypes].filter(Boolean))];

  const details = [
    ['Department', request.department],
    ['Resource Type', request.resourceType],
    ['Quantity', String(request.quantity).padStart(2, '0')],
    ['Priority', request.priority || 'Normal'],
    ['Requested On', request.date],
    ['Required By', request.requirementDateDisplay || formatYmd(request.requirementDate)],
    ['Return By', request.returnDateDisplay || formatYmd(request.returnDate)],
    ['Assigned Resources', request.assignedResources],
  ].filter(([, v]) => v);

  return (
    <div className="rq-modal-backdrop" onClick={onClose}>
      <div className="rq-modal" role="dialog" aria-modal="true" aria-labelledby="rq-modal-title" onClick={(e) => e.stopPropagation()}>
        <div className="rq-modal-header">
          <div>
            <div className="rq-modal-eyebrow">Request Tracking</div>
            <h2 id="rq-modal-title" className="rq-modal-title">
              {request.id}
              <span className={`badge ${request.status.toLowerCase()}`}>{request.status}</span>
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
                  <span className="form-label">Required By</span>
                  <input className="form-control" type="date" min={minRequirement} value={form.requirementDate} onChange={setField('requirementDate')} />
                </label>
                <label className="form-group">
                  <span className="form-label">Return By</span>
                  <input className="form-control" type="date" min={form.requirementDate || minRequirement} value={form.returnDate} onChange={setField('returnDate')} />
                </label>
              </div>
              <label className="form-group">
                <span className="form-label">Justification</span>
                <textarea className="form-control" rows="3" value={form.justification} onChange={setField('justification')} />
              </label>
              <DocumentUpload
                label={request.letterFileName ? 'Replace Request Letter / Proof (optional)' : 'Request Letter / Proof (optional)'}
                onChange={setNewLetter}
                hint={request.letterFileName ? `Current: ${request.letterFileName}. PDF, PNG or JPG, up to 5 MB.` : undefined}
              />
              <div className="rq-actions">
                <button type="button" className="btn-secondary" onClick={() => setMode('view')} disabled={saving}>Discard</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          ) : (
            <>
              {request.status === 'Rejected' && (
                <ReasonCallout tone="rejected" title="Rejection reason" reason={request.rejectionReason || 'No reason was recorded.'} />
              )}
              {request.status === 'Cancelled' && (
                <ReasonCallout tone="cancelled" title="Cancellation reason" reason={request.cancelReason} />
              )}
              <dl className="rq-details">
                {details.map(([label, value]) => (
                  <div key={label} className="rq-detail">
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              {request.justification && (
                <div className="rq-justification">
                  <div className="rq-detail-label">Justification</div>
                  <p>{request.justification}</p>
                </div>
              )}
              <div className="rq-letter">
                <div className="rq-letter-row">
                  <div>
                    <div className="rq-detail-label">Request Letter / Proof</div>
                    {request.letterFileName ? (
                      <AttachmentButton
                        name={request.letterFileName}
                        type={request.letterFileType}
                        dataUrl={request.letterFileDataUrl}
                        onPreview={onPreviewFile}
                      />
                    ) : (
                      <div className="rq-letter-empty">No letter attached</div>
                    )}
                  </div>
                  {canEdit && mode === 'view' && !letterOpen && (
                    <button
                      type="button"
                      className="btn-secondary rq-letter-btn"
                      onClick={() => { setNewLetter(null); setLetterOpen(true); }}
                    >
                      <span className="material-symbols-outlined">upload_file</span>
                      {request.letterFileName ? 'Replace' : 'Upload'}
                    </button>
                  )}
                </div>
                {letterOpen && (
                  <div className="rq-letter-upload">
                    <DocumentUpload label="New letter / proof" onChange={setNewLetter} />
                    <div className="rq-actions">
                      <button type="button" className="btn-secondary" onClick={() => setLetterOpen(false)} disabled={saving}>Discard</button>
                      <button type="button" className="btn-primary" onClick={handleSaveLetter} disabled={saving || !newLetter}>
                        {saving ? 'Saving...' : 'Save Letter'}
                      </button>
                    </div>
                  </div>
                )}
                {canEdit && !letterOpen && (
                  <div className="rq-letter-hint">You can change the letter until your department head reviews the request.</div>
                )}
              </div>

              {mode === 'cancel' && (
                <div className="rq-cancel-box">
                  <div className="rq-cancel-title">Cancel this request?</div>
                  <p>
                    {request.status === 'Approved'
                      ? 'It has been approved by your department head; cancelling removes it from the allocation queue.'
                      : 'Your department head will be notified that you no longer need it.'}
                  </p>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Reason (optional)"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                  <div className="rq-actions">
                    <button className="btn-secondary" onClick={() => setMode('view')} disabled={saving}>Keep Request</button>
                    <button className="btn-danger" onClick={handleCancel} disabled={saving}>
                      {saving ? 'Cancelling...' : 'Confirm Cancel'}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'view' && !letterOpen && (canEdit || canCancel || canReceive) && (
                <div className="rq-actions">
                  {canCancel && (
                    <button className="btn-danger" onClick={() => setMode('cancel')}>Cancel Request</button>
                  )}
                  {canEdit && (
                    <button className="btn-secondary" onClick={startEdit}>Edit Request</button>
                  )}
                  {canReceive && (
                    <button className="btn-primary" disabled={receiptLoading} onClick={() => onConfirmReceipt(request.id)}>
                      {receiptLoading ? 'Confirming...' : 'I Received'}
                    </button>
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
