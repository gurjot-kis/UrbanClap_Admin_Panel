import { baseApi } from "../../store/api/baseApi";
import type {
  GetCategoriesParams,
  GetCategoriesResponse,
} from "./categoryTypes";

export const categoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<GetCategoriesResponse, GetCategoriesParams>({
      query: ({ page, limit, search, level }) => {
        const params = new URLSearchParams();
        if (page !== undefined) params.set("page", String(page));
        if (limit !== undefined) params.set("limit", String(limit));
        if (search?.trim()) params.set("search", search.trim());
        if (level !== undefined) params.set("level", String(level));

        const qs = params.toString();
        return {
          url: `/categories/admin${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },
      extraOptions: { requiresAuth: true },
      providesTags: ["Category"],
    }),

    upadteCategoryStatus: builder.mutation<unknown, string>({
      query: (categoryId) => ({
        url: `/categories/${categoryId}/status`,
        method: "PATCH",
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Category"],
    }),
    createCategory: builder.mutation<unknown, FormData>({
      query: (formData) => ({
        url: "/categories",
        method: "POST",
        body: formData,
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Category"],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useUpadteCategoryStatusMutation,
  useCreateCategoryMutation,
} = categoryApi;
