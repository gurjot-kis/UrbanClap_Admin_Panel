import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json?.message || 'Failed to send OTP. Please try again.')
      }

      navigate('/verify-otp', { state: { email } })
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
            <h4 className="fw-bold mb-1" style={{ color: '#1b3a5c' }}>Forgot Password</h4>
            <p className="text-muted small mb-0">Enter your email to receive a one-time code</p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 small" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
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
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP'
                )}
              </button>
            </div>

            <div className="text-center">
              <Link to="/login" className="small text-decoration-none" style={{ color: '#1b3a5c' }}>
                &larr; Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
