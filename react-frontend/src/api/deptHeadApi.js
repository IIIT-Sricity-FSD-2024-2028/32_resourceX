import { baseApi } from '../store/baseApi';

/**
 * Department Head Sector API (Person 3)
 * Injects department head endpoints into baseApi.
 */
export const deptHeadApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Core Key Endpoints for Person 3
    getDeptIncomingRequests: builder.query({
      query: (params) => ({
        url: '/requests',
        params,
      }),
      providesTags: ['Requests'],
    }),

    approveRequest: builder.mutation({
      query: (id) => ({
        url: `/requests/${encodeURIComponent(typeof id === 'object' ? id.id : id)}/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['Requests', 'DeptStock', 'AllocationQueue'],
    }),

    getDeptStock: builder.query({
      query: () => '/analytics/stock',
      providesTags: ['DeptStock'],
    }),

    updateThreshold: builder.mutation({
      query: ({ id, level, resourceTypeId, threshold }) => ({
        url: `/analytics/stock-thresholds/${encodeURIComponent(id || resourceTypeId)}/${encodeURIComponent(level !== undefined ? level : threshold)}`,
        method: 'PATCH',
      }),
      invalidatesTags: ['DeptStock'],
    }),

    // Rejection & Request Management
    rejectRequest: builder.mutation({
      query: ({ id, reason, rejectionReason }) => ({
        url: `/requests/${encodeURIComponent(id)}/reject`,
        method: 'POST',
        body: { reason: reason || rejectionReason },
      }),
      invalidatesTags: ['Requests'],
    }),

    // Department Summaries & Overviews
    getDeptSummary: builder.query({
      query: () => '/analytics/department-summary',
      providesTags: ['Requests', 'DeptStock'],
    }),

    getDeptHeadOverview: builder.query({
      query: () => '/analytics/department-summary',
      providesTags: ['Requests', 'DeptStock'],
    }),

    // Department Resources
    getDeptResources: builder.query({
      query: (params) => ({
        url: '/resources',
        params,
      }),
      providesTags: ['DeptResources'],
    }),

    approveResourceExtension: builder.mutation({
      query: (id) => ({
        url: `/resources/${encodeURIComponent(typeof id === 'object' ? id.id : id)}/approve-extension`,
        method: 'POST',
      }),
      invalidatesTags: ['DeptResources', 'Requests'],
    }),

    rejectResourceExtension: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/resources/${encodeURIComponent(id)}/reject-extension`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DeptResources', 'Requests'],
    }),

    // Department Procurements
    getDeptProcurements: builder.query({
      query: (params) => ({
        url: '/procurements',
        params,
      }),
      providesTags: ['Procurement'],
    }),

    createDeptProcurement: builder.mutation({
      query: (body) => ({
        url: '/procurements',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Procurement'],
    }),

    approveDeptProcurement: builder.mutation({
      query: (id) => ({
        url: `/procurements/${encodeURIComponent(typeof id === 'object' ? id.id : id)}/department-approve`,
        method: 'POST',
      }),
      invalidatesTags: ['Procurement'],
    }),

    rejectDeptProcurement: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/procurements/${encodeURIComponent(id)}/department-reject`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Procurement'],
    }),

    editDeptProcurement: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/procurements/${encodeURIComponent(id)}/edit`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Procurement'],
    }),

    cancelDeptProcurement: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/procurements/${encodeURIComponent(id)}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Procurement'],
    }),

    getDeptAnalytics: builder.query({
      query: () => '/analytics/department-summary',
      providesTags: ['DeptStock', 'Requests'],
    }),

    // Aliases matching previously drafted names
    approveDeptRequest: builder.mutation({
      query: (id) => ({
        url: `/requests/${encodeURIComponent(typeof id === 'object' ? id.id : id)}/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['Requests', 'DeptStock', 'AllocationQueue'],
    }),

    rejectDeptRequest: builder.mutation({
      query: ({ id, reason, rejectionReason }) => ({
        url: `/requests/${encodeURIComponent(id)}/reject`,
        method: 'POST',
        body: { reason: reason || rejectionReason },
      }),
      invalidatesTags: ['Requests'],
    }),

    updateStockThreshold: builder.mutation({
      query: ({ id, level, resourceTypeId, threshold }) => ({
        url: `/analytics/stock-thresholds/${encodeURIComponent(id || resourceTypeId)}/${encodeURIComponent(level !== undefined ? level : threshold)}`,
        method: 'PATCH',
      }),
      invalidatesTags: ['DeptStock'],
    }),
  }),
});

export const {
  useGetDeptIncomingRequestsQuery,
  useApproveRequestMutation,
  useGetDeptStockQuery,
  useUpdateThresholdMutation,
  useRejectRequestMutation,
  useGetDeptSummaryQuery,
  useGetDeptHeadOverviewQuery,
  useGetDeptResourcesQuery,
  useApproveResourceExtensionMutation,
  useRejectResourceExtensionMutation,
  useGetDeptProcurementsQuery,
  useCreateDeptProcurementMutation,
  useApproveDeptProcurementMutation,
  useRejectDeptProcurementMutation,
  useEditDeptProcurementMutation,
  useCancelDeptProcurementMutation,
  useGetDeptAnalyticsQuery,
  useApproveDeptRequestMutation,
  useRejectDeptRequestMutation,
  useUpdateStockThresholdMutation,
} = deptHeadApi;
