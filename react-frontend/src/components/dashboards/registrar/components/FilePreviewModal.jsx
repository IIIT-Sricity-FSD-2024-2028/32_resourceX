import React, { useEffect, useMemo } from 'react';

/**
 * Converts a base64 Data URL to a Blob URL so the browser can display PDFs
 * without iframe navigation security blocks.
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
 * FilePreviewModal for Registrar Dashboard
 * Displays specification sheets or invoices attached to procurement indents.
 * Directly renders images via dataUrl (matching DeptHead & Staff behavior)
 * and PDFs via blob URL.
 */
export default function FilePreviewModal({ file, onClose }) {
  const blobUrl = useMemo(() => {
    if (!file?.dataUrl) return null;
    if (typeof file.dataUrl === 'string' && file.dataUrl.startsWith('data:')) {
      return dataUrlToBlobUrl(file.dataUrl);
    }
    return null;
  }, [file]);

  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  if (!file) return null;

  const fileName = file.name || 'document';
  const fileType = (file.type || '').toLowerCase();
  const isImage = fileType.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(fileName);
  const isPdf = fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
  const href = file.dataUrl?.startsWith('data:') ? (blobUrl || file.dataUrl) : file.dataUrl;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 99999,
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
          borderRadius: 14,
          width: '100%',
          maxWidth: '860px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            background: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#0F386E' }}>
              {isImage ? 'image' : isPdf ? 'picture_as_pdf' : 'description'}
            </span>
            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
              {fileName}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {href && (
              <a
                href={href}
                download={fileName}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  background: '#f1f5f9',
                  color: '#334155',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  border: '1px solid #cbd5e1'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                Download
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                border: 'none',
                background: '#f1f5f9',
                borderRadius: 8,
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 380,
            background: '#f8fafc'
          }}
        >
          {!file.dataUrl ? (
            <p style={{ color: '#64748b' }}>File content is not available for preview.</p>
          ) : isImage ? (
            <img
              src={file.dataUrl}
              alt={fileName}
              style={{
                maxWidth: '100%',
                maxHeight: '72vh',
                borderRadius: 8,
                objectFit: 'contain'
              }}
            />
          ) : isPdf ? (
            <iframe
              src={blobUrl || file.dataUrl}
              title={fileName}
              style={{
                width: '100%',
                height: '72vh',
                border: 'none',
                borderRadius: 8,
                background: '#ffffff'
              }}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#94a3b8' }}>
                draft
              </span>
              <p style={{ marginTop: '0.5rem', fontWeight: 600, color: '#1e293b' }}>{fileName}</p>
              <p style={{ fontSize: 13 }}>
                Preview is not supported for this file type. Use Download to open it.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
