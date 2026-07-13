import { useNavigate, useLocation } from "react-router-dom";
import { getStoredUser } from "../utils/auth";
import { resolveMediaUrl } from "../config/api";
import { ROUTES } from "../routes";

const NAV_ITEMS = [
  {
    id: "Dashboard",
    label: "Dashboard",
    path: ROUTES.dashboard,
    activePaths: [ROUTES.dashboard],
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
  },
  {
    id: "Vendors",
    label: "Vendors",
    path: ROUTES.vendors,
    activePaths: [ROUTES.vendors],
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
      </svg>
    ),
  },
  {
    id: "Users",
    label: "Users",
    path: ROUTES.users,
    activePaths: [ROUTES.users],
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.98 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
      </svg>
    ),
  },
  {
    id: "Profile",
    label: "Profile",
    path: ROUTES.profile,
    activePaths: [ROUTES.profile],
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z" />
      </svg>
    ),
  },
  {
    id: "Category",
    label: "Category",
    path: ROUTES.categories,
    activePaths: [ROUTES.categories, "/admin/sub-categories"],
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
      </svg>
    ),
  },
  {
    id: "Product",
    label: "Product",
    path: ROUTES.products,
    activePaths: [ROUTES.products],
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M21 16V8c0-.88-.48-1.69-1.25-2.08l-7-4a2.5 2.5 0 0 0-2.5 0l-7 4A2.34 2.34 0 0 0 2 8v8c0 .88.48 1.69 1.25 2.08l7 4c.38.2.81.3 1.25.3s.87-.1 1.25-.3l7-4A2.34 2.34 0 0 0 21 16zm-9 3.15-6-3.43V9.38l6 3.43v6.34zm1-8.07-6.04-3.45L13 4.18l6.04 3.45L13 11.08z" />
      </svg>
    ),
  },
  {
    id: "Banners",
    label: "Banners",
    path: ROUTES.banners,
    activePaths: [ROUTES.banners],
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM9 7h6v2H9V7zm0 4h6v2H9v-2zm0 4h4v2H9v-2z" />
      </svg>
    ),
  },
  {
    id: "CartSettings",
    label: "Cart Settings",
    path: ROUTES.cartSettings,
    activePaths: [ROUTES.cartSettings],
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 20 5H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
      </svg>
    ),
  },
  {
    id: "Orders",
    label: "Orders",
    path: ROUTES.orders,
    activePaths: [ROUTES.orders],
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 7h10v2H7zm0 4h10v2H7zm0 4h7v2H7z" />
      </svg>
    ),
  },

  {
    id: "Support",
    label: "Support",
    path: ROUTES.support,
    activePaths: [ROUTES.support],
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM7 11a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
      </svg>
    ),
  },

];

function Sidebar() {
  const user = getStoredUser();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <aside className="db-sidebar d-flex flex-column flex-shrink-0">
      {/* User profile */}
      <div className="text-center py-4 px-3 border-bottom border-white border-opacity-10">
        <div className="db-avatar mx-auto mb-3">
          {user?.profilePicture ? (
            <img
              src={resolveMediaUrl(user.profilePicture)}
              alt={user.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "50%",
              }}
            />
          ) : (
            <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="40" r="40" fill="#2d4f7a" />
              <circle cx="40" cy="30" r="15" fill="#7da8cc" />
              <ellipse cx="40" cy="70" rx="26" ry="18" fill="#7da8cc" />
            </svg>
          )}
        </div>
        <h6 className="fw-bold text-white mb-1 text-uppercase ls-wide">
          {user?.name}
        </h6>
        <small className="text-white-50">{user?.email}</small>
      </div>

      {/* Nav */}
      <nav className="flex-grow-1 py-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`db-nav-btn w-100 d-flex align-items-center gap-2 px-4 py-2 border-0 text-start${item.activePaths.some((p) => pathname.startsWith(p)) ? " active" : ""}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="text-capitalize">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
