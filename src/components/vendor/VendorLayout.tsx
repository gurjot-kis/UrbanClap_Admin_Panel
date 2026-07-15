import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearAuthSession } from '../../utils/auth'
import { ROUTES } from '../../routes'
import VendorSidebar from './VendorSidebar'
import '../../styles/Dashboard.css'

type VendorLayoutProps = {
  title: string
  subtitle?: string
  backTo?: string
  backTitle?: string
  children: ReactNode
}

function VendorLayout({ title, subtitle, backTo, backTitle = 'Back', children }: VendorLayoutProps) {
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAuthSession()
    navigate(ROUTES.login, { replace: true })
  }

  return (
    <div className="d-flex min-vh-100 vendor-layout-root">
      <VendorSidebar />
      <div className="d-flex flex-column flex-grow-1 min-w-0">
        <header className="d-flex align-items-center justify-content-between px-4 py-3 vendor-header shadow-sm">
          <div className="d-flex align-items-center gap-2">
            {backTo && (
              <button
                type="button"
                className="subcat-back-btn"
                onClick={() => navigate(backTo)}
                title={backTitle}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                </svg>
              </button>
            )}
            <div>
              <h6 className="mb-0 fw-semibold vendor-title">{title}</h6>
              {subtitle && (
                <small className="vendor-subtitle" style={{ fontSize: '0.75rem' }}>
                  {subtitle}
                </small>
              )}
            </div>
          </div>
          <button type="button" className="btn btn-danger btn-sm px-3 fw-semibold" onClick={handleLogout}>
            Logout
          </button>
        </header>
        <div className="p-4 d-flex flex-column gap-3 flex-grow-1 vendor-content">{children}</div>
      </div>
    </div>
  )
}

export default VendorLayout
