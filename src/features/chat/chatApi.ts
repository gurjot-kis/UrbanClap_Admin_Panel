import { baseApi } from "../../store/api/baseApi";
import type { ApiResponse, User } from "../auth/authTypes";
import type {
  Conversation,
  GetConversationResponse,
  GetMessagesResponse,
  SendMessageRequest,
  SendMessageResponse,
  UploadMediaResponse,
  UploadMultipleMediaResponse,
} from "./chatTypes";

export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all conversations
    getConversations: builder.query<GetConversationResponse, void>({
      query: () => ({
        url: "/conversations",
        method: "GET",
      }),
      extraOptions: {
        requiresAuth: true,
      },
      providesTags: ["Conversation"],
    }),

    // Get messages of a conversation
    getMessages: builder.query<
      GetMessagesResponse,
      {
        conversationId: string;
        page?: number;
        limit?: number;
      }
    >({
      query: ({ conversationId, page = 1, limit = 30 }) => ({
        url: `/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      extraOptions: {
        requiresAuth: true,
      },
      providesTags: (_result, _error, { conversationId }) => [
        { type: "Message", id: conversationId },
      ],
    }),

    // Send message (REST)
    sendMessage: builder.mutation<SendMessageResponse, SendMessageRequest>({
      query: (body) => ({
        url: "/messages",
        method: "POST",
        body,
      }),
      extraOptions: {
        requiresAuth: true,
      },

      invalidatesTags: (_result, _error, { conversationId }) => [
        { type: "Message", id: conversationId },
        "Conversation",
      ],
    }),

    uploadMedia: builder.mutation<UploadMediaResponse, FormData>({
      query: (formData) => ({
        url: "/messages/upload",
        method: "POST",
        body: formData,
      }),
      extraOptions: {
        requiresAuth: true,
      },
    }),

    uploadMultipleMedia: builder.mutation<UploadMultipleMediaResponse, FormData>({
      query: (formData) => ({
        url: "/messages/upload-multiple",
        method: "POST",
        body: formData,
      }),
      extraOptions: {
        requiresAuth: true,
      },
    }),

    getUsers: builder.query<ApiResponse<User[]>, string>({
      query: (search = "") => `/users/chat-search${search ? `?search=${encodeURIComponent(search)}` : ""}`,
      extraOptions: {
        requiresAuth: true,
      },
    }),

    getSuperadmins: builder.query<ApiResponse<User[]>, void>({
      query: () => ({
        url: "/users/superadmins",
        method: "GET",
      }),
      extraOptions: {
        requiresAuth: true,
      },
    }),

    createPrivateConversation: builder.mutation<ApiResponse<Conversation>, { receiverId: string }>({
      query: (body) => ({
        url: "/conversations/private",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Conversation"],
      extraOptions: {
        requiresAuth: true,
      },
    }),

    deleteConversation: builder.mutation<{ success: boolean; message: string }, string>({
      query: (conversationId) => ({
        url: `/conversations/${conversationId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Conversation"],
      extraOptions: {
        requiresAuth: true,
      },
    }),

    endConversation: builder.mutation<{ success: boolean; message: string }, { conversationId: string; end_chat: boolean; rating?: number }>({
      query: ({ conversationId, end_chat, rating }) => ({
        url: `/conversations/${conversationId}/end-chat`,
        method: "POST",
        body: { end_chat, ...(rating !== undefined && { rating }) },
      }),
      invalidatesTags: ["Conversation"],
      extraOptions: {
        requiresAuth: true,
      },
    }),

    rateConversation: builder.mutation<{ success: boolean; message: string }, { conversationId: string; rating: number }>({
      query: ({ conversationId, rating }) => ({
        url: `/conversations/${conversationId}/rate`,
        method: "POST",
        body: { rating },
      }),
      invalidatesTags: ["Conversation"],
      extraOptions: {
        requiresAuth: true,
      },
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useLazyGetMessagesQuery,
  useSendMessageMutation,
  useUploadMediaMutation,
  useUploadMultipleMediaMutation,
  useGetUsersQuery,
  useGetSuperadminsQuery,
  useCreatePrivateConversationMutation,
  useDeleteConversationMutation,
  useEndConversationMutation,
  useRateConversationMutation,
} = chatApi;
