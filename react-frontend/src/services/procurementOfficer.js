// Procurement Officer Service
import { apiRequest, buildQuery } from './api';

// ── Procurement Orders ─────────────────────────────────────────────────────────

export const fetchProcurements = async (params = {}) =>
  apiRequest(`/procurements${buildQuery(params)}`);

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
  const list = Array.isArray(all) ? all : [];
  return {
    procurements: list,
    stats: {
      openOrders: list.filter(p => p.status === 'Approved').length,
      fulfilled: list.filter(p => p.status === 'Fulfilled').length,
      registered: list.filter(p => p.status === 'Registered').length,
      total: list.length,
    }
  };
};
