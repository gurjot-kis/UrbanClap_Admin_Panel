import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { getStoredUser } from "../../utils/auth";
import { logout } from "./authSlice";

interface RoleState {
  currentRole: "SuperAdmin" | "Vendor" | null;
  isSuperAdmin: boolean;
  isVendor: boolean;
}

const getInitialRoleState = (): RoleState => {
  const user = getStoredUser();
  const role = user?.role;
  return {
    currentRole: (role === "SuperAdmin" || role === "Vendor") ? role : null,
    isSuperAdmin: role === "SuperAdmin",
    isVendor: role === "Vendor",
  };
};

const roleSlice = createSlice({
  name: "role",
  initialState: getInitialRoleState(),
  reducers: {
    setRole: (state, action: PayloadAction<"SuperAdmin" | "Vendor" | null>) => {
      state.currentRole = action.payload;
      state.isSuperAdmin = action.payload === "SuperAdmin";
      state.isVendor = action.payload === "Vendor";
    },
    clearRole: (state) => {
      state.currentRole = null;
      state.isSuperAdmin = false;
      state.isVendor = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, (state) => {
      state.currentRole = null;
      state.isSuperAdmin = false;
      state.isVendor = false;
    });
  },
});

export const { setRole, clearRole } = roleSlice.actions;
export default roleSlice.reducer;
