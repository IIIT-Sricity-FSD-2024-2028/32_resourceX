import { apiRequest, buildQuery } from './api';

/**
 * Service for Registrar operations.
 * Communicates directly with backend API endpoints using the universal apiRequest client.
 */

// 1. Fetch Registrar Dashboard Summary (Total Assets, Pending Requests, Pending Procurements, Approved Today)
export const fetchRegistrarSummary = async () => {
  return await apiRequest('/analytics/registrar-summary');
};

// 2. Fetch Procurements with optional status/department filters
export const fetchRegistrarProcurements = async (params = {}) => {
  return await apiRequest(`/procurements${buildQuery(params)}`);
};

// 3. Approve a procurement request as Registrar
export const approveRegistrarProcurement = async (id) => {
  return await apiRequest(`/procurements/${encodeURIComponent(id)}/registrar-approve`, {
    method: 'POST'
  });
};

// 4. Reject a procurement request as Registrar
export const rejectRegistrarProcurement = async (id) => {
  return await apiRequest(`/procurements/${encodeURIComponent(id)}/registrar-reject`, {
    method: 'POST'
  });
};

// 5. Fetch Global Requests with optional status/department filters
export const fetchRegistrarRequests = async (params = {}) => {
  return await apiRequest(`/requests${buildQuery(params)}`);
};

// 6. Fetch Global Hardware/Resource Inventory
export const fetchRegistrarResources = async (params = {}) => {
  return await apiRequest(`/resources${buildQuery(params)}`);
};

// 7. Fetch Master Resource Catalog
export const fetchRegistrarCatalog = async (params = {}) => {
  return await apiRequest(`/resources/catalog${buildQuery(params)}`);
};

// 8. Fetch Stock & Thresholds
export const fetchRegistrarStock = async () => {
  return await apiRequest('/analytics/stock');
};

// 9. Aggregated Overview API for rapid dashboard initialization
export const fetchRegistrarDashboardOverview = async () => {
  const [summary, procurements, requests, resources] = await Promise.all([
    fetchRegistrarSummary().catch(() => null),
    fetchRegistrarProcurements().catch(() => []),
    fetchRegistrarRequests().catch(() => []),
    fetchRegistrarResources().catch(() => [])
  ]);

  return {
    summary,
    procurements: Array.isArray(procurements) ? procurements : [],
    requests: Array.isArray(requests) ? requests : [],
    resources: Array.isArray(resources) ? resources : []
  };
};
