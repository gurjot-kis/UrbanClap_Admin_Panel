import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import VendorLayout from '../../components/vendor/VendorLayout'
import { resolveMediaUrl } from '../../config/api'
import { ROUTES } from '../../routes'
import { getStoredToken, getStoredUser, setAuthSession } from '../../utils/auth'

const VENDORS_API = '/api/vendor/vendors'

interface VendorResponse {
  vendor_id?: string
  name?: string
  code?: string
  email?: string
  phone?: string
  address?: string
  gst_number?: string
  status?: number
  [key: string]: unknown
}

function VendorProfilePage() {
  const token = getStoredToken()
  const user = getStoredUser()
  const vendorId = user?.user_id ?? ''

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [gstNumber, setGstNumber] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchVendor = useCallback(async () => {
    if (!vendorId || !token) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${VENDORS_API}/${vendorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.message || `Server error: ${res.status}`)
      }
      const item: VendorResponse = json?.data ?? json
      setName(String(item.name ?? ''))
      setCode(String(item.code ?? ''))
      setEmail(String(item.email ?? ''))
      setPhone(String(item.phone ?? ''))
      setAddress(String(item.address ?? ''))
      setGstNumber(String(item.gst_number ?? ''))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [token, vendorId])

  useEffect(() => {
    fetchVendor()
  }, [fetchVendor])

  if (!token || !user) {
    return <Navigate to={ROUTES.login} replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!vendorId) {
      setError('Vendor account not found')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        gst_number: gstNumber.trim(),
      }
      if (code.trim()) body.code = code.trim()
      if (password.trim()) body.password = password.trim()

      const res = await fetch(`${VENDORS_API}/${vendorId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.message || `Server error: ${res.status}`)
      }

      const updated: VendorResponse = json?.data ?? json
      setName(String(updated?.name ?? name))
      setCode(String(updated?.code ?? code))
      setEmail(String(updated?.email ?? email))
      setPhone(String(updated?.phone ?? phone))
      setAddress(String(updated?.address ?? address))
      setGstNumber(String(updated?.gst_number ?? gstNumber))
      setAuthSession({
        ...user,
        name: String(updated?.name ?? name),
        email: String(updated?.email ?? email),
      })
      setPassword('')
      setSuccess('Profile updated successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <VendorLayout title="Profile">
      <div className="card border-0 rounded-3 shadow-sm" style={{ maxWidth: 720 }}>
        <div className="card-body p-4">
          <div className="d-flex align-items-center gap-3 mb-4">
            <div className="db-avatar" style={{ width: 64, height: 64 }}>
              {user.profilePicture ? (
                <img
                  src={resolveMediaUrl(user.profilePicture)}
                  alt={name || user.name}
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
            <div>
              <h6 className="fw-semibold mb-0">{loading ? user.name : name || user.name}</h6>
              <small className="text-muted">{loading ? user.email : email || user.email}</small>
            </div>
          </div>

          {error && <div className="alert alert-danger py-2 small">{error}</div>}
          {success && <div className="alert alert-success py-2 small">{success}</div>}

          {loading ? (
            <div className="d-flex align-items-center gap-2 py-4">
              <div className="spinner-border text-primary" style={{ width: '2rem', height: '2rem' }} role="status">
                <span className="visually-hidden">Loading…</span>
              </div>
              <span className="text-muted small">Loading profile…</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label fw-semibold mb-1">Name</label>
                <input
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="form-label fw-semibold mb-1">Vendor Code</label>
                <input
                  className="form-control"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Vendor code"
                />
              </div>
              <div>
                <label className="form-label fw-semibold mb-1">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="form-label fw-semibold mb-1">Phone</label>
                <input
                  className="form-control"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="form-label fw-semibold mb-1">Address</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Business address"
                />
              </div>
              <div>
                <label className="form-label fw-semibold mb-1">GST Number</label>
                <input
                  className="form-control"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  placeholder="GSTIN"
                />
              </div>
              <div>
                <label className="form-label fw-semibold mb-1">New Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                />
              </div>
              <div>
                <button
                  type="submit"
                  className="btn text-white px-4"
                  style={{ background: '#1b3a5c' }}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </VendorLayout>
  )
}

export default VendorProfilePage
