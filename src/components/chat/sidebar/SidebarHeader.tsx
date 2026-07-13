import { useState, useRef, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../store/hooks";
import { logout } from "../../../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import { clearAuthSession } from "../../../utils/auth";
import { disconnectSocket } from "../../../services/socket";
import { resetChatState } from "../../../features/chat/chatSlice";
import { baseApi } from "../../../store/api/baseApi";
import UserAvatar from "../shared/UserAvatar";
import EditProfileModal from "./EditProfileModal";

const SidebarHeader = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    dispatch(logout());
    dispatch(resetChatState());
    dispatch(baseApi.util.resetApiState());
    disconnectSocket();
    navigate("/login");
  };

  return (
    <div className="relative d-flex align-items-center justify-content-between px-3 h-16 bg-white border-bottom border-light">
      <div className="d-flex align-items-center gap-2">
        <div
          className="d-flex align-items-center justify-content-center rounded-3 bg-navy text-white shadow-sm"
          style={{ width: "36px", height: "36px", backgroundColor: "#1b3a5c" }}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            width="20"
            height="20"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8-1.083 0-2.12-.17-3.08-.484L3 20l1.514-4.03A7.947 7.947 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h5 className="mb-0 fw-bold text-navy" style={{ color: "#1b3a5c" }}>
          Messages
        </h5>
      </div>

      <div className="position-relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="d-flex align-items-center border-0 bg-transparent gap-1 p-1 rounded-pill hover:bg-light cursor-pointer"
        >
          {user && (
            <UserAvatar name={user.name} imageUrl={user.avatar} size="sm" />
          )}
          <svg
            className={`text-secondary transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            width="14"
            height="14"
            style={{ transition: "transform 0.2s" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div
            className="position-absolute end-0 mt-2 bg-white rounded-3 py-2 shadow border border-light z-3"
            style={{ width: "200px", zIndex: 1000 }}
          >
            {user && (
              <div className="px-3 py-2 border-bottom border-light">
                <p className="small mb-0 fw-bold text-dark text-truncate">
                  {user.name}
                </p>
                <p className="text-muted text-truncate mb-0" style={{ fontSize: "11px" }}>
                  {user.phone || "Admin Account"}
                </p>
              </div>
            )}
            <button
              onClick={() => {
                setIsProfileModalOpen(true);
                setIsDropdownOpen(false);
              }}
              className="d-flex w-100 align-items-center border-0 bg-transparent gap-2 px-3 py-2 text-start text-dark small hover:bg-light"
              style={{ transition: "background-color 0.15s" }}
            >
              <svg
                className="text-navy"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                style={{ color: "#1b3a5c" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit Profile
            </button>
            <button
              onClick={handleLogout}
              className="d-flex w-100 align-items-center border-0 bg-transparent gap-2 px-3 py-2 text-start text-danger small hover:bg-light"
              style={{ transition: "background-color 0.15s" }}
            >
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                width="16"
                height="16"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};

export default SidebarHeader;
