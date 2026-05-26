import { useNavigate, useLocation } from 'react-router-dom'
import { getStoredUser } from '../../utils/auth'
import { resolveMediaUrl } from '../../config/api'
import { VENDOR_ROUTES } from '../../routes'

const NAV_ITEMS = [
  {
    id: 'Dashboard',
    label: 'Dashboard',
    path: VENDOR_ROUTES.dashboard,
    activePaths: [VENDOR_ROUTES.dashboard],
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
  },
  {
    id: 'Product',
    label: 'Product',
    path: VENDOR_ROUTES.products,
    activePaths: [VENDOR_ROUTES.products, '/vendor/products'],
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M21 16V8c0-.88-.48-1.69-1.25-2.08l-7-4a2.5 2.5 0 0 0-2.5 0l-7 4A2.34 2.34 0 0 0 2 8v8c0 .88.48 1.69 1.25 2.08l7 4c.38.2.81.3 1.25.3s.87-.1 1.25-.3l7-4A2.34 2.34 0 0 0 21 16zm-9 3.15-6-3.43V9.38l6 3.43v6.34zm1-8.07-6.04-3.45L13 4.18l6.04 3.45L13 11.08z" />
      </svg>
    ),
  },
  {
    id: 'Category',
    label: 'Category',
    path: VENDOR_ROUTES.categories,
    activePaths: [VENDOR_ROUTES.categories, '/vendor/sub-categories'],
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
      </svg>
    ),
  },
  {
    id: 'Profile',
    label: 'Profile',
    path: VENDOR_ROUTES.profile,
    activePaths: [VENDOR_ROUTES.profile],
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z" />
      </svg>
    ),
  },
]

function VendorSidebar() {
  const user = getStoredUser()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <aside className="db-sidebar d-flex flex-column flex-shrink-0">
      <div className="text-center py-4 px-3 border-bottom border-white border-opacity-10">
        <div className="db-avatar mx-auto mb-3">
          {user?.profilePicture ? (
            <img
              src={resolveMediaUrl(user.profilePicture)}
              alt={user.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            />
          ) : (
            <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="40" r="40" fill="#2d4f7a" />
              <circle cx="40" cy="30" r="15" fill="#7da8cc" />
              <ellipse cx="40" cy="70" rx="26" ry="18" fill="#7da8cc" />
            </svg>
          )}
        </div>
        <h6 className="fw-bold text-white mb-1 text-uppercase ls-wide">{user?.name}</h6>
        <small className="text-white-50 d-block">{user?.email}</small>
        <small className="text-white-50 opacity-75">Vendor</small>
      </div>

      <nav className="flex-grow-1 py-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`db-nav-btn w-100 d-flex align-items-center gap-2 px-4 py-2 border-0 text-start${item.activePaths.some((p) => pathname.startsWith(p)) ? ' active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="text-capitalize">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}

export default VendorSidebar
