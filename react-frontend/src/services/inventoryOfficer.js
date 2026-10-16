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

// ── Procurement register (Inventory Officer registers delivered items) ─────────

export const fetchProcurements = async (params = {}) =>
  apiRequest(`/procurements${buildQuery(params)}`);

export const registerProcurement = async (id, resources) =>
  apiRequest(`/procurements/${id}/register`, {
    method: 'POST',
    body: { resources }
  });

// ── Overview Stats ─────────────────────────────────────────────────────────────

export const fetchInventoryOfficerStats = async (department) => {
  const [requests, resources] = await Promise.all([
    fetchAllRequests({ department }).catch(() => []),
    fetchResources({ department }).catch(() => [])
  ]);
  const reqList = Array.isArray(requests) ? requests : [];
  const resList = Array.isArray(resources) ? resources : [];
  return {
    requests: reqList,
    resources: resList,
    stats: {
      pendingAllocations: reqList.filter(r => r.status === 'Approved').length,
      totalResources: resList.length,
      available: resList.filter(r => r.status === 'Available').length,
      allocated: resList.filter(r => r.status === 'Allocated').length,
      pendingRegistration: resList.filter(r => r.status === 'Returned').length,
    }
  };
};
