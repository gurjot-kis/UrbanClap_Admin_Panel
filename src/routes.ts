/** Client-side portal routes (not API endpoints). */

export const PUBLIC_ROUTES = {
  login: '/login',
  forgotPassword: '/forgot-password',
  verifyOtp: '/verify-otp',
  resetPassword: '/reset-password',
} as const

export const ROUTES = {
  ...PUBLIC_ROUTES,
  dashboard: '/admin/dashboard',
  categories: '/admin/categories',
  subCategories: (categoryId: string | number) => `/admin/sub-categories/${categoryId}`,
  products: '/admin/products',
  productsNew: '/admin/products/new',
  productEdit: (productId: string | number) => `/admin/products/${productId}/edit`,
  orders: '/admin/orders',
  orderDetails: (orderId: string | number) => `/admin/orders/${orderId}`,
  banners: '/admin/banners',
  cartSettings: '/admin/cart-settings',
  users: '/admin/users',
  usersNew: '/admin/users/new',
  userEdit: (userId: string | number) => `/admin/users/${userId}/edit`,
  vendors: '/admin/vendors',
  vendorsCreate: '/admin/vendors/create',
  vendorsNew: '/admin/vendors/new',
  vendorEdit: (vendorId: string | number) => `/admin/vendors/${vendorId}/edit`,
  vendorWarehouses: (vendorId: string | number) => `/admin/vendors/${vendorId}/warehouses`,
  vendorWarehouseNew: (vendorId: string | number) => `/admin/vendors/${vendorId}/warehouses/new`,
  vendorWarehouseEdit: (vendorId: string | number, warehouseId: string | number) =>
    `/admin/vendors/${vendorId}/warehouses/${warehouseId}/edit`,
  profile: '/admin/profile',
} as const

export const VENDOR_ROUTES = {
  dashboard: '/vendor/dashboard',
  profile: '/vendor/profile',
  categories: '/vendor/categories',
  subCategories: (categoryId: string | number) => `/vendor/sub-categories/${categoryId}`,
  products: '/vendor/products',
  productsNew: '/vendor/products/new',
  productEdit: (productId: string | number) => `/vendor/products/${productId}/edit`,
} as const
