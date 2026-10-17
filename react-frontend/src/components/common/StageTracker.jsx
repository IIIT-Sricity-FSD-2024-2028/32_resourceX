import React from 'react';
import './StageTracker.css';

export const toYmd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Parse YYYY-MM-DD as a local date so the display never shifts a day
export const formatYmd = (ymd) => {
  if (!ymd) return undefined;
  const [y, m, d] = ymd.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatStamp = (value) => {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) return value;
  return new Date(value).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
  });
};

// Marks every stage from `from` onwards as not reached
export const skipStagesFrom = (stages, from) => stages.slice(from).forEach((s) => { s.state = 'skipped'; });

const STAGE_ICON = { done: 'check', rejected: 'close', cancelled: 'block' };

/**
 * Horizontal stage tracker.
 * Each stage: { key, label, icon, state, note?, time? } where state is one of
 * done | current | rejected | cancelled | upcoming | skipped.
 */
export default function StageTracker({ stages }) {
  return (
    <ol className="rq-stages" style={{ gridTemplateColumns: `repeat(${stages.length}, 1fr)` }}>
      {stages.map((s) => (
        <li key={s.key} className={`rq-stage ${s.state}`}>
          <div className="rq-stage-marker">
            <span className="material-symbols-outlined">{STAGE_ICON[s.state] || s.icon}</span>
          </div>
          <div className="rq-stage-text">
            <div className="rq-stage-label">
              {s.label}
              {s.state === 'current' && <span className="rq-stage-pill">In progress</span>}
            </div>
            {s.state !== 'skipped' && s.note && <div className="rq-stage-note">{s.note}</div>}
            {s.time && s.state !== 'skipped' && <div className="rq-stage-time">{s.time}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Highlighted callout for a rejection or cancellation reason. */
export function ReasonCallout({ tone, title, reason }) {
  if (!reason) return null;
  return (
    <div className={`rq-reason ${tone}`}>
      <span className="material-symbols-outlined">{tone === 'rejected' ? 'report' : 'info'}</span>
      <div>
        <div className="rq-reason-title">{title}</div>
        <p>{reason}</p>
      </div>
    </div>
  );
}

/** Button that opens an attached file in the preview modal. */
export function AttachmentButton({ name, type, dataUrl, onPreview }) {
  if (!name) return null;
  return (
    <button
      type="button"
      className="spec-file-link"
      onClick={() => onPreview?.({ name, type: type || 'application/pdf', dataUrl })}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>visibility</span>
      {name}
    </button>
  );
}
