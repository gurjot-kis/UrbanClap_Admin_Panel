import { Navigate, Outlet } from 'react-router-dom'
import { ROUTES } from '../routes'
import { getStoredToken, getStoredUser } from '../utils/auth'
import { getPostLoginRoute } from '../utils/roles'

type ProtectedRouteProps = {
  allowedRoles?: string[]
}

function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const token = getStoredToken()
  const user = getStoredUser()

  if (!token) {
    return <Navigate to={ROUTES.login} replace />
  }

  if (allowedRoles?.length) {
    const role = user?.role ?? ''
    if (!allowedRoles.includes(role)) {
      return <Navigate to={getPostLoginRoute(role)} replace />
    }
  }

  return <Outlet />
}

export function AdminProtectedRoute() {
  return <ProtectedRoute allowedRoles={['SuperAdmin']} />
}

export function VendorProtectedRoute() {
  return <ProtectedRoute allowedRoles={['Vendor']} />
}

export default ProtectedRoute
