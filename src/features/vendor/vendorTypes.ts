export interface VendorCurrentLocation {
  type: string;
  coordinates: number[];
}

export interface Vendor {
  user_id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  code: string;
  gst_number: string;
  status: number;
  vendorCategories: string[];
  category: VendorCateoryDetails[];
  serviceableAreas: string[];
  currentLocation: VendorCurrentLocation;
  isAvailableNow: boolean;
  isVendorVerified: boolean;
  createdAt: string;
}

export interface VendorCateoryDetails {
  _id: string;
  name: string;
  image: string;
}

export interface VendorPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface GetVendorsResponse {
  success: boolean;
  code: number;
  message: string;
  data: Vendor[];
  pagination: VendorPagination;
}

export interface GetVendorsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: number;
  category?: string;
  isVendorVerified?: boolean;
  isAvailableNow?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface UpdateVendorStatusPayload {
  status: number;
}

export interface UpdateVendorVerificationPayload {
  isVendorVerified: boolean;
}

export interface UpdateVendorAvailabilityPayload {
  isAvailableNow: boolean;
}

export interface UpdateVendorResponse {
  success: boolean;
  code: number;
  message: string;
  data: Vendor;
}

export interface CreateVendorPayload {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  gst_number: string;
  vendorCategories: string[];
  serviceableAreas: {
    pincode: string;
  }[];
}

export interface VendorDetails {
  fullName?: string;
  user_id: string;
  email: string;
  phone: string;
  address: string;
  gst_number: string;
  vendorCategories: string[];
  serviceableAreas: {
    pincode: string;
  }[];
  createdAt: string;
}

export interface GetVendorByIdResponse {
  success: boolean;
  code: number;
  message: string;
  data: VendorDetails;
}

export interface UpdateVendorPayload {
  fullName?: string;
  email?: string;
  password?: string;
  phone?: string;
  address?: string;
  gst_number?: string;
  vendorCategories?: string[];
  serviceableAreas?: {
    pincode: string;
  }[];
}
