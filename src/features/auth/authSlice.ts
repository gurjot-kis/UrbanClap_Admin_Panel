import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "./authTypes";
import { getStoredUser, getStoredToken } from "../../utils/auth";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Helper to load and map local admin auth data to Redux state
const getInitialState = (): AuthState => {
  const localToken = getStoredToken();
  const localUser = getStoredUser();

  if (localToken && localUser) {
    // Map local admin user to chat User interface
    const mappedUser: User = {
      _id: localUser._id,
      name: localUser.name,
      phone: localUser.email,
      gender: "unknown",
      status: localUser.status?.toString() || "active",
      avatar: localUser.profilePicture,
      role: localUser.role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      token: localToken,
    };
    return {
      user: mappedUser,
      token: localToken,
      isAuthenticated: true,
    };
  }

  return {
    user: null,
    token: null,
    isAuthenticated: false,
  };
};

const authSlice = createSlice({
  name: "auth",
  initialState: getInitialState(),
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User;
        token: string;
      }>,
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },

    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },
});

export const { setCredentials, logout, updateUser } = authSlice.actions;

export default authSlice.reducer;
