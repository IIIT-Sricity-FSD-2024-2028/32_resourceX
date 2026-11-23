import { baseApi } from '../../baseApi';

/**
 * Maintenance Officer Actor Slice / API
 * Assigned to: Person 4
 */
export const maintenanceOfficerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMaintOfficerOverview: builder.query({
      query: () => '/maintenance-officer/overview',
      providesTags: ['Maintenance', 'MaintenanceHistory'],
    }),
    getMaintenanceQueue: builder.query({
      query: (params) => ({
        url: '/maintenance-officer/queue',
        params,
      }),
      providesTags: ['Maintenance'],
    }),
    updateMaintenanceStatus: builder.mutation({
      query: ({ ticketId, status, diagnosticNotes, estimatedCost }) => ({
        url: `/maintenance-officer/queue/${encodeURIComponent(ticketId)}/status`,
        method: 'PATCH',
        body: { status, diagnosticNotes, estimatedCost },
      }),
      invalidatesTags: ['Maintenance'],
    }),
    completeRepair: builder.mutation({
      query: ({ ticketId, resolutionNotes, actualCost }) => ({
        url: `/maintenance-officer/queue/${encodeURIComponent(ticketId)}/complete`,
        method: 'POST',
        body: { resolutionNotes, actualCost },
      }),
      invalidatesTags: ['Maintenance', 'Inventory', 'MaintenanceHistory'],
    }),
    scrapResource: builder.mutation({
      query: ({ ticketId, scrapReason, notes }) => ({
        url: `/maintenance-officer/queue/${encodeURIComponent(ticketId)}/scrap`,
        method: 'POST',
        body: { scrapReason, notes },
      }),
      invalidatesTags: ['Maintenance', 'Inventory', 'MaintenanceHistory'],
    }),
    getMaintenanceHistory: builder.query({
      query: (params) => ({
        url: '/maintenance-officer/history',
        params,
      }),
      providesTags: ['MaintenanceHistory'],
    }),
  }),
});

export const {
  useGetMaintOfficerOverviewQuery,
  useGetMaintenanceQueueQuery,
  useUpdateMaintenanceStatusMutation,
  useCompleteRepairMutation,
  useScrapResourceMutation,
  useGetMaintenanceHistoryQuery,
} = maintenanceOfficerApi;
