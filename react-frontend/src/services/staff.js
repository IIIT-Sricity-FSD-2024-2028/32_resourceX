// Staff Operations Service for React Frontend
// Strictly communicates with backend API via centralized api.js
import { apiRequest, buildQuery } from './api';

// ==========================================
// 1. Allocation Requests APIs
// ==========================================

/**
 * Fetch requests visible to staff (can filter by status e.g. 'Approved', department)
 */
export const fetchStaffRequests = async (params = {}) => {
  return await apiRequest(`/requests${buildQuery(params)}`);
};

/**
 * Allocate inventory resources to an approved request
 * @param {string} id - Request ID (e.g., REQ-104)
 * @param {string[]} resourceIds - Array of resource codes/IDs to assign
 */
export const allocateStaffRequest = async (id, resourceIds = []) => {
  return await apiRequest(`/requests/${encodeURIComponent(id)}/allocate`, {
    method: 'POST',
    body: { resourceIds }
  });
};

// ==========================================
// 2. Department Inventory & Resources APIs
// ==========================================

/**
 * Fetch resources (can filter by status, department, type, etc.)
 */
export const fetchStaffResources = async (params = {}) => {
  return await apiRequest(`/resources${buildQuery(params)}`);
};

/**
 * Fetch available resources for allocation matching specific type & department
 */
export const fetchStaffAvailableResources = async (params = {}) => {
  return await apiRequest(`/resources${buildQuery({ status: 'Available', ...params })}`);
};

/**
 * List static resource types configured per department for Add Resource dropdown
 */
export const fetchStaffResourceCatalog = async (params = {}) => {
  return await apiRequest(`/resources/catalog${buildQuery(params)}`);
};

/**
 * Register/Create a new inventory resource
 */
export const createStaffResource = async (resourceData) => {
  return await apiRequest('/resources', {
    method: 'POST',
    body: resourceData
  });
};

/**
 * Update resource details (serialNumber, vendor, invoice, location, condition, status)
 */
export const updateStaffResource = async (id, resourceData) => {
  return await apiRequest(`/resources/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: resourceData
  });
};

/**
 * Scrap an inventory resource
 */
export const scrapStaffResource = async (id) => {
  return await apiRequest(`/resources/${encodeURIComponent(id)}/scrap`, {
    method: 'POST'
  });
};

// ==========================================
// 3. Maintenance Management APIs
// ==========================================

/**
 * Fetch historical maintenance activity records
 */
export const fetchStaffMaintenanceHistory = async () => {
  return await apiRequest('/maintenance/history');
};

/**
 * Accept a maintenance request (moves status to 'Maintenance')
 */
export const acceptStaffMaintenance = async (resourceId) => {
  return await apiRequest(`/maintenance/${encodeURIComponent(resourceId)}/accept`, {
    method: 'POST'
  });
};

/**
 * Mark a resource under maintenance as repaired (moves status to 'Repaired', condition to 'Good')
 */
export const repairStaffMaintenance = async (resourceId) => {
  return await apiRequest(`/maintenance/${encodeURIComponent(resourceId)}/repair`, {
    method: 'POST'
  });
};

/**
 * Scrap a resource directly from the maintenance flow
 */
export const scrapStaffMaintenance = async (resourceId) => {
  return await apiRequest(`/maintenance/${encodeURIComponent(resourceId)}/scrap`, {
    method: 'POST'
  });
};

// ==========================================
// 4. Return Management APIs
// ==========================================

/**
 * Fetch return history log entries
 */
export const fetchStaffReturnHistory = async () => {
  return await apiRequest('/returns/history');
};

/**
 * Process a returned resource with inspected condition ('Good' | 'Average' | 'Bad')
 */
export const processStaffReturn = async (resourceId, condition) => {
  return await apiRequest(`/returns/${encodeURIComponent(resourceId)}/process`, {
    method: 'POST',
    body: { condition }
  });
};

// ==========================================
// 5. Procurement Lookup APIs (for Invoice file attachments)
// ==========================================

/**
 * Fetch procurements visible to staff (used to lookup invoice files attached to purchases)
 */
export const fetchStaffProcurements = async (params = {}) => {
  return await apiRequest(`/procurements${buildQuery(params)}`);
};

/**
 * Log vendor and invoice details for an approved procurement (Staff)
 */
export const logStaffPurchase = async (id, data) => {
  return await apiRequest(`/procurements/${id}/log-purchase`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

/**
 * Register delivered assets for a fulfilled procurement (Staff)
 */
export const registerStaffProcurement = async (id, resources) => {
  return await apiRequest(`/procurements/${id}/register`, {
    method: 'POST',
    body: JSON.stringify({ resources })
  });
};

// ==========================================
// 6. Aggregated Overview / Summary APIs
// ==========================================

/**
 * Fetch summary metrics for staff dashboard header/cards
 */
export const fetchStaffDashboardStats = async (department) => {
  const [requests, resources, maintHistory, returnHistory] = await Promise.all([
    fetchStaffRequests({ status: 'Approved', department }).catch(() => []),
    fetchStaffResources({ department }).catch(() => []),
    fetchStaffMaintenanceHistory().catch(() => []),
    fetchStaffReturnHistory().catch(() => [])
  ]);

  const reqList = Array.isArray(requests) ? requests : [];
  const resList = Array.isArray(resources) ? resources : [];
  const mList = Array.isArray(maintHistory) ? maintHistory : [];
  const retList = Array.isArray(returnHistory) ? returnHistory : [];

  const pendingAllocations = reqList.length;
  const totalResources = resList.length;
  const activeMaintenance = resList.filter(
    (r) => r.status === 'Maintenance Requested' || r.status === 'Maintenance'
  ).length;
  const pendingReturns = resList.filter((r) => r.status === 'Returned').length;

  return {
    requests: reqList,
    resources: resList,
    maintHistory: mList,
    returnHistory: retList,
    stats: {
      pendingAllocations,
      totalResources,
      activeMaintenance,
      pendingReturns
    }
  };
};
