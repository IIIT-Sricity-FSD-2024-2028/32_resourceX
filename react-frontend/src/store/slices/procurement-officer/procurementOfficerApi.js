import { baseApi } from '../../baseApi';

/**
 * Procurement Officer Actor Slice / API
 * Assigned to: Person 5
 */
export const procurementOfficerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProcOfficerOverview: builder.query({
      query: () => '/procurement-officer/overview',
      providesTags: ['Procurement'],
    }),
    getDepartmentIndents: builder.query({
      query: () => '/procurement-officer/indents',
      providesTags: ['Procurement'],
    }),
    createPurchaseOrder: builder.mutation({
      query: (orderData) => ({
        url: '/procurement-officer/orders',
        method: 'POST',
        body: orderData,
      }),
      invalidatesTags: ['Procurement', 'Registrar'],
    }),
    getProcurementOrders: builder.query({
      query: () => '/procurement-officer/orders',
      providesTags: ['Procurement'],
    }),
    updateDeliveryStatus: builder.mutation({
      query: ({ orderId, deliveryStatus, deliveryDate }) => ({
        url: `/procurement-officer/orders/${encodeURIComponent(orderId)}/delivery`,
        method: 'PATCH',
        body: { deliveryStatus, deliveryDate },
      }),
      invalidatesTags: ['Procurement', 'Inventory'],
    }),
    uploadInvoice: builder.mutation({
      query: ({ orderId, formData }) => ({
        url: `/procurement-officer/orders/${encodeURIComponent(orderId)}/invoice`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Procurement'],
    }),
    getPurchaseHistory: builder.query({
      query: () => '/procurement-officer/history',
      providesTags: ['Procurement'],
    }),
  }),
});

export const {
  useGetProcOfficerOverviewQuery,
  useGetDepartmentIndentsQuery,
  useCreatePurchaseOrderMutation,
  useGetProcurementOrdersQuery,
  useUpdateDeliveryStatusMutation,
  useUploadInvoiceMutation,
  useGetPurchaseHistoryQuery,
} = procurementOfficerApi;
