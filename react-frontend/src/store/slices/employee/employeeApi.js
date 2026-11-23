import { baseApi } from '../../baseApi';

/**
 * Platform Employee Actor Slice / API
 * Assigned to: Person 6
 */
export const employeeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEmployeeOverview: builder.query({
      query: () => '/employee/overview',
      providesTags: ['Employee'],
    }),
    getAssignedInstitutions: builder.query({
      query: () => '/employee/institutions',
      providesTags: ['Employee'],
    }),
    getEmployeeSupportTickets: builder.query({
      query: () => '/employee/support',
      providesTags: ['Employee', 'AdminTickets'],
    }),
    resolveEmployeeTicket: builder.mutation({
      query: ({ id, resolutionNotes }) => ({
        url: `/employee/support/${encodeURIComponent(id)}/resolve`,
        method: 'PATCH',
        body: { resolutionNotes },
      }),
      invalidatesTags: ['Employee', 'AdminTickets'],
    }),
    broadcastAnnouncement: builder.mutation({
      query: (announcement) => ({
        url: '/employee/announcements',
        method: 'POST',
        body: announcement,
      }),
      invalidatesTags: ['Employee', 'AdminAnnouncements'],
    }),
  }),
});

export const {
  useGetEmployeeOverviewQuery,
  useGetAssignedInstitutionsQuery,
  useGetEmployeeSupportTicketsQuery,
  useResolveEmployeeTicketMutation,
  useBroadcastAnnouncementMutation,
} = employeeApi;
