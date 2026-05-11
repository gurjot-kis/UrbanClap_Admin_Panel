import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

interface LocationState {
  resetToken?: string
}

function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const resetToken = (location.state as LocationState)?.resetToken ?? ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (!resetToken) {
      setError('Reset token is missing. Please restart the process.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword, confirmPassword }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json?.message || 'Failed to reset password. Please try again.')
      }

      setSuccess(true)
      setTimeout(() => navigate('/login', { replace: true }), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center login-bg">
      <div className="card shadow-lg border-0 rounded-4" style={{ width: '100%', maxWidth: 420 }}>
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <div className="login-avatar-wrap mx-auto mb-3">
              <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
                <circle cx="40" cy="40" r="40" fill="#1b3a5c" />
                <circle cx="40" cy="30" r="15" fill="#7da8cc" />
                <ellipse cx="40" cy="70" rx="26" ry="18" fill="#7da8cc" />
              </svg>
            </div>
            <h4 className="fw-bold mb-1" style={{ color: '#1b3a5c' }}>Reset Password</h4>
            <p className="text-muted small mb-0">Choose a strong new password</p>
          </div>

          {success && (
            <div className="alert alert-success py-2 small text-center" role="alert">
              Password reset successfully! Redirecting to login&hellip;
            </div>
          )}

          {error && (
            <div className="alert alert-danger py-2 small" role="alert">
              {error}
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="newPassword" className="form-label fw-semibold small">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  className="form-control form-control-lg"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="confirmPassword" className="form-label fw-semibold small">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="form-control form-control-lg"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="d-grid mb-3">
                <button
                  type="submit"
                  className="btn btn-lg fw-semibold text-white"
                  style={{ background: '#1b3a5c' }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </div>

              <div className="text-center">
                <Link to="/login" className="small text-decoration-none" style={{ color: '#1b3a5c' }}>
                  &larr; Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage
