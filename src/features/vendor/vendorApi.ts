import { baseApi } from "../../store/api/baseApi";
import type {
  CreateVendorPayload,
  GetVendorByIdResponse,
  GetVendorsParams,
  GetVendorsResponse,
  UpdateVendorAvailabilityPayload,
  UpdateVendorPayload,
  UpdateVendorResponse,
  UpdateVendorStatusPayload,
  UpdateVendorVerificationPayload,
} from "./vendorTypes";

export const vendorApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchVendors: builder.query<GetVendorsResponse, GetVendorsParams>({
      query: ({
        page,
        limit,
        search,
        status,
        category,
        isVendorVerified,
        isAvailableNow,
        sortBy,
        sortOrder,
      }) => {
        const params = new URLSearchParams();

        if (page !== undefined) params.set("page", String(page));
        if (limit !== undefined) params.set("limit", String(limit));
        if (search?.trim()) params.set("search", search.trim());
        if (status !== undefined) params.set("status", String(status));
        if (category) params.set("category", category);
        if (isVendorVerified !== undefined)
          params.set("isVendorVerified", String(isVendorVerified));
        if (isAvailableNow !== undefined)
          params.set("isAvailableNow", String(isAvailableNow));
        if (sortBy) params.set("sortBy", sortBy);
        if (sortOrder) params.set("sortOrder", sortOrder);
        const qs = params.toString();

        return {
          url: `/vendors${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },

      extraOptions: {
        requiresAuth: true,
      },

      providesTags: ["Vendor"],
    }),

    fetchVendorById: builder.query<GetVendorByIdResponse, string>({
      query: (userId) => ({
        url: `/vendors/${userId}`,
        method: "GET",
      }),

      extraOptions: {
        requiresAuth: true,
      },

      providesTags: ["Vendor"],
    }),

    createVendor: builder.mutation<UpdateVendorResponse, CreateVendorPayload>({
      query: (payload) => ({
        url: "/vendors",
        method: "POST",
        body: payload,
      }),

      extraOptions: {
        requiresAuth: true,
      },

      invalidatesTags: ["Vendor"],
    }),

    updateVendor: builder.mutation<
      UpdateVendorResponse,
      {
        userId: string;
        payload: UpdateVendorPayload;
      }
    >({
      query: ({ userId, payload }) => ({
        url: `/vendors/${userId}`,
        method: "PUT",
        body: payload,
      }),

      extraOptions: {
        requiresAuth: true,
      },

      invalidatesTags: ["Vendor"],
    }),

    updateVendorStatus: builder.mutation<
      UpdateVendorResponse,
      {
        userId: string;
        payload: UpdateVendorStatusPayload;
      }
    >({
      query: ({ userId, payload }) => ({
        url: `/vendors/${userId}/status`,
        method: "PATCH",
        body: payload,
      }),

      extraOptions: {
        requiresAuth: true,
      },

      invalidatesTags: ["Vendor"],
    }),

    updateVendorVerification: builder.mutation<
      UpdateVendorResponse,
      {
        userId: string;
        payload: UpdateVendorVerificationPayload;
      }
    >({
      query: ({ userId, payload }) => ({
        url: `/vendors/${userId}/verify`,
        method: "PATCH",
        body: payload,
      }),

      extraOptions: {
        requiresAuth: true,
      },

      invalidatesTags: ["Vendor"],
    }),

    updateVendorAvailability: builder.mutation<
      UpdateVendorResponse,
      {
        userId: string;
        payload: UpdateVendorAvailabilityPayload;
      }
    >({
      query: ({ userId, payload }) => ({
        url: `/vendors/${userId}/availability`,
        method: "PATCH",
        body: payload,
      }),

      extraOptions: {
        requiresAuth: true,
      },

      invalidatesTags: ["Vendor"],
    }),

    deleteVendor: builder.mutation<unknown, string>({
      query: (venderId: string) => ({
        url: `/vendors/${venderId}`,
        method: "DELETE",
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Vendor"],
    }),
  }),
});

export const {
  useFetchVendorsQuery,
  useFetchVendorByIdQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useUpdateVendorStatusMutation,
  useUpdateVendorVerificationMutation,
  useUpdateVendorAvailabilityMutation,
  useDeleteVendorMutation
} = vendorApi;
