import React, { useMemo, useEffect } from 'react';

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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          width: 'min(900px, 100%)',
          height: 'min(85vh, 900px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.1rem',
            borderBottom: '1px solid #e2e8f0'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.95rem', color: '#0f172a' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: '#2563eb' }}>description</span>
            {file.name || 'Attached File'}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {href && (
              <a
                className="btn-secondary"
                href={href}
                download={file.name || 'download'}
                style={{ textDecoration: 'none', fontSize: '0.8rem', padding: '0.35rem 0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>download</span>
                Download
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              title="Close"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                fontSize: '1.25rem',
                padding: '0.2rem 0.5rem',
                borderRadius: '6px'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          {!file.dataUrl ? (
            <p style={{ color: '#64748b' }}>File content is not available for preview.</p>
          ) : isImage ? (
            <img src={file.dataUrl} alt={file.name} style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '8px', objectFit: 'contain' }} />
          ) : isPdf && blobUrl ? (
            <iframe title={file.name} src={blobUrl} style={{ width: '100%', height: '70vh', border: 'none', borderRadius: '8px' }} />
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#94a3b8' }}>draft</span>
              <p style={{ marginTop: '0.5rem' }}>Preview is not supported for this file type. Use Download to view it.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
