import { useNavigate } from 'react-router-dom'
import { useHeader } from './LayoutContext'
import { clearAuthSession } from '../utils/auth'
import { ROUTES } from '../routes'

export default function Navbar() {
  const navigate = useNavigate()
  const { headerConfig } = useHeader()

  const handleLogout = () => {
    clearAuthSession()
    navigate(ROUTES.login, { replace: true })
  }

  return (
    <header className="d-flex align-items-center justify-content-between px-4 py-3 bg-white shadow-sm">
      <div className="d-flex align-items-center gap-2">
        {headerConfig.backTo && (
          <button
            type="button"
            className="subcat-back-btn"
            onClick={() => navigate(headerConfig.backTo!)}
            title={headerConfig.backTitle || 'Back'}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </button>
        )}
        <div>
          <h6 className="mb-0 fw-semibold text-dark">{headerConfig.title}</h6>
          {headerConfig.subtitle && (
            <small className="text-muted" style={{ fontSize: '0.75rem' }}>
              {headerConfig.subtitle}
            </small>
          )}
        </div>
      </div>
      <button type="button" className="btn btn-danger btn-sm px-3 fw-semibold" onClick={handleLogout}>
        Logout
      </button>
    </header>
  )
}
