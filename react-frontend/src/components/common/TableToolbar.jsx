import React from 'react';

/**
 * Search box plus optional dropdown filters shown above a table.
 *
 * Props:
 *   - search, onSearchChange: controlled search text
 *   - placeholder: search box placeholder
 *   - filters: [{ value, onChange, label, options: [string | { value, label }] }]
 *       `label` is the "all" option text, e.g. "All Statuses" (value 'All')
 *   - resultCount, totalCount: optional "Showing x of y" text
 *   - standalone: draw its own box, for lists that are not inside a .data-section card
 */
export default function TableToolbar({
  search,
  onSearchChange,
  placeholder = 'Search...',
  filters = [],
  resultCount,
  totalCount,
  standalone = false,
}) {
  const isFiltered = search.trim() !== '' || filters.some((f) => f.value !== 'All');

  const clearAll = () => {
    onSearchChange('');
    filters.forEach((f) => f.onChange('All'));
  };

  return (
    <div className={`table-toolbar${standalone ? ' table-toolbar-standalone' : ''}`}>
      <div className="table-toolbar-search">
        <span className="material-symbols-outlined">search</span>
        <input
          type="text"
          className="form-control"
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      {filters.map((f) => (
        <select
          key={f.label}
          className="form-control table-toolbar-select"
          value={f.value}
          onChange={(e) => f.onChange(e.target.value)}
        >
          <option value="All">{f.label}</option>
          {f.options.map((opt) => {
            const value = typeof opt === 'string' ? opt : opt.value;
            const label = typeof opt === 'string' ? opt : opt.label;
            return <option key={value} value={value}>{label}</option>;
          })}
        </select>
      ))}
      {isFiltered && (
        <button type="button" className="table-toolbar-clear" onClick={clearAll}>
          Clear
        </button>
      )}
      {isFiltered && totalCount !== undefined && (
        <span className="table-toolbar-count">Showing {resultCount} of {totalCount}</span>
      )}
    </div>
  );
}

/** True when any of the given values contains the query (case-insensitive). */
export function matchesSearch(query, ...values) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  return values.some((v) => v !== undefined && v !== null && String(v).toLowerCase().includes(q));
}

/** Sorted, de-duplicated, non-empty values of `key` across rows, for dropdown options. */
export function uniqueOptions(rows, key) {
  const get = typeof key === 'function' ? key : (r) => r[key];
  return [...new Set(rows.map(get).filter((v) => v !== undefined && v !== null && v !== ''))].sort();
}
