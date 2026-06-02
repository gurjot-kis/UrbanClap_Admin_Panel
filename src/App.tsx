import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { AdminProtectedRoute, VendorProtectedRoute } from './components/ProtectedRoute'
import DashboardPage from './pages/DashboardPage'
import CategoryPage from './pages/CategoryPage'
import SubCategoryPage from './pages/SubCategoryPage'
import ProductListPage from './pages/ProductListPage'
import AddProductPage from './pages/AddProductPage'
import EditProductPage from './pages/EditProductPage'
import OrdersPage from './pages/OrdersPage'
import OrderDetailsPage from './pages/OrderDetailsPage'
import UserListPage from './pages/UserListPage'
import AddUserPage from './pages/AddUserPage'
import EditUserPage from './pages/EditUserPage'
import ProfilePage from './pages/ProfilePage'
import BannerPage from './pages/BannerPage'
import CartSettingsPage from './pages/CartSettingsPage'
import VendorListPage from './pages/VendorListPage'
import AddVendorPage from './pages/AddVendorPage'
import EditVendorPage from './pages/EditVendorPage'
import WarehouseListPage from './pages/WarehouseListPage'
import AddWarehousePage from './pages/AddWarehousePage'
import EditWarehousePage from './pages/EditWarehousePage'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import VerifyOtpPage from './pages/VerifyOtpPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import VendorDashboardPage from './pages/vendor/VendorDashboardPage'
import VendorProfilePage from './pages/vendor/VendorProfilePage'
import VendorCategoryPage from './pages/vendor/VendorCategoryPage'
import VendorSubCategoryPage from './pages/vendor/VendorSubCategoryPage'
import VendorProductListPage from './pages/vendor/VendorProductListPage'
import VendorAddProductPage from './pages/vendor/VendorAddProductPage'
import VendorEditProductPage from './pages/vendor/VendorEditProductPage'
import VendorWarehouseListPage from './pages/vendor/VendorWarehouseListPage'
import VendorAddWarehousePage from './pages/vendor/VendorAddWarehousePage'
import VendorEditWarehousePage from './pages/vendor/VendorEditWarehousePage'
import VendorOrdersPage from './pages/vendor/VendorOrdersPage'
import VendorCartSettingsPage from './pages/vendor/VendorCartSettingsPage'
import { ROUTES, VENDOR_ROUTES } from './routes'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={ROUTES.login} replace />} />
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
      <Route path={ROUTES.verifyOtp} element={<VerifyOtpPage />} />
      <Route path={ROUTES.resetPassword} element={<ResetPasswordPage />} />
      <Route element={<VendorProtectedRoute />}>
        <Route path={VENDOR_ROUTES.dashboard} element={<VendorDashboardPage />} />
        <Route path={VENDOR_ROUTES.profile} element={<VendorProfilePage />} />
        <Route path={VENDOR_ROUTES.categories} element={<VendorCategoryPage />} />
        <Route path="/vendor/sub-categories/:categoryId" element={<VendorSubCategoryPage />} />
        <Route path={VENDOR_ROUTES.products} element={<VendorProductListPage />} />
        <Route path={VENDOR_ROUTES.productsNew} element={<VendorAddProductPage />} />
        <Route path="/vendor/products/:productId/edit" element={<VendorEditProductPage />} />
        <Route path={VENDOR_ROUTES.warehouses} element={<VendorWarehouseListPage />} />
        <Route path={VENDOR_ROUTES.warehousesNew} element={<VendorAddWarehousePage />} />
        <Route path="/vendor/warehouses/:warehouseId/edit" element={<VendorEditWarehousePage />} />
        <Route path={VENDOR_ROUTES.orders} element={<VendorOrdersPage />} />
        <Route path={VENDOR_ROUTES.cartSettings} element={<VendorCartSettingsPage />} />
      </Route>
      <Route element={<AdminProtectedRoute />}>
        <Route path={ROUTES.dashboard} element={<DashboardPage />} />
        <Route path={ROUTES.categories} element={<CategoryPage />} />
        <Route path="/admin/sub-categories/:categoryId" element={<SubCategoryPage />} />
        <Route path={ROUTES.products} element={<ProductListPage />} />
        <Route path={ROUTES.orders} element={<OrdersPage />} />
        <Route path="/admin/orders/:orderId" element={<OrderDetailsPage />} />
        <Route path={ROUTES.productsNew} element={<AddProductPage />} />
        <Route path="/admin/products/:productId/edit" element={<EditProductPage />} />
        <Route path={ROUTES.banners} element={<BannerPage />} />
        <Route path={ROUTES.cartSettings} element={<CartSettingsPage />} />
        <Route path={ROUTES.users} element={<UserListPage />} />
        <Route path={ROUTES.usersNew} element={<AddUserPage />} />
        <Route path="/admin/users/:userId/edit" element={<EditUserPage />} />
        <Route path={ROUTES.vendors} element={<VendorListPage />} />
        <Route path={ROUTES.vendorsNew} element={<AddWarehousePage />} />
        <Route path={ROUTES.vendorsCreate} element={<AddVendorPage />} />
        <Route path="/admin/vendors/:vendorId/edit" element={<EditVendorPage />} />
        <Route path="/admin/vendors/:vendorId/warehouses" element={<WarehouseListPage />} />
        <Route path="/admin/vendors/:vendorId/warehouses/new" element={<AddWarehousePage />} />
        <Route path="/admin/vendors/:vendorId/warehouses/:warehouseId/edit" element={<EditWarehousePage />} />
        <Route path={ROUTES.profile} element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to={ROUTES.login} replace />} />
    </Routes>
  )
}

export default App
