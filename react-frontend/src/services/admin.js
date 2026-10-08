// System Admin Service for React Frontend
// Strictly communicates with backend API (completely dependent on backend)

const API_BASE = '/api';

/**
 * Helper to fetch authorization tokens from localStorage
 */
const getAuthHeaders = () => {
  try {
    const rxData = JSON.parse(localStorage.getItem('rx_data'));
    const token = rxData?.currentUser?.token || localStorage.getItem('rx_token');
    if (token) {
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    }
  } catch {
    console.warn("No authentication token found in localStorage");
  }
  return { 'Content-Type': 'application/json' };
};

/**
 * Common fetch handler that manages status codes and error messages
 */
const apiRequest = async (path, options = {}) => {
  const headers = getAuthHeaders();
  if (!headers.Authorization) {
    throw new Error('UNAUTHORIZED');
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {})
    }
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error('UNAUTHORIZED');
  }

  if (res.status === 204) {
    return null;
  }

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!res.ok) {
    let errMsg = `Request failed (status ${res.status})`;
    if (isJson) {
      try {
        const errData = await res.json();
        errMsg = errData.message || errData.error || errMsg;
      } catch {}
    }
    throw new Error(errMsg);
  }

  return isJson ? await res.json() : null;
};

// ==========================================
// 1. Users Management APIs
// ==========================================

export const fetchAdminUsers = async () => {
  return await apiRequest('/users');
};

export const createAdminUser = async (userData) => {
  return await apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
};

export const updateAdminUser = async (id, userData) => {
  return await apiRequest(`/users/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(userData)
  });
};

export const deactivateAdminUser = async (id) => {
  return await apiRequest(`/users/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
};

export const suspendAdminUser = async (id) => {
  return await apiRequest(`/users/${encodeURIComponent(id)}/suspend`, {
    method: 'PATCH'
  });
};

export const reactivateAdminUser = async (id) => {
  return await apiRequest(`/users/${encodeURIComponent(id)}/reactivate`, {
    method: 'PATCH'
  });
};

// ==========================================
// 2. Department Management APIs
// ==========================================

export const fetchAdminDepartments = async () => {
  return await apiRequest('/departments');
};

export const createAdminDepartment = async (deptData) => {
  return await apiRequest('/departments', {
    method: 'POST',
    body: JSON.stringify(deptData)
  });
};

export const updateAdminDepartment = async (id, deptData) => {
  return await apiRequest(`/departments/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(deptData)
  });
};

export const deleteAdminDepartment = async (id) => {
  return await apiRequest(`/departments/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
};

export const fetchResourceCatalog = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return await apiRequest(`/resources/catalog${query ? `?${query}` : ''}`);
};

export const updateResourceCatalog = async (department, resourceTypes) => {
  return await apiRequest('/resources/catalog', {
    method: 'POST',
    body: JSON.stringify({ department, resourceTypes })
  });
};

// ==========================================
// 3. Resources & Requests Management APIs
// ==========================================

export const fetchAdminResources = async () => {
  return await apiRequest('/resources');
};

export const fetchAdminRequests = async () => {
  return await apiRequest('/requests');
};

export const approveAdminRequest = async (id) => {
  return await apiRequest(`/requests/${encodeURIComponent(id)}/approve`, {
    method: 'POST'
  });
};

export const rejectAdminRequest = async (id) => {
  return await apiRequest(`/requests/${encodeURIComponent(id)}/reject`, {
    method: 'POST'
  });
};

// ==========================================
// 4. Support Tickets APIs
// ==========================================

export const fetchAdminSupportTickets = async () => {
  return await apiRequest('/support');
};

export const createAdminSupportTicket = async (ticketData) => {
  return await apiRequest('/support', {
    method: 'POST',
    body: JSON.stringify(ticketData)
  });
};

// ==========================================
// 5. Announcements APIs
// ==========================================

export const fetchAdminAnnouncements = async () => {
  return await apiRequest('/announcements');
};

export const replyToAnnouncement = async (id, replyText) => {
  return await apiRequest(`/announcements/${encodeURIComponent(id)}/reply`, {
    method: 'PATCH',
    body: JSON.stringify({ reply: replyText })
  });
};

// ==========================================
// 6. Organization & Subscription APIs
// ==========================================

export const fetchAdminOrganization = async () => {
  return await apiRequest('/organizations/my-org/details');
};

export const fetchSubscriptionPlans = async () => {
  return await apiRequest('/subscriptions/plans');
};

export const updateSubscription = async (planId) => {
  return await apiRequest('/organizations/my-org/subscription', {
    method: 'PATCH',
    body: JSON.stringify({ planId })
  });
};

// ==========================================
// 7. Aggregated Overview API
// ==========================================

export const fetchAdminDashboardOverview = async () => {
  const [users, depts, resources, requests, tickets, announcements] = await Promise.all([
    fetchAdminUsers().catch(() => []),
    fetchAdminDepartments().catch(() => []),
    fetchAdminResources().catch(() => []),
    fetchAdminRequests().catch(() => []),
    fetchAdminSupportTickets().catch(() => []),
    fetchAdminAnnouncements().catch(() => [])
  ]);

  return {
    users,
    departments: depts,
    resources,
    requests,
    supportTickets: tickets,
    announcements,
    stats: {
      totalUsers: users.length,
      totalDepartments: depts.length,
      totalResources: resources.length,
      pendingRequests: requests.filter((r) => r.status === 'Pending').length,
      openTickets: tickets.filter((t) => t.status === 'Open').length,
      activeAnnouncements: announcements.length
    }
  };
};
