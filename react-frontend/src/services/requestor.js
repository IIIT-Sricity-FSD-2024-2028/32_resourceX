// Requestor Service for React Frontend
// Strictly communicates with backend API via centralized api.js
import { apiRequest, buildQuery } from './api';

// ==========================================
// 1. Analytics & Summary APIs
// ==========================================

export const fetchRequestorSummary = async () => {
  return await apiRequest('/analytics/requestor-summary');
};

export const fetchStock = async () => {
  return await apiRequest('/analytics/stock');
};

// ==========================================
// 2. Department & Resource Catalog APIs
// ==========================================

export const fetchDepartments = async () => {
  return await apiRequest('/departments');
};

export const fetchResourceCatalog = async (params = {}) => {
  return await apiRequest(`/resources/catalog${buildQuery(params)}`);
};

export const fetchResourceAvailability = async (department, type) => {
  return await apiRequest(`/resources/availability${buildQuery({ department, type })}`);
};

// ==========================================
// 3. Requests Management APIs
// ==========================================

export const fetchRequests = async (params = {}) => {
  return await apiRequest(`/requests${buildQuery(params)}`);
};

export const createRequest = async (payload) => {
  return await apiRequest('/requests', {
    method: 'POST',
    body: payload
  });
};

export const confirmReceipt = async (id) => {
  return await apiRequest(`/requests/${encodeURIComponent(id)}/receipt`, {
    method: 'POST'
  });
};

// ==========================================
// 4. Resources (Allocated Assets) APIs
// ==========================================

export const fetchResources = async (params = {}) => {
  return await apiRequest(`/resources${buildQuery(params)}`);
};

export const requestResourceMaintenance = async (id) => {
  return await apiRequest(`/resources/${encodeURIComponent(id)}/maintenance-request`, {
    method: 'POST'
  });
};

export const initiateResourceReturn = async (id) => {
  return await apiRequest(`/resources/${encodeURIComponent(id)}/initiate-return`, {
    method: 'POST'
  });
};

export const confirmRepairedAllocation = async (id) => {
  return await apiRequest(`/resources/${encodeURIComponent(id)}/confirm-repaired`, {
    method: 'POST'
  });
};

// ==========================================
// 5. Procurement APIs
// ==========================================

export const fetchProcurements = async (params = {}) => {
  return await apiRequest(`/procurements${buildQuery(params)}`);
};

/**
 * Creates a procurement request.
 * If a raw file is provided, sends as multipart/form-data.
 */
export const createProcurement = async (payload, rawFile) => {
  let body = payload;
  if (rawFile) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'rawFile') {
        formData.append(key, value);
      }
    });
    formData.append('specFile', rawFile);
    body = formData;
  }
  return await apiRequest('/procurements', {
    method: 'POST',
    body
  });
};

// ==========================================
// 6. Aggregated Dashboard Overview API
// ==========================================

export const fetchRequestorDashboardOverview = async () => {
  const [departments, resourceCatalog, stock, requests, resources, procurements, summary] = await Promise.all([
    fetchDepartments().catch(() => []),
    fetchResourceCatalog().catch(() => []),
    fetchStock().catch(() => []),
    fetchRequests().catch(() => []),
    fetchResources().catch(() => []),
    fetchProcurements().catch(() => []),
    fetchRequestorSummary().catch(() => null)
  ]);

  return {
    departments,
    resourceCatalog,
    stock,
    requests,
    resources,
    procurements,
    summary
  };
};
