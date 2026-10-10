import React from 'react';

/** Pad quantities like the original page (1 -> "01") */
export const padQty = (q) => String(q ?? 0).padStart(2, '0');

/** Classify resource status into dashboard buckets (same rules as dept_head.js) */
export const bucketOf = (status) => {
  if (status === 'Available') return 'available';
  if (status === 'Allocated') return 'allocated';
  if (status === 'Scrapped') return 'scrap';
  return 'maintenance';
};

export const countBuckets = (resources = []) => {
  const c = { available: 0, allocated: 0, maintenance: 0, scrap: 0 };
  resources.forEach((r) => {
    c[bucketOf(r.status)]++;
  });
  return c;
};

/** Stock status rule (same as dept_head.js / analytics.service.ts) */
export const stockStatusOf = (current, threshold) => {
  if (current >= threshold) return 'Safe';
  if (current >= threshold * 0.7) return 'Near Threshold';
  return 'Low Stock';
};

const BADGE_STYLES = {
  Available: { background: '#dcfce7', color: '#166534' },
  Allocated: { background: 'var(--status-allocated)', color: 'var(--status-allocated-text)' },
  Approved: { background: '#dcfce7', color: '#166534' },
  Completed: { background: '#dcfce7', color: '#166534' },
  Registered: { background: '#dbeafe', color: '#1e40af' },
  Fulfilled: { background: '#e0e7ff', color: '#3730a3' },
  Pending: { background: 'var(--status-pending)', color: 'var(--status-pending-text)' },
  'Pending Approval': { background: 'var(--status-pending)', color: 'var(--status-pending-text)' },
  Maintenance: { background: 'var(--status-pending)', color: 'var(--status-pending-text)' },
  'Maintenance Requested': { background: 'var(--status-pending)', color: 'var(--status-pending-text)' },
  Repaired: { background: '#e0f2fe', color: '#075985' },
  Returned: { background: '#e2e8f0', color: '#475569' },
  Rejected: { background: 'var(--status-rejected)', color: 'var(--status-rejected-text)' },
  Scrapped: { background: 'var(--status-rejected)', color: 'var(--status-rejected-text)' }
};

export function StatusBadge({ status }) {
  const style = BADGE_STYLES[status] || { background: '#e2e8f0', color: '#475569' };
  return (
    <span className="badge" style={style}>
      {status || '—'}
    </span>
  );
}

export function StockBadge({ status }) {
  const cls =
    status === 'Safe' ? 'badge-stock-safe' : status === 'Near Threshold' ? 'badge-stock-near' : 'badge-stock-low';
  return <span className={`badge ${cls}`}>{status}</span>;
}

/** Clickable spec / invoice file link (or a dash when absent) */
export function FileLink({ name, onClick }) {
  if (!name) return <span style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>—</span>;
  return (
    <a
      href="#"
      className="spec-file-link"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>visibility</span>
      {name}
    </a>
  );
}

/** Empty-row helper for tables */
export function EmptyRow({ colSpan, text }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>
        {text}
      </td>
    </tr>
  );
}

export function LoadingBlock({ text = 'Loading...' }) {
  return <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>{text}</div>;
}

export function ErrorBlock({ text, onRetry }) {
  return (
    <div style={{ padding: '3rem', textAlign: 'center', color: '#ef4444' }}>
      <div style={{ marginBottom: '1rem' }}>{text}</div>
      {onRetry && (
        <button type="button" className="btn-secondary" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

/** Safe date parse for strings like "May 4, 2026" or "5/4/2026" */
export const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};
