import { Navigate, Outlet } from 'react-router-dom'
import { getStoredToken } from '../utils/auth'

function ProtectedRoute() {
  const token = getStoredToken()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
