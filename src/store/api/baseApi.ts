import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import type { RootState } from "../store";
import { getStoredToken } from "../../utils/auth";

const baseQuery = fetchBaseQuery({
  baseUrl:
    (import.meta.env.VITE_CHAT_API_URL as string) ||
    "http://localhost:5000/api",
  credentials: "include",
});

const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  { requiresAuth?: boolean }
> = async (args, api, extraOptions) => {
  const token = (api.getState() as RootState).auth.token ?? getStoredToken();

  if (extraOptions?.requiresAuth && token) {
    if (typeof args === "string") {
      args = {
        url: args,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
    } else {
      args = {
        ...args,
        headers: {
          ...args.headers,
          Authorization: `Bearer ${token}`,
        },
      };
    }
  }

  return baseQuery(args, api, extraOptions);
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["Auth", "Conversation", "Message", "Category", "Product"],
  endpoints: () => ({}),
});
