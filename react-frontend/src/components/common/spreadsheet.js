import { readSheet } from 'read-excel-file/browser';

/**
 * Spreadsheet helpers shared by the bulk import screens: read an Excel (.xlsx) or CSV
 * file into objects keyed by column, and download a CSV template.
 */

export const normalizeHeader = (value) => String(value ?? '').toLowerCase().replace(/[^a-z]/g, '');

// Minimal RFC 4180 CSV parser (quoted fields, escaped quotes, CRLF)
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const toCsv = (rows) =>
  rows.map((r) => r.map((v) => {
    const s = String(v ?? '');
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',')).join('\r\n');

export function downloadCsv(fileName, rows) {
  const blob = new Blob(['﻿' + toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Reads the first sheet of `file`. The first row is the header; each column in `columns`
 * ({ key, label, aliases?, required? }) is matched by name, ignoring case and spacing.
 * Returns the non-empty rows as `{ row, [key]: string }`, where `row` is the sheet row number.
 */
export async function readSpreadsheetRows(file, columns) {
  let grid;
  if (/\.csv$/i.test(file.name)) {
    grid = parseCsv(await file.text());
  } else if (/\.xlsx$/i.test(file.name)) {
    grid = await readSheet(file);
  } else {
    throw new Error('Please choose an Excel (.xlsx) or CSV (.csv) file. Older .xls files must be re-saved as .xlsx.');
  }

  const [header = [], ...body] = grid;
  const headerKeys = header.map(normalizeHeader);
  const indexOf = {};
  columns.forEach((col) => {
    const names = [col.label, col.key, ...(col.aliases || [])].map(normalizeHeader);
    indexOf[col.key] = headerKeys.findIndex((h) => names.includes(h));
  });
  const missing = columns.filter((c) => c.required && indexOf[c.key] === -1);
  if (missing.length) {
    throw new Error(`Missing column${missing.length > 1 ? 's' : ''}: ${missing.map((c) => c.label).join(', ')}. Download the template to see the expected layout.`);
  }

  return body
    .map((cells, i) => {
      const entry = { row: i + 2 };
      columns.forEach((col) => {
        const value = indexOf[col.key] >= 0 ? cells[indexOf[col.key]] : '';
        entry[col.key] = value === null || value === undefined ? '' : String(value).trim();
      });
      return entry;
    })
    .filter((entry) => columns.some((col) => entry[col.key]));
}
