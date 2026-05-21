import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import ProtectedRoute from './components/ProtectedRoute'
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/categories" element={<CategoryPage />} />
        <Route path="/admin/sub-categories/:categoryId" element={<SubCategoryPage />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:orderId" element={<OrderDetailsPage />} />
        <Route path="/products/new" element={<AddProductPage />} />
        <Route path="/products/:productId/edit" element={<EditProductPage />} />
        <Route path="/banners" element={<BannerPage />} />
        <Route path="/cart-settings" element={<CartSettingsPage />} />
        <Route path="/users" element={<UserListPage />} />
        <Route path="/users/new" element={<AddUserPage />} />
        <Route path="/users/:userId/edit" element={<EditUserPage />} />
        <Route path="/vendors" element={<VendorListPage />} />
        <Route path="/vendors/new" element={<AddWarehousePage />} />
        <Route path="/vendors/create" element={<AddVendorPage />} />
        <Route path="/vendors/:vendorId/edit" element={<EditVendorPage />} />
        <Route path="/vendors/:vendorId/warehouses" element={<WarehouseListPage />} />
        <Route path="/vendors/:vendorId/warehouses/new" element={<AddWarehousePage />} />
        <Route path="/vendors/:vendorId/warehouses/:warehouseId/edit" element={<EditWarehousePage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
