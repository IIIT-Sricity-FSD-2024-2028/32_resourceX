import React, { useEffect } from 'react';
import StageTracker, { ReasonCallout, formatStamp, skipStagesFrom } from '../../../common/StageTracker';

// Completed maintenance / decided extensions stay on the page this long so the outcome is visible
const RECENT_MS = 7 * 24 * 60 * 60 * 1000;
const isRecent = (iso) => {
  const t = iso ? Date.parse(iso) : NaN;
  return !isNaN(t) && Date.now() - t < RECENT_MS;
};

const ACTIVE_MAINTENANCE = ['Maintenance Requested', 'Maintenance', 'Repaired'];

export const hasMaintenanceTracking = (res) =>
  ACTIVE_MAINTENANCE.includes(res.status) ||
  (res.status === 'Scrapped' && res.maintenanceOutcome === 'Scrapped') ||
  (res.status === 'Allocated' && isRecent(res.maintenanceConfirmedAt));

export const hasExtensionTracking = (res) =>
  res.extensionStatus === 'Pending' ||
  ((res.extensionStatus === 'Approved' || res.extensionStatus === 'Rejected') && isRecent(res.extensionDecidedAt));

export const hasReturnTracking = (res) => res.status === 'Returned';

/** Whether clicking this allocated-assets row has any tracking card to show. */
export const hasServiceTracking = (res) =>
  hasMaintenanceTracking(res) || hasExtensionTracking(res) || hasReturnTracking(res);

/** Return-history entries for returns the inventory officer accepted recently. */
export const recentCompletedReturns = (history) =>
  (history || []).filter((h) => isRecent(h.processedAt || h.processDate));

function maintenanceStages(res) {
  const stages = [
    { key: 'requested', label: 'Requested', icon: 'build', state: 'done',
      time: formatStamp(res.maintenanceRequestedAt) || res.maintenanceRequestDate, note: `Priority: ${res.maintenancePriority || 'Medium'}` },
    { key: 'accepted', label: 'Accepted by Maintenance', icon: 'engineering', state: 'upcoming',
      time: formatStamp(res.maintenanceAcceptedAt), note: res.maintenanceAcceptedBy ? `By ${res.maintenanceAcceptedBy}` : undefined },
    { key: 'resolved', label: 'Repaired', icon: 'handyman', state: 'upcoming', time: formatStamp(res.maintenanceResolvedAt) },
    { key: 'confirmed', label: 'Back With You', icon: 'assignment_turned_in', state: 'upcoming', time: formatStamp(res.maintenanceConfirmedAt) },
  ];
  const [, accepted, resolved, confirmed] = stages;

  if (res.status === 'Maintenance Requested') {
    accepted.state = 'current';
    accepted.note = 'Waiting for the maintenance officer';
  } else if (res.status === 'Maintenance') {
    accepted.state = 'done';
    resolved.state = 'current';
    resolved.note = 'Repair in progress';
  } else if (res.status === 'Repaired') {
    accepted.state = 'done';
    resolved.state = 'done';
    confirmed.state = 'current';
    confirmed.note = 'Confirm you have received it back';
  } else if (res.status === 'Scrapped') {
    accepted.state = 'done';
    resolved.label = 'Scrapped';
    resolved.state = 'rejected';
    resolved.note = 'Beyond economical repair';
    skipStagesFrom(stages, 3);
  } else {
    accepted.state = 'done';
    resolved.state = 'done';
    confirmed.state = 'done';
  }
  return stages;
}

function extensionStages(res) {
  const stages = [
    { key: 'submitted', label: 'Submitted', icon: 'update', state: 'done',
      time: formatStamp(res.extensionRequestedAt) || res.extensionRequestDate,
      note: `Until ${res.extensionProposedReturnDateDisplay || res.extensionProposedReturnDate}` },
    { key: 'review', label: 'Dept Head Review', icon: 'rate_review', state: 'current', note: 'Awaiting decision' },
    { key: 'decision', label: 'Decision', icon: 'gavel', state: 'upcoming' },
  ];
  const [, review, decision] = stages;

  if (res.extensionStatus === 'Approved' || res.extensionStatus === 'Rejected') {
    review.state = 'done';
    review.note = res.extensionDecidedBy ? `By ${res.extensionDecidedBy}` : undefined;
    decision.time = formatStamp(res.extensionDecidedAt);
    if (res.extensionStatus === 'Approved') {
      decision.label = 'Approved';
      decision.state = 'done';
      decision.note = `New deadline: ${res.returnDateDisplay || res.returnDate}`;
    } else {
      decision.label = 'Rejected';
      decision.state = 'rejected';
      decision.note = `Deadline stays ${res.returnDateDisplay || res.returnDate}`;
    }
  }
  return stages;
}

const RETURN_DESTINATION = {
  Available: 'Restocked to inventory',
  'Maintenance Requested': 'Sent to maintenance',
  Maintenance: 'Sent to maintenance',
  Scrapped: 'Scrapped after inspection',
};

// `entry` is the return-history record once the inventory officer has processed the return
function returnStages(res, entry) {
  const stages = [
    { key: 'requested', label: 'Return Requested', icon: 'assignment_return', state: 'done',
      time: formatStamp(res?.returnRequestedAt || entry?.requestedAt) || entry?.returnDate,
      note: `Reason: ${res?.returnReason || entry?.returnReason || '—'}` },
    { key: 'inspection', label: 'Inventory Inspection', icon: 'fact_check', state: 'current',
      note: 'Waiting for the inventory officer to inspect' },
    { key: 'completed', label: 'Return Successful', icon: 'task_alt', state: 'upcoming' },
  ];
  if (entry) {
    const [, inspection, completed] = stages;
    inspection.state = 'done';
    inspection.note = `Condition: ${entry.condition}${entry.processedBy ? ` · By ${entry.processedBy}` : ''}`;
    completed.state = 'done';
    completed.time = formatStamp(entry.processedAt) || entry.processDate;
    completed.note = RETURN_DESTINATION[entry.finalStatus] || entry.finalStatus;
  }
  return stages;
}

const STATUS_PILL = {
  'Maintenance Requested': { label: 'Awaiting Acceptance', bg: '#fef3c7', color: '#92400e' },
  Maintenance: { label: 'In Repair', bg: '#ffedd5', color: '#9a3412' },
  Repaired: { label: 'Repaired — Confirm', bg: '#dcfce7', color: '#166534' },
  Scrapped: { label: 'Scrapped', bg: '#fee2e2', color: '#991b1b' },
  Allocated: { label: 'Completed', bg: '#e0e7ff', color: '#3730a3' },
  Pending: { label: 'Under Review', bg: '#dbeafe', color: '#1e40af' },
  Approved: { label: 'Approved', bg: '#dcfce7', color: '#166534' },
  Rejected: { label: 'Rejected', bg: '#fee2e2', color: '#991b1b' },
  Returned: { label: 'Awaiting Inspection', bg: '#ede9fe', color: '#5b21b6' },
  ReturnDone: { label: 'Return Successful', bg: '#dcfce7', color: '#166534' },
};

function TrackingCard({ icon, iconColor, eyebrow, res, pill, children }) {
  return (
    <div data-row-id={res.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1rem 1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 26, color: iconColor }}>{icon}</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#64748b' }}>{eyebrow}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
              {res.name || res.type} <span style={{ color: '#64748b', fontWeight: 500, fontSize: 13 }}>· {res.id}</span>
            </div>
          </div>
        </div>
        {pill && (
          <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: pill.bg, color: pill.color }}>{pill.label}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function MaintenanceCard({ res, onConfirmRepaired, actionLoadingId }) {
  return (
    <TrackingCard res={res} icon="build" iconColor="#d97706" eyebrow="Maintenance Request" pill={STATUS_PILL[res.status]}>
      <StageTracker stages={maintenanceStages(res)} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap', marginTop: '0.75rem' }}>
        <div style={{ fontSize: 13, color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div><strong>Issue:</strong> {res.maintenanceIssue || '—'}</div>
          {(res.maintenanceOutcome || res.status === 'Maintenance') && res.maintenanceNotes && (
            <div><strong>Maintenance notes:</strong> {res.maintenanceNotes}</div>
          )}
        </div>
        {res.status === 'Repaired' && onConfirmRepaired && (
          <button
            className="btn-primary"
            style={{ fontSize: '0.8rem' }}
            disabled={actionLoadingId === res.id}
            onClick={() => onConfirmRepaired(res.id)}
          >
            {actionLoadingId === res.id ? 'Confirming...' : 'Confirm Received'}
          </button>
        )}
      </div>
    </TrackingCard>
  );
}

function ExtensionCard({ res }) {
  return (
    <TrackingCard res={res} icon="update" iconColor="#2563eb" eyebrow="Deadline Extension Request" pill={STATUS_PILL[res.extensionStatus]}>
      <StageTracker stages={extensionStages(res)} />
      <div style={{ fontSize: 13, color: '#475569', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div><strong>Justification:</strong> {res.extensionReason || '—'}</div>
        {res.extensionStatus === 'Approved' && res.extensionPreviousReturnDateDisplay && (
          <div>
            <strong>Deadline:</strong> {res.extensionPreviousReturnDateDisplay} → {res.returnDateDisplay || res.returnDate}
          </div>
        )}
      </div>
      {res.extensionStatus === 'Rejected' && (
        <ReasonCallout tone="rejected" title="Rejection reason" reason={res.extensionRejectionReason || 'No reason was recorded.'} />
      )}
    </TrackingCard>
  );
}

function ReturnCard({ res, entry }) {
  const shown = res || { id: entry.code, type: entry.type };
  const notes = res?.returnNotes || entry?.notes;
  return (
    <TrackingCard res={shown} icon="assignment_return" iconColor="#7c3aed" eyebrow="Return Request" pill={entry ? STATUS_PILL.ReturnDone : STATUS_PILL.Returned}>
      <StageTracker stages={returnStages(res, entry)} />
      {notes && (
        <div style={{ fontSize: 13, color: '#475569', marginTop: '0.75rem' }}>
          <strong>Return notes:</strong> {notes}
        </div>
      )}
    </TrackingCard>
  );
}

/**
 * Modal with the tracking cards (maintenance, extension, return) for one allocated asset,
 * opened by clicking its row — mirrors the resource request tracking modal.
 */
export function ServiceTrackingModal({ resource, onClose, onConfirmRepaired, actionLoadingId }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!resource) return null;
  return (
    <div className="rq-modal-backdrop" onClick={onClose}>
      <div className="rq-modal" role="dialog" aria-modal="true" aria-labelledby="svc-modal-title" onClick={(e) => e.stopPropagation()}>
        <div className="rq-modal-header">
          <div>
            <div className="rq-modal-eyebrow">Asset Tracking</div>
            <h2 id="svc-modal-title" className="rq-modal-title">
              {resource.id}
              <span style={{ fontSize: 14, fontWeight: 500, color: '#64748b' }}>{resource.name || resource.type}</span>
            </h2>
          </div>
          <button className="btn-close" aria-label="Close" onClick={onClose} />
        </div>
        <div className="rq-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {hasReturnTracking(resource) && <ReturnCard res={resource} />}
          {hasMaintenanceTracking(resource) && (
            <MaintenanceCard res={resource} onConfirmRepaired={onConfirmRepaired} actionLoadingId={actionLoadingId} />
          )}
          {hasExtensionTracking(resource) && <ExtensionCard res={resource} />}
        </div>
      </div>
    </div>
  );
}

/**
 * Recent outcomes for assets that have left the allocated-assets table:
 * resources scrapped by maintenance and returns the inventory officer accepted.
 */
export default function RecentServiceUpdates({ scrapped, completedReturns }) {
  if (scrapped.length === 0 && completedReturns.length === 0) return null;

  return (
    <div className="data-section">
      <div className="data-section-header">
        <div className="data-section-title">Recently Completed</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.25rem 0 0.5rem' }}>
        {completedReturns.map((entry) => (
          <ReturnCard key={`ret-${entry.code}-${entry.processedAt || entry.processDate}`} entry={entry} />
        ))}
        {scrapped.map((res) => (
          <MaintenanceCard key={`maint-${res.id}`} res={res} />
        ))}
      </div>
    </div>
  );
}
