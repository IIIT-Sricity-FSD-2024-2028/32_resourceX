import React from 'react';
import { openDataUrlFile } from '../../../services/deptHead';

/**
 * Clickable file name that previews an inline data-URL attachment in a new tab.
 * Renders a dash when no file is attached.
 */
export default function FileLink({ name, dataUrl }) {
  if (!name) {
    return <span style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>—</span>;
  }

  return (
    <button
      type="button"
      className="spec-file-link"
      title={dataUrl ? `Preview ${name}` : name}
      onClick={() => openDataUrlFile(dataUrl)}
      disabled={!dataUrl}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>visibility</span>
      <span>{name}</span>
    </button>
  );
}
