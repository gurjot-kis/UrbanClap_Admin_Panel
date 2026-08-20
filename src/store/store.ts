import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./api/baseApi";
import authReducer from "../features/auth/authSlice"
import chatReducer from "../features/chat/chatSlice";
import roleReducer from "../features/auth/roleSlice";

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
    chat: chatReducer,
    role: roleReducer,
  },
   middleware: (getDefaultMiddleware) =>
     getDefaultMiddleware({
       serializableCheck: {
         ignoredActions: ["chat/addPendingFiles"],
         ignoredPaths: ["chat.pendingFiles"],
       },
     }).concat(baseApi.middleware),
  });

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
