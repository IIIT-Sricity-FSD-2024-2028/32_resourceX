import { baseApi } from '../../baseApi';

/**
 * Department Head Actor Slice / API
 * Assigned to: Person 3
 */
export const deptHeadApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDeptHeadOverview: builder.query({
      query: () => '/dept-head/overview',
      providesTags: ['Requests', 'DeptStock'],
    }),
    getDeptIncomingRequests: builder.query({
      query: () => '/dept-head/requests',
      providesTags: ['Requests'],
    }),
    approveDeptRequest: builder.mutation({
      query: ({ id, comments }) => ({
        url: `/dept-head/requests/${encodeURIComponent(id)}/approve`,
        method: 'PATCH',
        body: { comments },
      }),
      invalidatesTags: ['Requests', 'DeptStock', 'AllocationQueue'],
    }),
    rejectDeptRequest: builder.mutation({
      query: ({ id, rejectionReason }) => ({
        url: `/dept-head/requests/${encodeURIComponent(id)}/reject`,
        method: 'PATCH',
        body: { rejectionReason },
      }),
      invalidatesTags: ['Requests'],
    }),
    getDeptResources: builder.query({
      query: (params) => ({
        url: '/dept-head/resources',
        params,
      }),
      providesTags: ['DeptResources'],
    }),
    getDeptStock: builder.query({
      query: () => '/dept-head/stock',
      providesTags: ['DeptStock'],
    }),
    updateStockThreshold: builder.mutation({
      query: ({ resourceTypeId, threshold }) => ({
        url: `/dept-head/stock/${encodeURIComponent(resourceTypeId)}/threshold`,
        method: 'PATCH',
        body: { threshold },
      }),
      invalidatesTags: ['DeptStock'],
    }),
    getDeptAnalytics: builder.query({
      query: () => '/dept-head/analytics',
      providesTags: ['DeptStock', 'Requests'],
    }),
  }),
});

export const {
  useGetDeptHeadOverviewQuery,
  useGetDeptIncomingRequestsQuery,
  useApproveDeptRequestMutation,
  useRejectDeptRequestMutation,
  useGetDeptResourcesQuery,
  useGetDeptStockQuery,
  useUpdateStockThresholdMutation,
  useGetDeptAnalyticsQuery,
} = deptHeadApi;
