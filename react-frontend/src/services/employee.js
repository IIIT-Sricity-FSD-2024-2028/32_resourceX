// Platform Employee Service for React Frontend
// Strictly communicates with backend API via centralized api.js
import { apiRequest } from './api';

// ==========================================
// 1. Institution (Organization) APIs
// ==========================================

// Backend lists every organization for Employees; callers keep only the ones assigned to them.
export const fetchEmployeeInstitutions = async (employeeId) => {
  const orgs = await apiRequest('/organizations');
  return (orgs || []).filter((o) => o.assignedEmployeeId === employeeId);
};

export const suspendEmployeeInstitution = async (id) => {
  return await apiRequest(`/organizations/${encodeURIComponent(id)}/suspend`, {
    method: 'PATCH'
  });
};

export const reactivateEmployeeInstitution = async (id) => {
  return await apiRequest(`/organizations/${encodeURIComponent(id)}/reactivate`, {
    method: 'PATCH'
  });
};

// ==========================================
// 2. Support Ticket APIs
// ==========================================

export const fetchEmployeeTickets = async () => {
  return (await apiRequest('/support')) || [];
};

export const resolveEmployeeTicket = async (id, reply) => {
  return await apiRequest(`/support/${encodeURIComponent(id)}/resolve`, {
    method: 'PATCH',
    body: JSON.stringify({ reply, status: 'Resolved' })
  });
};

// ==========================================
// 3. Announcement APIs
// ==========================================

export const fetchEmployeeAnnouncements = async () => {
  return (await apiRequest('/announcements')) || [];
};

export const createEmployeeAnnouncement = async (announcementData) => {
  return await apiRequest('/announcements', {
    method: 'POST',
    body: JSON.stringify(announcementData)
  });
};

// ==========================================
// 4. Aggregated Overview API
// ==========================================

export const fetchEmployeeDashboardOverview = async (employeeId) => {
  const [institutions, tickets, announcements] = await Promise.all([
    fetchEmployeeInstitutions(employeeId).catch(() => []),
    fetchEmployeeTickets().catch(() => []),
    fetchEmployeeAnnouncements().catch(() => [])
  ]);

  return {
    institutions,
    tickets,
    announcements,
    stats: {
      assignedInstitutions: institutions.length,
      openTickets: tickets.filter((t) => t.status === 'Open').length,
      resolvedTickets: tickets.filter((t) => t.status === 'Resolved').length,
      announcementsSent: announcements.length
    }
  };
};
