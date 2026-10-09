// Shared API client for all role services (admin, dept head, ...)
// Strictly communicates with backend API (completely dependent on backend)

export const API_BASE = '/api';

/**
 * Reads the JWT for the current session from localStorage
 */
export const getAuthToken = () => {
  try {
    const rxData = JSON.parse(localStorage.getItem('rx_data'));
    return rxData?.currentUser?.token || localStorage.getItem('rx_token') || null;
  } catch {
    return localStorage.getItem('rx_token') || null;
  }
};

/**
 * Builds a query string, skipping empty values and the 'All' filter sentinel
 */
export const buildQuery = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'All') {
      search.append(key, value);
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};

/**
 * Common fetch handler that manages auth headers, status codes and error messages.
 * Plain objects are sent as JSON; FormData is sent as multipart (browser sets the boundary).
 */
export const apiRequest = async (path, options = {}) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('UNAUTHORIZED');
  }

  const { body, headers: extraHeaders, ...rest } = options;
  const headers = { Authorization: `Bearer ${token}`, ...(extraHeaders || {}) };

  let payload = body;
  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    payload = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, { ...rest, headers, body: payload });

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
        const msg = errData.message || errData.error;
        errMsg = Array.isArray(msg) ? msg.join(', ') : msg || errMsg;
      } catch {}
    }
    throw new Error(errMsg);
  }

  return isJson ? await res.json() : null;
};
