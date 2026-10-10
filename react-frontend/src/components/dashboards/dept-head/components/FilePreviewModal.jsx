import React, { useEffect, useMemo } from 'react';

/**
 * Preview for procurement spec / invoice attachments (replaces Store.openFilePreview).
 * The backend returns files inline as data URLs; PDFs are rendered through a Blob URL
 * because browsers block top-level/iframe navigation to large data: URLs.
 */
function dataUrlToBlobUrl(dataUrl) {
  try {
    const [meta, b64] = dataUrl.split(',');
    const mime = (meta.match(/data:(.*?);base64/) || [])[1] || 'application/octet-stream';
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type: mime }));
  } catch {
    return null;
  }
}

export default function FilePreviewModal({ file, onClose }) {
  const blobUrl = useMemo(() => (file?.dataUrl ? dataUrlToBlobUrl(file.dataUrl) : null), [file]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  if (!file) return null;

  const type = (file.type || '').toLowerCase();
  const isImage = type.startsWith('image/');
  const isPdf = type === 'application/pdf';
  const href = blobUrl || file.dataUrl;

  return (
    <div className="modal-overlay dh-fp-overlay" onClick={onClose}>
      <div className="dh-fp-content" onClick={(e) => e.stopPropagation()}>
        <div className="dh-fp-header">
          <div className="dh-fp-title">
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>description</span>
            {file.name || 'Attached File'}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {href && (
              <a className="btn-secondary" href={href} download={file.name || 'download'} style={{ textDecoration: 'none', fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>download</span>
                Download
              </a>
            )}
            <button type="button" className="stock-modal-close" onClick={onClose} title="Close">&#x2715;</button>
          </div>
        </div>
        <div className="dh-fp-body">
          {!file.dataUrl ? (
            <p style={{ color: '#64748b' }}>File content is not available for preview.</p>
          ) : isImage ? (
            <img src={file.dataUrl} alt={file.name} style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '8px' }} />
          ) : isPdf && blobUrl ? (
            <iframe title={file.name} src={blobUrl} style={{ width: '100%', height: '70vh', border: 'none', borderRadius: '8px' }} />
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#94a3b8' }}>draft</span>
              <p style={{ marginTop: '0.5rem' }}>Preview is not supported for this file type. Use Download to open it.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
