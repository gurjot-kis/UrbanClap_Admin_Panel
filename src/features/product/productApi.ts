import { baseApi } from "../../store/api/baseApi";
import type { GetProductsParams, GetProductsResponse, ProductStatus } from "./productTypes";

export interface UpdateProductStatusPayload {
  id: string;
  status: ProductStatus;
}

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchProducts: builder.query<GetProductsResponse, GetProductsParams>({
      query: ({ page, limit, search, categoryId, subCategoryId }) => {
        const params = new URLSearchParams();
        if (page !== undefined) params.set("page", String(page));
        if (limit !== undefined) params.set("limit", String(limit));
        if (search?.trim()) params.set("search", search.trim());
        if (categoryId) params.set("categoryId", categoryId);
        if (subCategoryId) params.set("subCategoryId", subCategoryId);

        const qs = params.toString();
        return {
          url: `/admin/products${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },
      extraOptions: { requiresAuth: true },
      providesTags: ["Product"],
    }),

    updateProductStatus: builder.mutation<void, UpdateProductStatusPayload>({
      query: ({ id, status }) => ({
        url: `/admin/product/${id}/status`,
        method: "PATCH",
        body: {
          status,
        },
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Product"],
    }),

    deleteProduct: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/products/${id}`,
        method: "DELETE",
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Product"],
    }),
  }),
});

export const {
  useFetchProductsQuery,
  useUpdateProductStatusMutation,
  useDeleteProductMutation,
} = productApi;
