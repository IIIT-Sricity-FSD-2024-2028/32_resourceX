// Profile API Service for React Frontend
// Strictly communicates with backend API via centralized api.js
import { apiRequest } from './api';

/**
 * Fetch the current user profile from backend
 */
export const fetchProfile = async () => {
  const data = await apiRequest('/profile/me');
  return {
    ...data,
    preferences: {
      notifications: data?.preferences?.notifications !== false
    }
  };
};

/**
 * Update the user profile (Name / Notification Settings) via backend PATCH
 */
export const updateProfile = async (user) => {
  const payload = {
    name: user.name,
    notifications: user.preferences ? user.preferences.notifications : true
  };

  const updatedUser = await apiRequest('/profile/me', {
    method: 'PATCH',
    body: payload
  });

  syncLocalProfile(updatedUser);
  return {
    ...updatedUser,
    preferences: {
      notifications: updatedUser?.preferences?.notifications !== false
    }
  };
};

/**
 * Change the current account password via backend POST
 */
export const updatePassword = async (currentPassword, newPassword) => {
  await apiRequest('/profile/me/password', {
    method: 'POST',
    body: { currentPassword, newPassword }
  });
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
