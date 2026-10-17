import React, { useRef, useState } from 'react';

export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsDataURL(file);
  });

/**
 * File picker for an account document (PDF, PNG or JPG up to 5 MB).
 * Calls onChange({ documentFileName, documentFileType, documentFileDataUrl }) or onChange(null).
 * Change `resetKey` to clear the picker after a form is submitted.
 */
export default function DocumentUpload({ label = 'Document', required = false, onChange, hint, resetKey }) {
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const inputRef = useRef(null);
  const lastResetKey = useRef(resetKey);

  if (lastResetKey.current !== resetKey) {
    lastResetKey.current = resetKey;
    if (fileName) setFileName('');
    if (error) setError('');
    if (inputRef.current) inputRef.current.value = '';
  }

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    setError('');
    if (!file) {
      setFileName('');
      onChange(null);
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please choose a PDF, PNG or JPG file.');
      e.target.value = '';
      setFileName('');
      onChange(null);
      return;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      setError('File is too large (max 5 MB).');
      e.target.value = '';
      setFileName('');
      onChange(null);
      return;
    }
    try {
      const dataUrl = await readAsDataUrl(file);
      setFileName(file.name);
      onChange({ documentFileName: file.name, documentFileType: file.type, documentFileDataUrl: dataUrl });
    } catch (err) {
      setError(err.message);
      onChange(null);
    }
  };

  return (
    <div className="form-group">
      <label className="form-label">
        {label}
        {required && <span style={{ color: '#dc2626' }}> *</span>}
      </label>
      <input
        ref={inputRef}
        type="file"
        className="form-control"
        accept=".pdf,.png,.jpg,.jpeg"
        required={required}
        onChange={handleChange}
      />
      <div style={{ fontSize: '0.75rem', color: error ? '#b91c1c' : '#64748b', marginTop: '0.35rem' }}>
        {error || (fileName ? `Selected: ${fileName}` : hint || 'PDF, PNG or JPG, up to 5 MB.')}
      </div>
    </div>
  );
}

/** Download link for a stored document, or a muted "No document" label. */
export function DocumentLink({ record }) {
  if (!record?.documentFileDataUrl) {
    return <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No document</span>;
  }
  return (
    <a
      href={record.documentFileDataUrl}
      download={record.documentFileName || 'document'}
      title={`Download ${record.documentFileName || 'document'}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', maxWidth: 180 }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>description</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {record.documentFileName || 'Document'}
      </span>
    </a>
  );
}
