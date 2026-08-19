import { baseApi } from "../../store/api/baseApi";
import type { GetDashboardResponse } from "./dashboardTypes";

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboard: builder.query<GetDashboardResponse, void>({
      query: () => ({
        url: "/admin/dashboard",
        method: "GET",
      }),
      extraOptions: {
        requiresAuth: true,
      },
    }),
  }),
});

export const { useGetDashboardQuery } = dashboardApi;
