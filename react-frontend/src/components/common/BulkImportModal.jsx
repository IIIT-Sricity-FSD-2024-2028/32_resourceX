import React, { useState } from 'react';
import { downloadCsv, readSpreadsheetRows } from './spreadsheet';

/**
 * Bulk account import from an Excel (.xlsx) or CSV file.
 *
 * The first row of the sheet is the header; columns are matched by name (case and
 * spacing are ignored, and each column may list `aliases`). Parsed rows are previewed,
 * then sent to `onImport(rows)`, which resolves to `{ created: [...], failed: [...] }`
 * from the backend. Blank email/password cells are generated server-side and shown
 * in the result so they can be handed to the new users.
 *
 * A column flagged `document: true` holds a file name per row; the matching files are
 * picked alongside the sheet and attached to their rows by name (a spreadsheet cell
 * cannot carry a PDF itself). Rows are sent in batches so large files stay under the
 * server's request size limit.
 */

const DOCUMENT_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];
const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
// Base64 characters per request; the backend accepts JSON bodies up to 15 MB
const MAX_BATCH_CHARS = 9 * 1024 * 1024;

const baseName = (value) => String(value || '').split(/[\\/]/).pop().trim().toLowerCase();

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function BulkImportModal({ isOpen, onClose, title, description, columns, templateRows = [], templateFileName, onImport, onDone }) {
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState([]);
  const [parseError, setParseError] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  // Document files picked alongside the sheet, keyed by lowercase file name
  const [docFiles, setDocFiles] = useState(new Map());
  const [progress, setProgress] = useState('');

  if (!isOpen) return null;

  const docColumn = columns.find((c) => c.document);

  // Which picked file belongs to a row, or why none can be used
  const matchDocument = (row) => {
    if (!docColumn) return { file: null };
    const wanted = baseName(row[docColumn.key]);
    if (!wanted) return { error: `No file name in the ${docColumn.label} column.` };
    const file = docFiles.get(wanted);
    if (!file) return { error: `Document "${row[docColumn.key]}" was not among the selected files.` };
    if (!DOCUMENT_TYPES.includes(file.type)) return { error: `Document "${file.name}" must be a PDF, PNG or JPG file.` };
    if (file.size > MAX_DOCUMENT_BYTES) return { error: `Document "${file.name}" is too large (max 5 MB).` };
    return { file };
  };

  const reset = () => {
    setFileName('');
    setRows([]);
    setParseError('');
    setResult(null);
    setDocFiles(new Map());
    setProgress('');
  };

  const handleDocuments = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = '';
    if (!picked.length) return;
    setDocFiles((prev) => {
      const next = new Map(prev);
      picked.forEach((f) => next.set(f.name.toLowerCase(), f));
      return next;
    });
  };

  const close = () => {
    if (importing) return;
    reset();
    onClose();
  };

  const handleTemplate = () => {
    downloadCsv(templateFileName, [columns.map((c) => c.label), ...templateRows]);
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setRows([]);
    setParseError('');
    setResult(null);
    setFileName(file.name);
    try {
      const parsed = await readSpreadsheetRows(file, columns);
      if (parsed.length === 0) throw new Error('The file has no data rows below the header.');
      if (parsed.length > 1000) throw new Error(`The file has ${parsed.length} rows; import at most 1000 at a time.`);
      setRows(parsed);
    } catch (err) {
      setParseError(err.message || 'Could not read this file.');
    }
  };

  // Sends one batch, waiting and retrying when the server's rate limit kicks in
  const sendBatch = async (batch) => {
    for (let attempt = 0; ; attempt++) {
      try {
        return await onImport(batch);
      } catch (err) {
        if (!/too many/i.test(err.message || '') || attempt >= 5) throw err;
        setProgress('Server is busy — waiting a few seconds before continuing...');
        await sleep(15000);
      }
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setParseError('');
    const total = { created: [], failed: [] };
    try {
      let batch = [];
      let batchChars = 0;
      let done = 0;
      const flush = async () => {
        if (!batch.length) return;
        const res = await sendBatch(batch);
        total.created.push(...(res?.created || []));
        total.failed.push(...(res?.failed || []));
        done += batch.length;
        setProgress(`Imported ${done} of ${rows.length} rows...`);
        batch = [];
        batchChars = 0;
      };

      for (const row of rows) {
        const { [docColumn?.key]: _docName, ...fields } = row;
        if (!docColumn) {
          batch.push(fields);
          continue;
        }
        const { file, error } = matchDocument(row);
        if (error) {
          total.failed.push({ row: row.row, name: row.name || '', email: row.email || '', error });
          done += 1;
          continue;
        }
        const dataUrl = await readAsDataUrl(file);
        if (batchChars + dataUrl.length > MAX_BATCH_CHARS) await flush();
        batch.push({ ...fields, documentFileName: file.name, documentFileType: file.type, documentFileDataUrl: dataUrl });
        batchChars += dataUrl.length;
      }
      await flush();

      total.failed.sort((a, b) => a.row - b.row);
      setResult(total);
      // Refresh the page's list right away so the new accounts show behind the modal
      if (total.created.length) onDone?.();
    } catch (err) {
      // Earlier batches may already be saved — show what happened so far alongside the error
      if (total.created.length) {
        setResult(total);
        onDone?.();
      }
      setParseError(`${err.message || 'Import failed.'}${total.created.length ? ` (${total.created.length} accounts were created before the error.)` : ''}`);
    } finally {
      setImporting(false);
      setProgress('');
    }
  };

  const downloadResults = () => {
    downloadCsv('import-results.csv', [
      ['Row', 'Name', 'Email', 'Role', 'Status', 'Temporary Password / Error'],
      ...result.created.map((c) => [c.row, c.name, c.email, c.role, 'Created', c.generatedPassword || '(from file)']),
      ...result.failed.map((f) => [f.row, f.name, f.email, '', 'Failed', f.error]),
    ]);
  };

  const th = { textAlign: 'left', padding: '6px 8px', fontSize: 12, color: '#475569', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' };
  const td = { padding: '6px 8px', fontSize: 12, color: '#0f172a', borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' };

  return (
    <div
      onClick={close}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 14, width: 'min(860px, 100%)', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{title}</h3>
            {description && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>{description}</p>}
          </div>
          <button type="button" onClick={close} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', color: '#64748b', fontSize: 16 }}>✕</button>
        </div>

        {!result && (
          <>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.85rem 1rem', fontSize: 13, color: '#334155' }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Expected columns (first row is the header):</div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                {columns.map((c) => (
                  <li key={c.key}>
                    <strong>{c.label}</strong>{c.required ? ' (required)' : ' (optional)'}{c.hint ? ` — ${c.hint}` : ''}
                  </li>
                ))}
              </ul>
              <button type="button" className="btn-secondary" onClick={handleTemplate} style={{ marginTop: 10, fontSize: 12, padding: '0.35rem 0.8rem' }}>
                Download template (opens in Excel)
              </button>
            </div>

            <label style={{ position: 'relative', display: 'block', border: `2px dashed ${rows.length ? '#3b82f6' : '#cbd5e1'}`, borderRadius: 10, padding: '1rem', textAlign: 'center', cursor: 'pointer', color: rows.length ? '#1d4ed8' : '#64748b', fontSize: 13 }}>
              <input type="file" accept=".xlsx,.csv" onChange={handleFile} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
              {fileName ? <><strong>{fileName}</strong>{rows.length ? ` — ${rows.length} row${rows.length > 1 ? 's' : ''} found` : ''}</> : `${docColumn ? 'Step 1: ' : ''}Click to choose an Excel (.xlsx) or CSV file`}
            </label>

            {docColumn && (
              <label style={{ position: 'relative', display: 'block', border: `2px dashed ${docFiles.size ? '#3b82f6' : '#cbd5e1'}`, borderRadius: 10, padding: '1rem', textAlign: 'center', cursor: 'pointer', color: docFiles.size ? '#1d4ed8' : '#64748b', fontSize: 13 }}>
                <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg" onChange={handleDocuments} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                {docFiles.size
                  ? <><strong>{docFiles.size} document{docFiles.size > 1 ? 's' : ''} selected</strong>{rows.length ? ` — ${rows.filter((r) => matchDocument(r).file).length} of ${rows.length} rows matched` : ''} (click to add more)</>
                  : <>Step 2: Click to choose the document files (select them all at once). Each file name must match the <strong>{docColumn.label}</strong> column.</>}
              </label>
            )}

            {parseError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: '0.6rem 0.8rem', fontSize: 13 }}>{parseError}</div>
            )}

            {rows.length > 0 && (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'auto', maxHeight: 280 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={th}>Row</th>
                      {columns.map((c) => <th key={c.key} style={th}>{c.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 50).map((r) => (
                      <tr key={r.row}>
                        <td style={td}>{r.row}</td>
                        {columns.map((c) => (
                          <td key={c.key} style={td}>
                            {c.document ? (() => {
                              const { error } = matchDocument(r);
                              return (
                                <span style={{ color: error ? '#b91c1c' : '#047857' }} title={error || 'File matched'}>
                                  {error ? '✗ ' : '✓ '}{r[c.key] || 'missing'}
                                </span>
                              );
                            })() : c.key === 'password' && r[c.key] ? '••••••' : r[c.key] || <span style={{ color: '#94a3b8' }}>{c.blankText || '—'}</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 50 && <div style={{ padding: '6px 8px', fontSize: 12, color: '#64748b' }}>…and {rows.length - 50} more rows</div>}
              </div>
            )}

            {progress && <div style={{ fontSize: 13, color: '#1d4ed8' }}>{progress}</div>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn-secondary" onClick={close} disabled={importing}>Cancel</button>
              <button type="button" className="btn-primary" onClick={handleImport} disabled={importing || rows.length === 0}>
                {importing ? 'Importing...' : `Import ${rows.length || ''} ${rows.length === 1 ? 'Row' : 'Rows'}`}
              </button>
            </div>
          </>
        )}

        {result && (
          <>
            {parseError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: '0.6rem 0.8rem', fontSize: 13 }}>{parseError}</div>
            )}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 160, background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 10, padding: '0.75rem 1rem' }}>
                <div style={{ fontSize: 12, color: '#047857', fontWeight: 600 }}>Created</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#065f46' }}>{result.created.length}</div>
              </div>
              <div style={{ flex: 1, minWidth: 160, background: result.failed.length ? '#fef2f2' : '#f8fafc', border: `1px solid ${result.failed.length ? '#fecaca' : '#e2e8f0'}`, borderRadius: 10, padding: '0.75rem 1rem' }}>
                <div style={{ fontSize: 12, color: result.failed.length ? '#b91c1c' : '#64748b', fontWeight: 600 }}>Failed</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: result.failed.length ? '#991b1b' : '#334155' }}>{result.failed.length}</div>
              </div>
            </div>

            {result.created.some((c) => c.generatedPassword) && (
              <div style={{ fontSize: 13, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '0.6rem 0.8rem' }}>
                Some accounts were given a temporary password. Download the results to share each login with its user — the passwords are not shown again.
              </div>
            )}

            <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'auto', maxHeight: 320 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>Row</th><th style={th}>Name</th><th style={th}>Email</th><th style={th}>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {result.failed.map((f) => (
                    <tr key={`f-${f.row}`} style={{ background: '#fef2f2' }}>
                      <td style={td}>{f.row}</td><td style={td}>{f.name || '—'}</td><td style={td}>{f.email || '—'}</td>
                      <td style={{ ...td, color: '#b91c1c' }}>{f.error}</td>
                    </tr>
                  ))}
                  {result.created.map((c) => (
                    <tr key={`c-${c.row}`}>
                      <td style={td}>{c.row}</td><td style={td}>{c.name}</td><td style={td}>{c.email}</td>
                      <td style={{ ...td, color: '#047857' }}>
                        Created{c.generatedPassword ? <> — temp password <code>{c.generatedPassword}</code></> : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" className="btn-secondary" onClick={downloadResults}>Download results (CSV)</button>
              {result.failed.length > 0 && (
                <button type="button" className="btn-secondary" onClick={reset}>Import another file</button>
              )}
              <button type="button" className="btn-primary" onClick={close}>Done</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
