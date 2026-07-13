import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Conversation, Message } from "./chatTypes";

interface ChatState {
  selectedConversation: Conversation | null;
  messages: Message[];
  typingUsers: Record<string, Record<string, string>>; // conversationId -> { userId: userName }
  onlineUsers: string[]; // list of user IDs
  hasMore: boolean;
  currentPage: number;
  replyingToMessage: Message | null;
}

const initialState: ChatState = {
  selectedConversation: null,
  messages: [],
  typingUsers: {},
  onlineUsers: [],
  hasMore: false,
  currentPage: 1,
  replyingToMessage: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setSelectedConversation: (
      state,
      action: PayloadAction<Conversation | null>,
    ) => {
      state.selectedConversation = action.payload;
      state.replyingToMessage = null;
    },

    clearSelectedConversation: (state) => {
      state.selectedConversation = null;
      state.messages = [];
      state.hasMore = false;
      state.currentPage = 1;
    },

    setMessages: (
      state,
      action: PayloadAction<{ messages: Message[]; hasMore: boolean; page: number }>
    ) => {
      state.messages = action.payload.messages;
      state.hasMore = action.payload.hasMore;
      state.currentPage = action.payload.page;
    },

    prependMessages: (
      state,
      action: PayloadAction<{ messages: Message[]; hasMore: boolean; page: number }>
    ) => {
      const existingIds = new Set(state.messages.map((m) => m._id));
      const uniquePrepended = action.payload.messages.filter((m) => !existingIds.has(m._id));
      state.messages = [...uniquePrepended, ...state.messages];
      state.hasMore = action.payload.hasMore;
      state.currentPage = action.payload.page;
    },

    addMessage: (state, action: PayloadAction<Message>) => {
      if (
        state.selectedConversation &&
        action.payload.conversation === state.selectedConversation._id
      ) {
        const exists = state.messages.some((msg) => msg._id === action.payload._id);
        if (!exists) {
          state.messages.push(action.payload);
        }
      }
    },

    markMessagesAsRead: (
      state,
      action: PayloadAction<{ conversationId: string; userId: string }>
    ) => {
      const { conversationId, userId } = action.payload;
      if (
        state.selectedConversation &&
        state.selectedConversation._id === conversationId
      ) {
        state.messages = state.messages.map((msg) => {
          const alreadyRead = msg.readBy.some((r: any) => {
            const readerId = typeof r === "string" ? r : r.user;
            return readerId === userId;
          });

          if (!alreadyRead) {
            return {
              ...msg,
              readBy: [...msg.readBy, { user: userId, readAt: new Date().toISOString() }],
            };
          }
          return msg;
        });
      }
    },

    clearMessages: (state) => {
      state.messages = [];
      state.hasMore = false;
      state.currentPage = 1;
    },

    setUserTyping: (
      state,
      action: PayloadAction<{ conversationId: string; userId: string; userName: string }>,
    ) => {
      const { conversationId, userId, userName } = action.payload;
      if (!state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = {};
      }
      state.typingUsers[conversationId][userId] = userName;
    },

    setUserStopTyping: (
      state,
      action: PayloadAction<{ conversationId: string; userId: string }>,
    ) => {
      const { conversationId, userId } = action.payload;
      if (state.typingUsers[conversationId]) {
        delete state.typingUsers[conversationId][userId];
      }
    },

    setOnlineUsers: (state, action: PayloadAction<string[]>) => {
      state.onlineUsers = action.payload;
    },

    addUserOnline: (state, action: PayloadAction<string>) => {
      if (!state.onlineUsers.includes(action.payload)) {
        state.onlineUsers.push(action.payload);
      }
    },

    removeUserOffline: (state, action: PayloadAction<string>) => {
      state.onlineUsers = state.onlineUsers.filter((id) => id !== action.payload);
    },

    setReplyingToMessage: (
      state,
      action: PayloadAction<Message | null>,
    ) => {
      state.replyingToMessage = action.payload;
    },

    resetChatState: (state) => {
      state.selectedConversation = null;
      state.messages = [];
      state.typingUsers = {};
      state.onlineUsers = [];
      state.hasMore = false;
      state.currentPage = 1;
      state.replyingToMessage = null;
    },
  },
});

export const {
  setSelectedConversation,
  clearSelectedConversation,
  setMessages,
  prependMessages,
  addMessage,
  markMessagesAsRead,
  clearMessages,
  setUserTyping,
  setUserStopTyping,
  setOnlineUsers,
  addUserOnline,
  removeUserOffline,
  setReplyingToMessage,
  resetChatState,
} = chatSlice.actions;

export default chatSlice.reducer;
