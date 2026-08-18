export const PUBLIC_ROUTES = {
  login: "/login",
  forgotPassword: "/forgot-password",
  verifyOtp: "/verify-otp",
  resetPassword: "/reset-password",
} as const;

export const ROUTES = {
  ...PUBLIC_ROUTES,
  dashboard: "/admin/dashboard",
  //Worked by kshitish start
  categories: "/admin/categories",
  addCategory: "/admin/categories/add",
  editCategory: "/admin/categories/:categoryId/edit",

  products: "/admin/products",
  productsNew: "/admin/products/add",
  productEdit: "/admin/products/:productId/edit",
  //Worked by kshitish end

  orders: "/admin/orders",
  orderDetails: (orderId: string | number) => `/admin/orders/${orderId}`,
  banners: "/admin/banners",
  cartSettings: "/admin/cart-settings",
  users: "/admin/users",
  usersNew: "/admin/users/new",
  userEdit: (userId: string | number) => `/admin/users/${userId}/edit`,
  vendors: "/admin/vendors",
  vendorsCreate: "/admin/vendors/create",
  vendorsNew: "/admin/vendors/new",
  vendorEdit: (vendorId: string | number) => `/admin/vendors/${vendorId}/edit`,
  vendorWarehouses: (vendorId: string | number) =>
    `/admin/vendors/${vendorId}/warehouses`,
  vendorWarehouseNew: (vendorId: string | number) =>
    `/admin/vendors/${vendorId}/warehouses/new`,
  vendorWarehouseEdit: (
    vendorId: string | number,
    warehouseId: string | number,
  ) => `/admin/vendors/${vendorId}/warehouses/${warehouseId}/edit`,
  profile: "/admin/profile",
  support: "/admin/support",
} as const;

export const VENDOR_ROUTES = {
  dashboard: "/vendor/dashboard",
  profile: "/vendor/profile",
  categories: "/vendor/categories",
  subCategories: (categoryId: string | number) =>
    `/vendor/sub-categories/${categoryId}`,
  products: "/vendor/products",
  productsNew: "/vendor/products/new",
  productEdit: (productId: string | number) =>
    `/vendor/products/${productId}/edit`,
  warehouses: "/vendor/warehouses",
  warehousesNew: "/vendor/warehouses/new",
  warehouseEdit: (warehouseId: string | number) =>
    `/vendor/warehouses/${warehouseId}/edit`,
  orders: "/vendor/orders",
  cartSettings: "/vendor/cart-settings",
  support: "/vendor/support",
} as const;
