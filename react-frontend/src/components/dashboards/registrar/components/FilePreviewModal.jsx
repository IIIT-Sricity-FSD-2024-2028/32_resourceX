import React, { useEffect, useMemo } from 'react';

/**
 * Converts a base64 Data URL to a Blob URL so the browser can display PDFs and images
 * without triggering security blocks.
 */
function dataUrlToBlobUrl(dataUrl) {
  try {
    const [meta, b64] = dataUrl.split(',');
    const mime = (meta.match(/data:(.*?);base64/) || [])[1] || 'application/octet-stream';
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return URL.createObjectURL(new Blob([bytes], { type: mime }));
  } catch {
    return null;
  }
}

/**
 * FilePreviewModal:
 * Displays specification sheets or vendor invoices attached to procurement requests.
 */
export default function FilePreviewModal({ file, onClose }) {
  const blobUrl = useMemo(() => {
    return file?.dataUrl ? dataUrlToBlobUrl(file.dataUrl) : null;
  }, [file]);

  // Clean up blob URL memory when component unmounts
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  if (!file) return null;

  const fileType = (file.type || '').toLowerCase();
  const isImage = fileType.startsWith('image/');
  const isPdf = fileType === 'application/pdf' || (file.name && file.name.endsWith('.pdf'));
  const fileHref = blobUrl || file.dataUrl;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#0F386E' }}>
            <span className="material-symbols-outlined">description</span>
            <span>{file.name || 'Procurement Document'}</span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {fileHref && (
              <a
                href={fileHref}
                download={file.name || 'document'}
                className="btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  textDecoration: 'none'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>download</span>
                Download
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '1.25rem',
                color: '#64748b'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, textAlign: 'center' }}>
          {!file.dataUrl ? (
            <div style={{ padding: '2rem', color: '#64748b' }}>
              <p>No document preview available.</p>
            </div>
          ) : isImage ? (
            <img
              src={fileHref}
              alt={file.name || 'Document'}
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '6px' }}
            />
          ) : isPdf ? (
            <iframe
              src={fileHref}
              title={file.name || 'PDF Preview'}
              style={{ width: '100%', height: '70vh', border: 'none', borderRadius: '6px' }}
            />
          ) : (
            <div style={{ padding: '3rem 1rem', color: '#64748b' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#94a3b8' }}>
                file_present
              </span>
              <p style={{ marginTop: '0.5rem', fontWeight: 500 }}>{file.name}</p>
              <p style={{ fontSize: '0.85rem' }}>This file type cannot be previewed in-browser.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
