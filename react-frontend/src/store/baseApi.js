import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * Root RTK Query Base API
 * Manages JWT header injection and cross-sector Cache Tag registry.
 * Feature sectors inject their endpoints dynamically via baseApi.injectEndpoints().
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || '/api',
    prepareHeaders: (headers, { getState }) => {
      // 1. Check Redux auth state first
      const state = getState();
      let token = state?.auth?.token;

      // 2. Fallback to sessionStorage if state isn't initialized yet
      if (!token) {
        try {
          const rxData = JSON.parse(sessionStorage.getItem('rx_data'));
          token = rxData?.currentUser?.token || sessionStorage.getItem('rx_token');
        } catch {
          token = null;
        }
      }

      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    'Auth',
    'AdminUsers',
    'AdminDepts',
    'AdminSubscription',
    'AdminTickets',
    'AdminAnnouncements',
    'Requests',
    'DeptResources',
    'DeptStock',
    'Inventory',
    'AllocationQueue',
    'Returns',
    'Maintenance',
    'MaintenanceHistory',
    'Procurement',
    'Registrar',
    'Owner',
    'Employee',
    'Notifications'
  ],
  endpoints: () => ({}), // Dynamic injection by sectors
});
