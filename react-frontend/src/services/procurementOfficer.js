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

// Correct vendor / PO document after the PO is issued
export const editPurchaseOrder = async (id, data) =>
  apiRequest(`/procurements/${encodeURIComponent(id)}/edit-po`, {
    method: 'POST',
    body: data
  });

// Correct invoice number / amount / document before assets are registered
export const editInvoice = async (id, data) =>
  apiRequest(`/procurements/${encodeURIComponent(id)}/edit-invoice`, {
    method: 'POST',
    body: data
  });
