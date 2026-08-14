import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { getStoredToken, getStoredUser } from '../utils/auth'
import { ROUTES } from '../routes'
import '../styles/Dashboard.css'
import { useHeader } from '../layout/LayoutContext'

const VENDORS_API = '/api/vendor/vendors'

function AddVendorPage() {
  const navigate = useNavigate()
  const { setHeaderConfig } = useHeader()

  useEffect(() => {
    setHeaderConfig({
      title: 'Add Vendor',
      backTo: ROUTES.vendors,
      backTitle: 'Back to Vendors'
    })
  }, [setHeaderConfig])

  const token = getStoredToken()
  const user = getStoredUser()

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [gstNumber, setGstNumber] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<0 | 1>(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!token || !user) {
    return <Navigate to={ROUTES.login} replace />
  }



  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Name, email and password are required')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        code: code.trim(),
        phone: phone.trim(),
        address: address.trim(),
        gst_number: gstNumber.trim(),
        password: password.trim(),
        status,
      }

      const res = await fetch(VENDORS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      navigate(ROUTES.vendors)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add vendor')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="p-4">
          <div className="card border-0 rounded-3 shadow-sm" style={{ maxWidth: 700 }}>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold mb-1">Name</label>
                    <input
                      className="form-control edit-modal-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter vendor name"
                      maxLength={120}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold mb-1">Code</label>
                    <input
                      className="form-control edit-modal-input"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Unique vendor code"
                      maxLength={50}
                    />
                  </div>
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
                  <label className="form-label fw-semibold mb-1">GST Number</label>
                  <input
                    className="form-control edit-modal-input"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="Enter GST number"
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

                <div>
                  <label className="form-label fw-semibold mb-1">Status</label>
                  <select
                    className="form-select edit-modal-input"
                    value={status}
                    onChange={(e) => setStatus(Number(e.target.value) as 0 | 1)}
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>

                {error && <p className="text-danger small mb-0">{error}</p>}

                <div className="d-flex justify-content-end gap-2 pt-2">
                  <button type="button" className="btn btn-light border" onClick={() => navigate(ROUTES.vendors)} disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" className="btn edit-modal-save-btn px-3" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Vendor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
    </>
  )
}

export default AddVendorPage
