import { baseApi } from '../../baseApi';

/**
 * Platform Owner Actor Slice / API
 * Assigned to: Person 6
 */
export const ownerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOwnerOverview: builder.query({
      query: () => '/owner/overview',
      providesTags: ['Owner'],
    }),
    getPlatformRevenue: builder.query({
      query: () => '/owner/revenue',
      providesTags: ['Owner'],
    }),
    getOrganizations: builder.query({
      query: () => '/owner/organizations',
      providesTags: ['Owner'],
    }),
    getPlatformEmployees: builder.query({
      query: () => '/owner/employees',
      providesTags: ['Owner', 'Employee'],
    }),
    createPlatformEmployee: builder.mutation({
      query: (employeeData) => ({
        url: '/owner/employees',
        method: 'POST',
        body: employeeData,
      }),
      invalidatesTags: ['Owner', 'Employee'],
    }),
    getPendingRegistrations: builder.query({
      query: () => '/owner/registrations',
      providesTags: ['Owner'],
    }),
    approveRegistration: builder.mutation({
      query: ({ id, action, notes }) => ({
        url: `/owner/registrations/${encodeURIComponent(id)}/${action}`,
        method: 'POST',
        body: { notes },
      }),
      invalidatesTags: ['Owner'],
    }),
  }),
});

export const {
  useGetOwnerOverviewQuery,
  useGetPlatformRevenueQuery,
  useGetOrganizationsQuery,
  useGetPlatformEmployeesQuery,
  useCreatePlatformEmployeeMutation,
  useGetPendingRegistrationsQuery,
  useApproveRegistrationMutation,
} = ownerApi;
