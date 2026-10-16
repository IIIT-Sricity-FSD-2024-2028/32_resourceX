// Maintenance & Return Officer Service
import { apiRequest, buildQuery } from './api';

// ── Resources (for maintenance queue) ─────────────────────────────────────────

export const fetchResources = async (params = {}) =>
  apiRequest(`/resources${buildQuery(params)}`);

// ── Maintenance Queue ──────────────────────────────────────────────────────────

export const fetchMaintenanceHistory = async () =>
  apiRequest('/maintenance/history');

export const acceptMaintenance = async (resourceId) =>
  apiRequest(`/maintenance/${encodeURIComponent(resourceId)}/accept`, { method: 'POST' });

export const repairMaintenance = async (resourceId) =>
  apiRequest(`/maintenance/${encodeURIComponent(resourceId)}/repair`, { method: 'POST' });

export const scrapMaintenance = async (resourceId) =>
  apiRequest(`/maintenance/${encodeURIComponent(resourceId)}/scrap`, { method: 'POST' });

// ── Return Processing ──────────────────────────────────────────────────────────

export const fetchReturnHistory = async () =>
  apiRequest('/returns/history');

export const processReturn = async (resourceId, condition) =>
  apiRequest(`/returns/${encodeURIComponent(resourceId)}/process`, {
    method: 'POST',
    body: { condition }
  });

// ── Overview Stats ─────────────────────────────────────────────────────────────

export const fetchMaintenanceOfficerStats = async (department) => {
  const [resources, maintHistory, returnHistory] = await Promise.all([
    fetchResources({ department }).catch(() => []),
    fetchMaintenanceHistory().catch(() => []),
    fetchReturnHistory().catch(() => [])
  ]);
  const resList = Array.isArray(resources) ? resources : [];
  const mList = Array.isArray(maintHistory) ? maintHistory : [];
  const rList = Array.isArray(returnHistory) ? returnHistory : [];
  return {
    resources: resList,
    maintHistory: mList,
    returnHistory: rList,
    stats: {
      maintenanceRequested: resList.filter(r => r.status === 'Maintenance Requested').length,
      underMaintenance: resList.filter(r => r.status === 'Maintenance').length,
      pendingReturns: resList.filter(r => r.status === 'Returned').length,
      resolvedThisMonth: mList.length + rList.length,
    }
  };
};
