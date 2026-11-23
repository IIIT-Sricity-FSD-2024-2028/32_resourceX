import { baseApi } from '../store/baseApi';

/**
 * Requestor Sector API (Person 3)
 * Injects requestor endpoints into baseApi.
 */
export const requestorApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Core Key Endpoints for Person 3
    getMyRequests: builder.query({
      query: (params) => ({
        url: '/requests',
        params,
      }),
      providesTags: ['Requests'],
    }),

    createRequest: builder.mutation({
      query: (requestData) => ({
        url: '/requests',
        method: 'POST',
        body: requestData,
      }),
      invalidatesTags: ['Requests', 'DeptStock', 'AllocationQueue'],
    }),

    confirmReceipt: builder.mutation({
      query: (requestId) => ({
        url: `/requests/${encodeURIComponent(requestId)}/receipt`,
        method: 'POST',
      }),
      invalidatesTags: ['Requests', 'Inventory', 'DeptResources'],
    }),

    // Additional Request Management
    editRequest: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/requests/${encodeURIComponent(id)}/edit`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Requests'],
    }),

    cancelRequest: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/requests/${encodeURIComponent(id)}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Requests', 'DeptStock'],
    }),

    // Requestor Analytics & Summary
    getRequestorSummary: builder.query({
      query: () => '/analytics/requestor-summary',
      providesTags: ['Requests'],
    }),

    getRequestorOverview: builder.query({
      query: () => '/analytics/requestor-summary',
      providesTags: ['Requests'],
    }),

    // Department & Catalog Queries
    getDepartments: builder.query({
      query: () => '/departments',
      providesTags: ['AdminDepts'],
    }),

    getResourceCatalog: builder.query({
      query: (params) => ({
        url: '/resources/catalog',
        params,
      }),
      providesTags: ['DeptResources'],
    }),

    getResourceAvailability: builder.query({
      query: ({ department, type }) => ({
        url: '/resources/availability',
        params: { department, type },
      }),
    }),

    // Requestor Allocated Resources
    getMyResources: builder.query({
      query: (params) => ({
        url: '/resources',
        params,
      }),
      providesTags: ['Requests', 'DeptResources'],
    }),

    requestMaintenance: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/resources/${encodeURIComponent(id)}/maintenance-request`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Requests', 'DeptResources', 'Maintenance'],
    }),

    initiateReturn: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/resources/${encodeURIComponent(id)}/initiate-return`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Requests', 'DeptResources', 'Inventory', 'Returns'],
    }),

    confirmRepaired: builder.mutation({
      query: (id) => ({
        url: `/resources/${encodeURIComponent(id)}/confirm-repaired`,
        method: 'POST',
      }),
      invalidatesTags: ['Requests', 'DeptResources'],
    }),

    requestExtension: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/resources/${encodeURIComponent(id)}/request-extension`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Requests', 'DeptResources'],
    }),

    // Activity & History
    getReturnHistory: builder.query({
      query: () => '/returns/history',
      providesTags: ['Returns'],
    }),

    getMaintenanceHistory: builder.query({
      query: () => '/maintenance/history',
      providesTags: ['MaintenanceHistory'],
    }),

    // Procurement Requests
    getProcurements: builder.query({
      query: (params) => ({
        url: '/procurements',
        params,
      }),
      providesTags: ['Procurement'],
    }),

    createProcurement: builder.mutation({
      query: (body) => ({
        url: '/procurements',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Procurement'],
    }),

    // Aliases for compatibility
    createResourceRequest: builder.mutation({
      query: (requestData) => ({
        url: '/requests',
        method: 'POST',
        body: requestData,
      }),
      invalidatesTags: ['Requests', 'DeptStock', 'AllocationQueue'],
    }),

    getRequestorReturnHistory: builder.query({
      query: () => '/returns/history',
      providesTags: ['Returns'],
    }),

    getRequestorMaintenanceHistory: builder.query({
      query: () => '/maintenance/history',
      providesTags: ['MaintenanceHistory'],
    }),
  }),
});

export const {
  useGetMyRequestsQuery,
  useCreateRequestMutation,
  useConfirmReceiptMutation,
  useEditRequestMutation,
  useCancelRequestMutation,
  useGetRequestorSummaryQuery,
  useGetRequestorOverviewQuery,
  useGetDepartmentsQuery,
  useGetResourceCatalogQuery,
  useGetResourceAvailabilityQuery,
  useGetMyResourcesQuery,
  useRequestMaintenanceMutation,
  useInitiateReturnMutation,
  useConfirmRepairedMutation,
  useRequestExtensionMutation,
  useGetReturnHistoryQuery,
  useGetMaintenanceHistoryQuery,
  useGetProcurementsQuery,
  useCreateProcurementMutation,
  useCreateResourceRequestMutation,
  useGetRequestorReturnHistoryQuery,
  useGetRequestorMaintenanceHistoryQuery,
} = requestorApi;
