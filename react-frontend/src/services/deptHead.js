// Department Head Service for React Frontend
// Strictly communicates with backend API via centralized api.js
// (mirrors services/admin.js; backend scopes every list to the Dept Head's own department)
import { apiRequest, buildQuery } from './api';

// ==========================================
// 1. Dashboard Summary
// ==========================================

export const fetchDeptSummary = async () => {
  return await apiRequest('/analytics/department-summary');
};

// ==========================================
// 2. Resource Requests (Incoming from department staff)
// ==========================================

export const fetchDeptRequests = async (params = {}) => {
  return await apiRequest(`/requests${buildQuery(params)}`);
};

export const approveDeptRequest = async (id) => {
  return await apiRequest(`/requests/${encodeURIComponent(id)}/approve`, {
    method: 'POST'
  });
};

export const rejectDeptRequest = async (id, reason) => {
  return await apiRequest(`/requests/${encodeURIComponent(id)}/reject`, {
    method: 'POST',
    body: { reason }
  });
};

// ==========================================
// 3. Department Resources / Catalog
// ==========================================

export const fetchDeptResources = async (params = {}) => {
  return await apiRequest(`/resources${buildQuery(params)}`);
};

export const fetchDeptResourceTypes = async (department) => {
  const catalog = await apiRequest(`/resources/catalog${buildQuery({ department })}`);
  const entry = (catalog || []).find((c) => c.department === department) || (catalog || [])[0];
  return entry ? [...(entry.resourceTypes || [])] : [];
};

export const approveResourceExtension = async (id) => {
  return await apiRequest(`/resources/${encodeURIComponent(id)}/approve-extension`, {
    method: 'POST'
  });
};

export const rejectResourceExtension = async (id, payload = {}) => {
  return await apiRequest(`/resources/${encodeURIComponent(id)}/reject-extension`, {
    method: 'POST',
    body: payload
  });
};

// ==========================================
// 4. Procurements
// ==========================================

export const fetchDeptProcurements = async (params = {}) => {
  return await apiRequest(`/procurements${buildQuery(params)}`);
};

/**
 * Create a procurement (sent to Registrar). When a spec file is attached it is sent as
 * real multipart/form-data under the `specFile` field — the backend's
 * ProcurementFileValidationMiddleware validates it (type/size) and stores it.
 */
export const createDeptProcurement = async (payload, specFile) => {
  let body = payload;
  if (specFile) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.append(key, value);
    });
    formData.append('specFile', specFile);
    body = formData;
  }
  return await apiRequest('/procurements', {
    method: 'POST',
    body
  });
};

export const approveDeptProcurement = async (id) => {
  return await apiRequest(`/procurements/${encodeURIComponent(id)}/department-approve`, {
    method: 'POST'
  });
};

// Editable only while the procurement awaits registrar review
export const editDeptProcurement = async (id, payload) => {
  return await apiRequest(`/procurements/${encodeURIComponent(id)}/edit`, {
    method: 'POST',
    body: payload
  });
};

// Cancellable until a purchase order is issued
export const cancelDeptProcurement = async (id, reason) => {
  return await apiRequest(`/procurements/${encodeURIComponent(id)}/cancel`, {
    method: 'POST',
    body: { reason }
  });
};

export const rejectDeptProcurement = async (id, reason) => {
  return await apiRequest(`/procurements/${encodeURIComponent(id)}/department-reject`, {
    method: 'POST',
    body: { reason }
  });
};

// ==========================================
// 5. Stock Monitoring
// ==========================================

export const fetchDeptStock = async () => {
  return await apiRequest('/analytics/stock');
};

export const updateDeptStockThreshold = async (id, level) => {
  return await apiRequest(
    `/analytics/stock-thresholds/${encodeURIComponent(id)}/${encodeURIComponent(level)}`,
    { method: 'PATCH' }
  );
};

// ==========================================
// 6. Aggregated Overview API
// ==========================================

export const fetchDeptDashboardOverview = async () => {
  const [summary, requests, resources, procurements, stock] = await Promise.all([
    fetchDeptSummary(),
    fetchDeptRequests(),
    fetchDeptResources(),
    fetchDeptProcurements(),
    fetchDeptStock()
  ]);

  return { summary, requests, resources, procurements, stock };
};
