// Notifications Service for React Frontend
// Role/department/user scoping is applied by the backend
import { apiRequest } from './api';

export const fetchNotifications = async () => {
  return await apiRequest('/notifications');
};

export const markNotificationRead = async (id) => {
  return await apiRequest(`/notifications/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: { read: true }
  });
};
