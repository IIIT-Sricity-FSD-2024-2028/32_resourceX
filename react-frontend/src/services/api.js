// Universal API Client for ResourceX React Frontend
// Reusable by all roles (Admin, Dept Head, Requestor, Staff, Registrar, Owner, Employee)

export const API_BASE = '/api';

/**
 * Fetch authorization headers with JWT Bearer token from localStorage
 * @param {boolean} isMultipart - If true, omits Content-Type so browser sets multipart boundary
 */
export const getAuthHeaders = (isMultipart = false) => {
  let token = null;
  try {
    const rxData = JSON.parse(localStorage.getItem('rx_data'));
    token = rxData?.currentUser?.token || localStorage.getItem('rx_token');
  } catch {
    console.warn('No authentication token found in localStorage');
  }

  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

/**
 * Build URL search query string from key-value parameters object
 * Example: buildQuery({ department: 'IT', status: 'Pending' }) => "?department=IT&status=Pending"
 */
export const buildQuery = (params = {}) => {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  if (!entries.length) return '';
  const query = new URLSearchParams(entries).toString();
  return query ? `?${query}` : '';
};

/**
 * Centralized HTTP request handler with authentication, JSON serialization, and error normalization
 */
export const apiRequest = async (path, options = {}) => {
  const isMultipart = options.body instanceof FormData;
  const authHeaders = getAuthHeaders(isMultipart);

  if (!authHeaders.Authorization) {
    throw new Error('UNAUTHORIZED');
  }

  let body = options.body;
  if (body && typeof body === 'object' && !isMultipart && !(body instanceof Blob) && !(body instanceof ArrayBuffer)) {
    body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    body,
    headers: {
      ...authHeaders,
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

  return isJson ? await res.json() : await res.text();
};
