// Platform Owner Service for React Frontend
// Strictly communicates with backend API via centralized api.js
import { apiRequest } from './api';

// ==========================================
// 1. Organization Management APIs
// ==========================================

export const fetchOwnerOrganizations = async () => {
  return await apiRequest('/organizations');
};

export const approveOwnerOrganization = async (id, employeeId) => {
  return await apiRequest(`/organizations/${encodeURIComponent(id)}/approve`, {
    method: 'PATCH',
    body: JSON.stringify({ employeeId })
  });
};

export const suspendOwnerOrganization = async (id) => {
  return await apiRequest(`/organizations/${encodeURIComponent(id)}/suspend`, {
    method: 'PATCH'
  });
};

export const reactivateOwnerOrganization = async (id) => {
  return await apiRequest(`/organizations/${encodeURIComponent(id)}/reactivate`, {
    method: 'PATCH'
  });
};

// ==========================================
// 2. Employee Management APIs
// ==========================================

export const fetchOwnerEmployees = async () => {
  const users = await apiRequest('/users');
  return (users || []).filter((u) => u.role === 'Employee');
};

export const createOwnerEmployee = async (employeeData) => {
  return await apiRequest('/users/create-employee', {
    method: 'POST',
    body: JSON.stringify(employeeData)
  });
};

export const suspendOwnerEmployee = async (id) => {
  return await apiRequest(`/users/${encodeURIComponent(id)}/suspend`, {
    method: 'PATCH'
  });
};

export const reactivateOwnerEmployee = async (id) => {
  return await apiRequest(`/users/${encodeURIComponent(id)}/reactivate`, {
    method: 'PATCH'
  });
};

// ==========================================
// 3. Billing & Analytics APIs
// ==========================================

export const fetchOwnerPlatformAnalytics = async () => {
  return await apiRequest('/platform-analytics');
};

export const fetchOwnerInvoices = async () => {
  return await apiRequest('/invoices');
};

export const fetchOwnerPlans = async () => {
  return await apiRequest('/subscriptions/plans');
};

// ==========================================
// 4. Aggregated Overview API
// ==========================================

export const fetchOwnerDashboardOverview = async () => {
  const [orgs, employees, analytics, invoices] = await Promise.all([
    fetchOwnerOrganizations().catch(() => []),
    fetchOwnerEmployees().catch(() => []),
    fetchOwnerPlatformAnalytics().catch(() => ({})),
    fetchOwnerInvoices().catch(() => [])
  ]);

  return {
    organizations: orgs || [],
    employees,
    invoices: invoices || [],
    stats: {
      activeOrgs: analytics?.activeOrgs ?? 0,
      pendingOrgs: analytics?.pendingOrgs ?? 0,
      totalRevenue: analytics?.totalRevenue ?? 0,
      totalEmployees: employees.length
    }
  };
};
