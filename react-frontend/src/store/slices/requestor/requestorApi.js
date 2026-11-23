import { baseApi } from '../../baseApi';

/**
 * Requestor Actor Slice / API
 * Assigned to: Person 3
 */
export const requestorApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRequestorOverview: builder.query({
      query: () => '/requestor/overview',
      providesTags: ['Requests'],
    }),
    getMyRequests: builder.query({
      query: () => '/requestor/requests',
      providesTags: ['Requests'],
    }),
    createResourceRequest: builder.mutation({
      query: (requestData) => ({
        url: '/requestor/requests',
        method: 'POST',
        body: requestData,
      }),
      invalidatesTags: ['Requests', 'DeptStock'],
    }),
    getMyResources: builder.query({
      query: () => '/requestor/resources',
      providesTags: ['Requests'],
    }),
    confirmReceipt: builder.mutation({
      query: (requestId) => ({
        url: `/requestor/requests/${encodeURIComponent(requestId)}/confirm-receipt`,
        method: 'POST',
      }),
      invalidatesTags: ['Requests', 'Inventory'],
    }),
    initiateReturn: builder.mutation({
      query: ({ allocationId, reason, condition }) => ({
        url: `/requestor/resources/${encodeURIComponent(allocationId)}/return`,
        method: 'POST',
        body: { reason, condition },
      }),
      invalidatesTags: ['Requests', 'Inventory', 'Returns'],
    }),
    reportIssue: builder.mutation({
      query: ({ allocationId, issueDescription, priority }) => ({
        url: `/requestor/resources/${encodeURIComponent(allocationId)}/report-issue`,
        method: 'POST',
        body: { issueDescription, priority },
      }),
      invalidatesTags: ['Requests', 'Maintenance'],
    }),
    getRequestorReturnHistory: builder.query({
      query: () => '/requestor/history/returns',
      providesTags: ['Returns'],
    }),
    getRequestorMaintenanceHistory: builder.query({
      query: () => '/requestor/history/maintenance',
      providesTags: ['MaintenanceHistory'],
    }),
  }),
});

export const {
  useGetRequestorOverviewQuery,
  useGetMyRequestsQuery,
  useCreateResourceRequestMutation,
  useGetMyResourcesQuery,
  useConfirmReceiptMutation,
  useInitiateReturnMutation,
  useReportIssueMutation,
  useGetRequestorReturnHistoryQuery,
  useGetRequestorMaintenanceHistoryQuery,
} = requestorApi;
