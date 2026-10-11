import React, { useEffect, useMemo } from 'react';

/**
 * Preview modal for invoice attachments attached to purchases/inventory items.
 * Renders data URLs directly, converting PDFs to blob URLs to avoid browser navigation blocks.
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
    <div className="staff-fp-overlay" onClick={onClose}>
      <div className="staff-fp-content" onClick={(e) => e.stopPropagation()}>
        <div className="staff-fp-header">
          <div className="staff-fp-title">
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>description</span>
            {file.name || 'Invoice File'}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {href && (
              <a
                className="btn-secondary"
                href={href}
                download={file.name || 'invoice-download'}
                style={{ textDecoration: 'none', fontSize: '0.8rem', padding: '0.35rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>download</span>
                Download
              </a>
            )}
            <button type="button" className="stock-modal-close" onClick={onClose} title="Close">&#x2715;</button>
          </div>
        </div>
        <div className="staff-fp-body">
          {!file.dataUrl ? (
            <p style={{ color: '#64748b' }}>File content is not available for preview.</p>
          ) : isImage ? (
            <img src={file.dataUrl} alt={file.name} style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '8px' }} />
          ) : isPdf && blobUrl ? (
            <iframe src={blobUrl} title={file.name} style={{ width: '100%', height: '70vh', border: 'none', borderRadius: '8px' }} />
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>attachment</span>
              <p style={{ margin: '0 0 1rem 0', fontWeight: 500 }}>{file.name}</p>
              {href && (
                <a className="btn-primary" href={href} download={file.name} style={{ textDecoration: 'none', fontSize: '0.85rem' }}>
                  Download File
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
