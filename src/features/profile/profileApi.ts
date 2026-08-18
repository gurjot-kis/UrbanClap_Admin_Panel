import { baseApi } from "../../store/api/baseApi"
import type {
  GetAdminProfileResponse,
  UpdateAdminProfilePayload,
  UpdateAdminProfileResponse,
} from "./profileTypes"

export const profileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminProfile: builder.query<GetAdminProfileResponse, void>({
      query: () => ({
        url: "/admin/profile",
        method: "GET",
      }),
      extraOptions: {
        requiresAuth: true,
      },
      providesTags: ["Profile"],
    }),

    updateAdminProfile: builder.mutation<
      UpdateAdminProfileResponse,
      UpdateAdminProfilePayload
    >({
      query: (payload) => ({
        url: "/admin/profile",
        method: "PATCH",
        body: payload,
      }),
      extraOptions: {
        requiresAuth: true,
      },
      invalidatesTags: ["Profile"],
    }),
  }),
})

export const {
  useGetAdminProfileQuery,
  useUpdateAdminProfileMutation,
} = profileApi