import { baseApi } from '../../baseApi';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPublicOrganizations: builder.query({
      query: () => '/organizations/public',
    }),
    getMockUser: builder.query({
      query: ({ role, orgId }) => {
        let url = `/users/mock?role=${encodeURIComponent(role)}`;
        if (orgId && orgId !== 'PLATFORM') {
          url += `&orgId=${encodeURIComponent(orgId)}`;
        }
        return url;
      },
    }),
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth', 'Notifications'],
    }),
    requestPasswordReset: builder.mutation({
      query: (email) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: { email: email.toLowerCase().trim() },
      }),
    }),
    verifyOtp: builder.mutation({
      query: ({ email, otp }) => ({
        url: '/auth/verify-otp',
        method: 'POST',
        body: { email: email.toLowerCase().trim(), otp },
      }),
    }),
    resetPassword: builder.mutation({
      query: ({ resetToken, newPassword }) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: { resetToken, newPassword },
      }),
    }),
  }),
});

export const {
  useGetPublicOrganizationsQuery,
  useLazyGetMockUserQuery,
  useLoginMutation,
  useRequestPasswordResetMutation,
  useVerifyOtpMutation,
  useResetPasswordMutation,
} = authApi;
