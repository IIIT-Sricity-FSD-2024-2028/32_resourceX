import React from 'react';

/**
 * Full-width table row shown while loading or when a table has no rows.
 */
export default function EmptyRow({ colSpan, isLoading, message = 'No records found.' }) {
  return (
    <tr className="dh-empty-row">
      <td colSpan={colSpan}>{isLoading ? 'Loading…' : message}</td>
    </tr>
  );
}
