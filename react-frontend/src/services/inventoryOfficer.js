// Inventory & Allocate Officer Service
import { apiRequest, buildQuery } from './api';

// ── Allocation Queue ───────────────────────────────────────────────────────────

export const fetchApprovedRequests = async (params = {}) =>
  apiRequest(`/requests${buildQuery({ status: 'Approved', ...params })}`);

export const fetchAllRequests = async (params = {}) =>
  apiRequest(`/requests${buildQuery(params)}`);

export const allocateRequest = async (id, resourceIds = []) =>
  apiRequest(`/requests/${encodeURIComponent(id)}/allocate`, {
    method: 'POST',
    body: { resourceIds }
  });

// ── Resources / Inventory ─────────────────────────────────────────────────────

export const fetchResources = async (params = {}) =>
  apiRequest(`/resources${buildQuery(params)}`);

export const fetchAvailableResources = async (params = {}) =>
  apiRequest(`/resources${buildQuery({ status: 'Available', ...params })}`);

export const fetchResourceCatalog = async (params = {}) =>
  apiRequest(`/resources/catalog${buildQuery(params)}`);

export const fetchResourceAvailability = async (department, type) =>
  apiRequest(`/resources/availability${buildQuery({ department, type })}`);

export const createResource = async (data) =>
  apiRequest('/resources', { method: 'POST', body: data });

export const updateResource = async (id, data) =>
  apiRequest(`/resources/${encodeURIComponent(id)}`, { method: 'PATCH', body: data });

export const scrapResource = async (id) =>
  apiRequest(`/resources/${encodeURIComponent(id)}/scrap`, { method: 'POST' });

export const requestResourceMaintenance = async (id, data = {}) =>
  apiRequest(`/resources/${encodeURIComponent(id)}/maintenance-request`, {
    method: 'POST',
    body: data
  });

// ── Procurement register (Inventory Officer registers delivered items) ─────────

export const fetchProcurements = async (params = {}) =>
  apiRequest(`/procurements${buildQuery(params)}`);

export const registerProcurement = async (id, resources) =>
  apiRequest(`/procurements/${id}/register`, {
    method: 'POST',
    body: { resources }
  });

// ── Return Processing & History ───────────────────────────────────────────────

export const fetchReturnHistory = async () =>
  apiRequest('/returns/history');

export const processReturn = async (resourceId, payload) => {
  const body = typeof payload === 'string' ? { condition: payload } : payload;
  return apiRequest(`/returns/${encodeURIComponent(resourceId)}/process`, {
    method: 'POST',
    body,
  });
};

// ── Overview Stats ─────────────────────────────────────────────────────────────

export const fetchInventoryOfficerStats = async (department) => {
  const [requests, resources, returnHistory] = await Promise.all([
    fetchAllRequests({ department }).catch(() => []),
    fetchResources({ department }).catch(() => []),
    fetchReturnHistory().catch(() => [])
  ]);
  const reqList = Array.isArray(requests) ? requests : [];
  const resList = Array.isArray(resources) ? resources : [];
  const rList = Array.isArray(returnHistory) ? returnHistory : [];
  return {
    requests: reqList,
    resources: resList,
    returnHistory: rList,
    stats: {
      pendingAllocations: reqList.filter(r => r.status === 'Approved').length,
      totalResources: resList.length,
      available: resList.filter(r => r.status === 'Available').length,
      allocated: resList.filter(r => r.status === 'Allocated').length,
      pendingReturns: resList.filter(r => r.status === 'Returned').length,
      pendingRegistration: resList.filter(r => r.status === 'Returned').length,
    }
  };
};
