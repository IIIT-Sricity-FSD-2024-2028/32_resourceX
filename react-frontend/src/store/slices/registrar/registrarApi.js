import { baseApi } from '../../baseApi';

/**
 * Registrar Actor Slice / API
 * Assigned to: Person 5
 */
export const registrarApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRegistrarOverview: builder.query({
      query: () => '/registrar/overview',
      providesTags: ['Registrar', 'Procurement'],
    }),
    getProcurementApprovals: builder.query({
      query: () => '/registrar/procurements',
      providesTags: ['Registrar', 'Procurement'],
    }),
    approveProcurement: builder.mutation({
      query: ({ id, remarks }) => ({
        url: `/registrar/procurements/${encodeURIComponent(id)}/approve`,
        method: 'PATCH',
        body: { remarks },
      }),
      invalidatesTags: ['Registrar', 'Procurement'],
    }),
    rejectProcurement: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/registrar/procurements/${encodeURIComponent(id)}/reject`,
        method: 'PATCH',
        body: { reason },
      }),
      invalidatesTags: ['Registrar', 'Procurement'],
    }),
    getGlobalRequestsAudit: builder.query({
      query: (params) => ({
        url: '/registrar/requests',
        params,
      }),
      providesTags: ['Requests', 'Registrar'],
    }),
    getSystemAnalytics: builder.query({
      query: () => '/registrar/analytics',
      providesTags: ['Registrar', 'Inventory', 'DeptStock'],
    }),
  }),
});

export const {
  useGetRegistrarOverviewQuery,
  useGetProcurementApprovalsQuery,
  useApproveProcurementMutation,
  useRejectProcurementMutation,
  useGetGlobalRequestsAuditQuery,
  useGetSystemAnalyticsQuery,
} = registrarApi;
