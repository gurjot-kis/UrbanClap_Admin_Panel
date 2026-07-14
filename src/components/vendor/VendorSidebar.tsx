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
    id: 'Orders',
    label: 'Orders',
    path: VENDOR_ROUTES.orders,
    activePaths: [VENDOR_ROUTES.orders, '/vendor/orders'],
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z" />
      </svg>
    ),
  },
  {
    id: 'Warehouses',
    label: 'Warehouses',
    path: VENDOR_ROUTES.warehouses,
    activePaths: [VENDOR_ROUTES.warehouses, '/vendor/warehouses'],
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M3 5h18v14H3V5zm2 2v10h14V7H5zm2 2h4v2H7V9zm0 4h4v2H7v-2zm6-4h4v2h-4V9zm0 4h4v2h-4v-2z" />
      </svg>
    ),
  },
  {
    id: 'CartSettings',
    label: 'Cart Settings',
    path: VENDOR_ROUTES.cartSettings,
    activePaths: [VENDOR_ROUTES.cartSettings],
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.07-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.06 7.06 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.58.23-1.12.54-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.7 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.05.31-.07.63-.07.94s.02.63.07.94L2.82 14.52a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.31.6.22l2.39-.96c.5.4 1.05.72 1.63.94l.36 2.54c.04.24.25.42.5.42h3.84c.25 0 .46-.18.5-.42l.36-2.54c.58-.23 1.13-.55 1.63-.94l2.39.96c.22.09.48 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5z" />
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
    id: 'Support',
    label: 'Support',
    path: VENDOR_ROUTES.support,
    activePaths: [VENDOR_ROUTES.support],
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM7 11a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
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
