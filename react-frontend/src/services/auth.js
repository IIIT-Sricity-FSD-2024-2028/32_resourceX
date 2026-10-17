// Authentication Service for React Frontend
// Strictly communicates with backend API (no offline simulation)

const API_BASE = '/api';

/**
 * Fetch available public tenant organizations from backend
 */
export const fetchOrganizations = async () => {
  const res = await fetch(`${API_BASE}/organizations/public`);
  if (!res.ok) {
    throw new Error(`Failed to load organizations from backend (status ${res.status}).`);
  }
  const data = await res.json();
  if (Array.isArray(data)) {
    return data;
  }
  throw new Error('Invalid organization response received from backend.');
};

/**
 * Fetch mock credentials from backend for 1-click Quick Login testing
 */
export const fetchMockUser = async (role, orgId) => {
  let url = `${API_BASE}/users/mock?role=${encodeURIComponent(role)}`;
  if (orgId && orgId !== 'PLATFORM') {
    url += `&orgId=${encodeURIComponent(orgId)}`;
  }

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `No mock user returned from backend for ${role}.`);
  }
  return await res.json();
};

/**
 * Authenticate user with email and password via backend POST /api/auth/login
 */
export const loginUser = async (email, password, selectedOrgId) => {
  const normalizedEmail = email.toLowerCase().trim();

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: normalizedEmail, password })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || (res.status === 401 ? 'Invalid email or password.' : `Backend error (${res.status}).`));
  }

  const data = await res.json();
  if (!data || !data.access_token) {
    throw new Error('Authentication succeeded but backend returned no JWT access token.');
  }

  const userObj = {
    ...data.user,
    token: data.access_token
  };

  // Validate organization boundary if specified
  if (selectedOrgId && selectedOrgId !== 'PLATFORM' && userObj.organizationId && userObj.organizationId !== selectedOrgId) {
    throw new Error('User does not belong to the selected organization.');
  }

  // Persist session to localStorage
  persistSession(userObj);
  return userObj;
};

const postPublic = async (path, body) => {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = Array.isArray(data.message) ? data.message[0] : data.message;
    throw new Error(message || `Backend error (${res.status}).`);
  }
  return data;
};

/**
 * Forgot password step 1: email a 6-digit verification code
 */
export const requestPasswordReset = (email) =>
  postPublic('/auth/forgot-password', { email: email.toLowerCase().trim() });

/**
 * Forgot password step 2: verify the code; returns { resetToken }
 */
export const verifyPasswordResetOtp = (email, otp) =>
  postPublic('/auth/verify-otp', { email: email.toLowerCase().trim(), otp });

/**
 * Forgot password step 3: set the new password
 */
export const resetPassword = (resetToken, newPassword) =>
  postPublic('/auth/reset-password', { resetToken, newPassword });

/**
 * Save user session to localStorage
 */
export const persistSession = (user) => {
  try {
    const currentData = JSON.parse(localStorage.getItem('rx_data')) || {};
    currentData.currentUser = user;
    localStorage.setItem('rx_data', JSON.stringify(currentData));
    localStorage.setItem('rx_token', user.token || '');
  } catch (e) {
    console.error('Failed to persist session to localStorage:', e);
  }
};

/**
 * Get currently logged-in user from localStorage
 */
export const getCurrentUser = () => {
  try {
    const data = JSON.parse(localStorage.getItem('rx_data'));
    return data?.currentUser || null;
  } catch {
    return null;
  }
};

/**
 * Clear session from localStorage
 */
export const logoutUser = () => {
  try {
    const data = JSON.parse(localStorage.getItem('rx_data')) || {};
    data.currentUser = null;
    localStorage.setItem('rx_data', JSON.stringify(data));
    localStorage.removeItem('rx_token');
  } catch (e) {
    console.error('Failed to clear session:', e);
  }
};
