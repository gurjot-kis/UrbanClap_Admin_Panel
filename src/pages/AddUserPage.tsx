import { FormEvent, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { clearAuthSession, getStoredToken, getStoredUser } from '../utils/auth'
import Sidebar from '../components/Sidebar'
import '../styles/Dashboard.css'

function AddUserPage() {
  const navigate = useNavigate()
  const token = getStoredToken()
  const user = getStoredUser()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Full name, email and password are required')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim(),
        password: password.trim(),
        phone: phone.trim(),
        address: address.trim(),
      }

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      navigate('/users')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add user')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="d-flex min-vh-100" style={{ background: '#eef1f6' }}>
      <Sidebar />
      <div className="d-flex flex-column flex-grow-1 min-w-0">
        <header className="d-flex align-items-center justify-content-between px-4 py-3 bg-white shadow-sm">
          <div className="d-flex align-items-center gap-2">
            <button type="button" className="subcat-back-btn" onClick={() => navigate('/users')} title="Back to Users">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
              </svg>
            </button>
            <h6 className="mb-0 fw-semibold text-dark">Add User</h6>
          </div>
          <button type="button" className="btn btn-danger btn-sm px-3 fw-semibold" onClick={handleLogout}>
            Logout
          </button>
        </header>

        <div className="p-4">
          <div className="card border-0 rounded-3 shadow-sm" style={{ maxWidth: 700 }}>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                <div>
                  <label className="form-label fw-semibold mb-1">Full Name</label>
                  <input
                    className="form-control edit-modal-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                    maxLength={120}
                    required
                  />
                </div>

                <div>
                  <label className="form-label fw-semibold mb-1">Email</label>
                  <input
                    type="email"
                    className="form-control edit-modal-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email"
                    required
                  />
                </div>

                <div>
                  <label className="form-label fw-semibold mb-1">Password</label>
                  <input
                    type="password"
                    className="form-control edit-modal-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    minLength={6}
                    required
                  />
                </div>

                <div>
                  <label className="form-label fw-semibold mb-1">Phone</label>
                  <input
                    className="form-control edit-modal-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                    maxLength={20}
                  />
                </div>

                <div>
                  <label className="form-label fw-semibold mb-1">Address</label>
                  <textarea
                    className="form-control edit-modal-input edit-modal-textarea"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter address"
                    rows={3}
                  />
                </div>

                {error && <p className="text-danger small mb-0">{error}</p>}

                <div className="d-flex justify-content-end gap-2 pt-2">
                  <button type="button" className="btn btn-light border" onClick={() => navigate('/users')} disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" className="btn edit-modal-save-btn px-3" disabled={saving}>
                    {saving ? 'Saving...' : 'Save User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddUserPage
