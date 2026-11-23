import { baseApi } from '../../baseApi';

/**
 * Inventory Officer Actor Slice / API
 * Assigned to: Person 4
 */
export const inventoryOfficerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInvOfficerOverview: builder.query({
      query: () => '/inventory-officer/overview',
      providesTags: ['Inventory', 'AllocationQueue', 'Returns'],
    }),
    getInventoryBoard: builder.query({
      query: (params) => ({
        url: '/inventory-officer/board',
        params,
      }),
      providesTags: ['Inventory'],
    }),
    getAllocationQueue: builder.query({
      query: () => '/inventory-officer/allocations',
      providesTags: ['AllocationQueue'],
    }),
    allocateResource: builder.mutation({
      query: ({ requestId, assetTag, notes }) => ({
        url: `/inventory-officer/allocations/${encodeURIComponent(requestId)}/allocate`,
        method: 'POST',
        body: { assetTag, notes },
      }),
      invalidatesTags: ['AllocationQueue', 'Inventory', 'Requests'],
    }),
    getPendingReturns: builder.query({
      query: () => '/inventory-officer/returns',
      providesTags: ['Returns'],
    }),
    processReturn: builder.mutation({
      query: ({ returnId, condition, destination, notes }) => ({
        url: `/inventory-officer/returns/${encodeURIComponent(returnId)}/process`,
        method: 'POST',
        body: { condition, destination, notes },
      }),
      invalidatesTags: ['Returns', 'Inventory', 'Maintenance', 'Requests'],
    }),
    registerNewResource: builder.mutation({
      query: (resourceData) => ({
        url: '/inventory-officer/resources',
        method: 'POST',
        body: resourceData,
      }),
      invalidatesTags: ['Inventory', 'DeptStock'],
    }),
  }),
});

export const {
  useGetInvOfficerOverviewQuery,
  useGetInventoryBoardQuery,
  useGetAllocationQueueQuery,
  useAllocateResourceMutation,
  useGetPendingReturnsQuery,
  useProcessReturnMutation,
  useRegisterNewResourceMutation,
} = inventoryOfficerApi;
