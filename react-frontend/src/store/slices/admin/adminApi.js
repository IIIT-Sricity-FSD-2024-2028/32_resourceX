import { baseApi } from '../../baseApi';

/**
 * System Admin Actor Slice / API
 * Assigned to: Person 2
 */
export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminOverview: builder.query({
      query: () => '/admin/overview',
      providesTags: ['AdminUsers', 'AdminDepts'],
    }),
    getUsers: builder.query({
      query: (params) => ({
        url: '/admin/users',
        params,
      }),
      providesTags: ['AdminUsers'],
    }),
    createUser: builder.mutation({
      query: (user) => ({
        url: '/admin/users',
        method: 'POST',
        body: user,
      }),
      invalidatesTags: ['AdminUsers'],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/users/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['AdminUsers'],
    }),
    getDepartments: builder.query({
      query: () => '/admin/departments',
      providesTags: ['AdminDepts'],
    }),
    createDepartment: builder.mutation({
      query: (dept) => ({
        url: '/admin/departments',
        method: 'POST',
        body: dept,
      }),
      invalidatesTags: ['AdminDepts'],
    }),
    getSubscription: builder.query({
      query: () => '/admin/subscription',
      providesTags: ['AdminSubscription'],
    }),
    getAdminTickets: builder.query({
      query: () => '/admin/support',
      providesTags: ['AdminTickets'],
    }),
    createAdminTicket: builder.mutation({
      query: (ticket) => ({
        url: '/admin/support',
        method: 'POST',
        body: ticket,
      }),
      invalidatesTags: ['AdminTickets'],
    }),
    getAdminAnnouncements: builder.query({
      query: () => '/admin/announcements',
      providesTags: ['AdminAnnouncements'],
    }),
    replyAdminAnnouncement: builder.mutation({
      query: ({ id, reply }) => ({
        url: `/admin/announcements/${encodeURIComponent(id)}/reply`,
        method: 'POST',
        body: { reply },
      }),
      invalidatesTags: ['AdminAnnouncements'],
    }),
  }),
});

export const {
  useGetAdminOverviewQuery,
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useGetSubscriptionQuery,
  useGetAdminTicketsQuery,
  useCreateAdminTicketMutation,
  useGetAdminAnnouncementsQuery,
  useReplyAdminAnnouncementMutation,
} = adminApi;
