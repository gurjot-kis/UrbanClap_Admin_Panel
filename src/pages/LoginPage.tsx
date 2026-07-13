import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
import type { LoginApiResponse } from "../types/auth";
import { ROUTES } from "../routes";
import { getStoredToken, getStoredUser, setAuthSession } from "../utils/auth";
import { getPostLoginRoute } from "../utils/roles";
import { useAppDispatch } from "../store/hooks";
import { setCredentials } from "../features/auth/authSlice";

const LOGIN_ENDPOINT = "/api/login";

function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (getStoredToken()) {
    return <Navigate to={getPostLoginRoute(getStoredUser()?.role)} replace />;
  }

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(LOGIN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = (await response.json()) as LoginApiResponse;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || "Unable to login right now.");
      }

      const authUser = {
        ...result.data,
        role:
          result.data.role ??
          ((result.data as Record<string, unknown>).role as string | undefined),
        profilePicture: (result.data as Record<string, unknown>)
          .profilePicture as string | undefined,
      };
      setAuthSession(authUser);
      // ← ADD THIS BLOCK
      dispatch(
        setCredentials({
          user: {
            _id: authUser._id,
            name: authUser.name,
            phone: authUser.email,
            gender: "unknown",
            status: authUser.status?.toString() || "active",
            avatar: authUser.profilePicture,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            token: authUser.token,
          },
          token: authUser.token,
        }),
      );

      navigate(getPostLoginRoute(authUser.role), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center login-bg">
      <div
        className="card shadow-lg border-0 rounded-4"
        style={{ width: "100%", maxWidth: 420 }}
      >
        <div className="card-body p-4 p-md-5">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="login-avatar-wrap mx-auto mb-3">
              <svg
                viewBox="0 0 80 80"
                xmlns="http://www.w3.org/2000/svg"
                width="64"
                height="64"
              >
                <circle cx="40" cy="40" r="40" fill="#1b3a5c" />
                <circle cx="40" cy="30" r="15" fill="#7da8cc" />
                <ellipse cx="40" cy="70" rx="26" ry="18" fill="#7da8cc" />
              </svg>
            </div>
            <h4 className="fw-bold mb-1" style={{ color: "#1b3a5c" }}>
              Portal Login
            </h4>
            <p className="text-muted small mb-0">
              Sign in to access your dashboard
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="alert alert-danger py-2 small" role="alert">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label fw-semibold small">
                Email address
              </label>
              <input
                id="email"
                type="email"
                className="form-control form-control-lg"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label
                  htmlFor="password"
                  className="form-label fw-semibold small mb-0"
                >
                  Password
                </label>
                <Link
                  to={ROUTES.forgotPassword}
                  className="small text-decoration-none"
                  style={{ color: "#1b3a5c" }}
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="input-group">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="form-control form-control-lg"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            <div className="d-grid">
              <button
                type="submit"
                className="btn btn-lg fw-semibold text-white"
                style={{ background: "#1b3a5c" }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
