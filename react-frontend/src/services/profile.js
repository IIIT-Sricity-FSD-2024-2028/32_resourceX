// Profile API Service for React Frontend
// Strictly communicates with backend API (no offline simulation)

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
 * Fetch the current user profile from backend
 */
export const fetchProfile = async () => {
  const headers = getAuthHeaders();
  if (!headers.Authorization) {
    throw new Error('UNAUTHORIZED');
  }

  const res = await fetch(`${API_BASE}/profile/me`, { headers });
  
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error('UNAUTHORIZED');
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to fetch profile (Status ${res.status}).`);
  }

  const data = await res.json();
  return {
    ...data,
    preferences: {
      notifications: data.preferences?.notifications !== false
    }
  };
};

/**
 * Update the user profile (Name / Notification Settings) via backend PATCH
 */
export const updateProfile = async (user) => {
  const headers = getAuthHeaders();
  if (!headers.Authorization) {
    throw new Error('UNAUTHORIZED');
  }

  const payload = {
    name: user.name,
    notifications: user.preferences ? user.preferences.notifications : true
  };

  const res = await fetch(`${API_BASE}/profile/me`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to update profile settings (Status ${res.status}).`);
  }

  const updatedUser = await res.json();
  syncLocalProfile(updatedUser);
  return {
    ...updatedUser,
    preferences: {
      notifications: updatedUser.preferences?.notifications !== false
    }
  };
};

/**
 * Change the current account password via backend POST
 */
export const updatePassword = async (currentPassword, newPassword) => {
  const headers = getAuthHeaders();
  if (!headers.Authorization) {
    throw new Error('UNAUTHORIZED');
  }

  const res = await fetch(`${API_BASE}/profile/me/password`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ currentPassword, newPassword })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to update password (Status ${res.status}).`);
  }

  return true;
};

/**
 * Helper to keep localStorage in sync after backend update
 */
const syncLocalProfile = (data) => {
  try {
    const rxData = JSON.parse(localStorage.getItem('rx_data')) || {};
    if (rxData.currentUser) {
      if (data.name) rxData.currentUser.name = data.name;
      if (data.preferences) rxData.currentUser.notifications = data.preferences.notifications;
      localStorage.setItem('rx_data', JSON.stringify(rxData));
    }
  } catch {}
};
