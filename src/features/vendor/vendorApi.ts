import { baseApi } from "../../store/api/baseApi";
import type {
  GetVendorsParams,
  GetVendorsResponse,
  UpdateVendorAvailabilityPayload,
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
  }),
});

export const {
  useFetchVendorsQuery,
  useUpdateVendorStatusMutation,
  useUpdateVendorVerificationMutation,
  useUpdateVendorAvailabilityMutation,
} = vendorApi;
