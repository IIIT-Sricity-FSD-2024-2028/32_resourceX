import { apiRequest, buildQuery } from './api';

/**
 * Registrar Service
 * Directly replicates the API calls used in the previous registrar page (Store.js):
 * - Store.fetchRegistrarSummary()
 * - Store.fetchRequests()
 * - Store.fetchProcurements()
 * - Store.fetchResources()
 * - Store.approveRegistrarProcurement()
 * - Store.rejectRegistrarProcurement()
 */

// 1. Fetch Registrar summary stats (active assets, pending reqs, pending procs, approved)
export const fetchRegistrarSummary = async () => {
  return await apiRequest('/analytics/registrar-summary');
};

// 2. Fetch Requests (supports ?status=...&department=...)
export const fetchRequests = async (params = {}) => {
  return await apiRequest(`/requests${buildQuery(params)}`);
};

// 3. Fetch Procurements
export const fetchProcurements = async (params = {}) => {
  return await apiRequest(`/procurements${buildQuery(params)}`);
};

// 4. Fetch Resources (active assets)
export const fetchResources = async (params = {}) => {
  return await apiRequest(`/resources${buildQuery(params)}`);
};

// 5. Accept / Approve procurement as Registrar
export const approveRegistrarProcurement = async (id) => {
  return await apiRequest(`/procurements/${encodeURIComponent(id)}/registrar-approve`, {
    method: 'POST'
  });
};

// 6. Reject procurement as Registrar
export const rejectRegistrarProcurement = async (id) => {
  return await apiRequest(`/procurements/${encodeURIComponent(id)}/registrar-reject`, {
    method: 'POST'
  });
};
