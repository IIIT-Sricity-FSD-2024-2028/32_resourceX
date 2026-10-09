// Department Head Service for React Frontend
// The backend scopes requests and procurements to the Dept Head's own
// department, so none of these calls need to pass the department explicitly.

import { apiRequest, buildQuery } from './api';

// ==========================================
// 1. Incoming Resource Requests (from department staff)
// ==========================================

export const fetchDeptRequests = async (params = {}) => {
  return await apiRequest(`/requests${buildQuery(params)}`);
};

export const approveDeptRequest = async (id) => {
  return await apiRequest(`/requests/${encodeURIComponent(id)}/approve`, { method: 'POST' });
};

export const rejectDeptRequest = async (id) => {
  return await apiRequest(`/requests/${encodeURIComponent(id)}/reject`, { method: 'POST' });
};

// ==========================================
// 2. Incoming Procurement Requests (raised by requestors)
// ==========================================

export const fetchDeptProcurements = async (params = {}) => {
  return await apiRequest(`/procurements${buildQuery(params)}`);
};

export const approveDeptProcurement = async (id) => {
  return await apiRequest(`/procurements/${encodeURIComponent(id)}/department-approve`, { method: 'POST' });
};

export const rejectDeptProcurement = async (id) => {
  return await apiRequest(`/procurements/${encodeURIComponent(id)}/department-reject`, { method: 'POST' });
};

// ==========================================
// 3. Stock Monitoring
// ==========================================

/**
 * Stock rows for the department, with `currentQuantity` and `status`
 * ('Safe' | 'Near Threshold' | 'Low Stock') computed by the backend.
 */
export const fetchDeptStock = async (department) => {
  const rows = await apiRequest('/analytics/stock');
  return (rows || []).filter((row) => !department || row.department === department);
};

export const updateStockThreshold = async (id, level) => {
  return await apiRequest(
    `/analytics/stock-thresholds/${encodeURIComponent(id)}/${encodeURIComponent(level)}`,
    { method: 'PATCH' }
  );
};

// ==========================================
// 4. File helpers
// ==========================================

/**
 * Opens an inline data-URL file (spec file stored on a procurement) in a new tab.
 */
export const openDataUrlFile = (dataUrl) => {
  if (!dataUrl) return;
  try {
    const [meta, base64] = dataUrl.split(',');
    const mime = meta.match(/data:(.*?);base64/)?.[1] || 'application/octet-stream';
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch {
    window.open(dataUrl, '_blank', 'noopener');
  }
};
