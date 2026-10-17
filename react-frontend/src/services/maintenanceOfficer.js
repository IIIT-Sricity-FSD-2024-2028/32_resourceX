// Maintenance & Return Officer Service
import { apiRequest, buildQuery } from './api';

// ── Resources (for maintenance queue) ─────────────────────────────────────────

export const fetchResources = async (params = {}) =>
  apiRequest(`/resources${buildQuery(params)}`);

// ── Maintenance Queue ──────────────────────────────────────────────────────────

export const fetchMaintenanceHistory = async () =>
  apiRequest('/maintenance/history');

export const acceptMaintenance = async (resourceId, payload = {}) =>
  apiRequest(`/maintenance/${encodeURIComponent(resourceId)}/accept`, {
    method: 'POST',
    body: payload,
  });

export const repairMaintenance = async (resourceId, payload = {}) =>
  apiRequest(`/maintenance/${encodeURIComponent(resourceId)}/repair`, {
    method: 'POST',
    body: payload,
  });

export const scrapMaintenance = async (resourceId, payload = {}) =>
  apiRequest(`/maintenance/${encodeURIComponent(resourceId)}/scrap`, {
    method: 'POST',
    body: payload,
  });

// ── Return Processing ──────────────────────────────────────────────────────────

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

export const fetchMaintenanceOfficerStats = async (department) => {
  const [resources, maintHistory] = await Promise.all([
    fetchResources({ department }).catch(() => []),
    fetchMaintenanceHistory().catch(() => []),
  ]);
  const resList = Array.isArray(resources) ? resources : [];
  const mList = Array.isArray(maintHistory) ? maintHistory : [];
  return {
    resources: resList,
    maintHistory: mList,
    stats: {
      maintenanceRequested: resList.filter(r => r.status === 'Maintenance Requested').length,
      underMaintenance: resList.filter(r => r.status === 'Maintenance').length,
      resolvedThisMonth: mList.length,
    }
  };
};
