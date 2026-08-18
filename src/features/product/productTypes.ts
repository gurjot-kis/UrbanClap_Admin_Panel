export type ProductStatus = "active" | "pending" | "rejected";

export interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  subCategoryId?: string;
}

// ---------------- PRODUCT LIST ----------------

export interface ProductVariant {
  key: string;
  label: string;
  price: number;
  image: string | null;
}

export interface ProductRating {
  average: number;
  count: number;
}

export interface ProductCategory {
  _id: string;
  name: string;
  category_image: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  includes: string[];
  mainImage: string;
  images: string[];
  category: ProductCategory;
  subCategory: ProductCategory;
  vendor_id: string | null;
  basePrice: number;
  variantLabel: string;
  variants: ProductVariant[];
  durationMinutes: number;
  rating: ProductRating;
  maxQuantity: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPagination {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface GetProductsResponse {
  success: boolean;
  code: number;
  message: string;
  data: Product[];
  pagination: ProductPagination;
}

// ---------------- CREATE PRODUCT ----------------

export interface Category {
  _id: string;
  name: string;
  level: number;
  description: string;
  category_image: string;
  status: "active" | "inactive";
  children?: Category[];
}

export interface CategoriesResponse {
  success: boolean;
  code: number;
  message: string;
  data: Category[];
}

export interface Vendor {
  _id: string;
  name: string;
}

/**
 * Variant used by the Create Product form.
 */
export interface CreateProductVariant {
  label: string;
  price: number | "";
  costPrice: number | "";
  imageIndex: number | null;
}

export interface ProductFormState {
  name: string;
  description: string;
  shortDescription: string;
  category_id: string;
  sub_category_id: string;
  vendor_id: string;
  basePrice: number | "";
  variantLabel: string;
  durationMinutes: number | "";
  includes: string[];
  variants: CreateProductVariant[];
  mainImage: File | null;
  featuredImages: File[];
  variantImages: File[];
}

export interface ProductPayloadPreview {
  name: string;
  description: string;
  shortDescription: string;
  category_id: string;
  sub_category_id: string;
  vendor_id: string;
  basePrice: number | "";
  variantLabel: string;
  durationMinutes: number | "";
  includes: string[];
  variants: CreateProductVariant[];
  mainImage: string;
  featuredImages: string[];
  variantImages: string[];
}
