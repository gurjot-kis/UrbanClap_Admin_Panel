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
  costPrice: number;
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

  // Used by product detail/edit API
  category_id: string;
  sub_category_id?: string | null;

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

  // Used by product detail/edit API
  category_name?: string | null;
  sub_category_name?: string | null;
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

// ---------------- PRODUCT DETAIL ----------------

export interface GetProductByIdResponse {
  success: boolean;
  code: number;
  message: string;
  data: Product;
}

// ---------------- CREATE / EDIT PRODUCT ----------------

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
 * Variant used by the Create/Edit Product form.
 *
 * key:
 * - Optional because new variants don't have a server key yet.
 * - Existing variants have a key when editing.
 *
 * existingImage:
 * - Existing server-side image shown during edit.
 * - null when the variant has no existing image.
 */
export interface CreateProductVariant {
  key?: string;
  label: string;
  price: number | "";
  costPrice: number | "";
  imageFile: File | null;   
  existingImage?: string | null;
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
  // ❌ remove variantImages: File[] — variants carry their own imageFile now
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
  variants: Array<{           // ✅ serializable shape, not CreateProductVariant
    key?: string;
    label: string;
    price: number | "";
    costPrice: number | "";
    image: string;            // file name or existing URL, never a File object
  }>;
  mainImage: string;
  featuredImages: string[];
  // ❌ remove variantImages: string[]
}