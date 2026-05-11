import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

interface LocationState {
  email?: string
}

function VerifyOtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefillEmail = (location.state as LocationState)?.email ?? ''

  const [email, setEmail] = useState(prefillEmail)
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json?.message || 'Invalid or expired OTP. Please try again.')
      }

      const resetToken: string = json?.data?.resetToken ?? json?.resetToken ?? ''

      if (!resetToken) {
        throw new Error('No reset token received. Please try again.')
      }

      navigate('/reset-password', { state: { resetToken } })
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
            <h4 className="fw-bold mb-1" style={{ color: '#1b3a5c' }}>Verify OTP</h4>
            <p className="text-muted small mb-0">Enter the code sent to your email</p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 small" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
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
              <label htmlFor="otp" className="form-label fw-semibold small">
                One-Time Code
              </label>
              <input
                id="otp"
                type="text"
                className="form-control form-control-lg"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                maxLength={8}
                inputMode="numeric"
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
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </button>
            </div>

            <div className="text-center">
              <Link to="/forgot-password" className="small text-decoration-none" style={{ color: '#1b3a5c' }}>
                &larr; Resend OTP
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default VerifyOtpPage
