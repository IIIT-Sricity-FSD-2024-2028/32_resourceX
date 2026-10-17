// Procurement Officer Service
import { apiRequest, buildQuery } from './api';

// ── Procurement Orders ─────────────────────────────────────────────────────────

export const fetchProcurements = async (params = {}) =>
  apiRequest(`/procurements${buildQuery(params)}`);

export const createPurchaseOrder = async (id, data) =>
  apiRequest(`/procurements/${encodeURIComponent(id)}/create-po`, {
    method: 'POST',
    body: data
  });

export const dispatchDelivery = async (id, data) =>
  apiRequest(`/procurements/${encodeURIComponent(id)}/dispatch`, {
    method: 'POST',
    body: data
  });

export const logPurchase = async (id, data) =>
  apiRequest(`/procurements/${encodeURIComponent(id)}/log-purchase`, {
    method: 'POST',
    body: data
  });

// ── Overview Stats ─────────────────────────────────────────────────────────────

export const fetchProcurementOfficerStats = async (department) => {
  const [all] = await Promise.all([
    fetchProcurements({ department }).catch(() => [])
  ]);
  // Procurement Officer tracks pending indents, approved, PO created, fulfilled, and registered orders
  const list = (Array.isArray(all) ? all : []).filter(
    p => !['Pending Approval', 'Rejected'].includes(p.status)
  );
  return {
    procurements: list,
    stats: {
      pending: list.filter(p => p.status === 'Pending').length,
      approved: list.filter(p => p.status === 'Approved').length,
      poCreated: list.filter(p => p.status === 'PO Created').length,
      fulfilled: list.filter(p => p.status === 'Fulfilled').length,
      registered: list.filter(p => p.status === 'Registered').length,
      openOrders: list.filter(p => ['Pending', 'Approved', 'PO Created'].includes(p.status)).length,
      total: list.length,
    }
  };
};
