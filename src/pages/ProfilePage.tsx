import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { clearAuthSession, getStoredToken, getStoredUser, setAuthSession } from '../utils/auth'
import { resolveMediaUrl } from '../config/api'
import Sidebar from '../components/Sidebar'
import '../styles/Dashboard.css'

interface AdminProfileResponse {
  fullName?: string
  email?: string
  phone?: string
  address?: string
  profilePicture?: string
  profile_picture?: string
  profile_image?: string
  profileImage?: string
  avatar?: string
  [key: string]: unknown
}

function ProfilePage() {
  const navigate = useNavigate()
  const token = getStoredToken()
  const currentUser = getStoredUser()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [profileImage, setProfileImage] = useState('')
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [profileImagePreviewUrl, setProfileImagePreviewUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  if (!token || !currentUser) {
    return <Navigate to="/login" replace />
  }

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const json = await res.json()
      const profile: AdminProfileResponse = json?.data ?? json

      setFullName(String(profile.fullName ?? ''))
      setEmail(String(profile.email ?? ''))
      setPhone(String(profile.phone ?? ''))
      setAddress(String(profile.address ?? ''))
      setProfileImage(String(profile.profilePicture ?? profile.profile_picture ?? profile.profile_image ?? profile.profileImage ?? profile.avatar ?? ''))
      setProfileImageFile(null)
      setProfileImagePreviewUrl('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  useEffect(() => {
    if (!profileImageFile) {
      setProfileImagePreviewUrl('')
      return
    }
    const objectUrl = URL.createObjectURL(profileImageFile)
    setProfileImagePreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [profileImageFile])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim()) {
      setError('Full name and email are required')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const formData = new FormData()
      formData.append('fullName', fullName.trim())
      formData.append('email', email.trim())
      formData.append('phone', phone.trim())
      formData.append('address', address.trim())
      if (password.trim()) formData.append('password', password.trim())
      if (profileImageFile) formData.append('profile_picture', profileImageFile)

      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const json = await res.json()
      const updatedProfile: AdminProfileResponse = json?.data ?? json

      // Keep sidebar identity in sync with updated profile values.
      setAuthSession({
        ...currentUser,
        name: fullName.trim(),
        email: email.trim(),
        profilePicture:
          updatedProfile.profilePicture ??
          updatedProfile.profile_picture ??
          updatedProfile.profile_image ??
          updatedProfile.profileImage ??
          updatedProfile.avatar ??
          profileImage,
      })
      setPassword('')
      setSuccess('Profile updated successfully')
      await fetchProfile()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="d-flex min-vh-100" style={{ background: '#eef1f6' }}>
      <Sidebar />
      <div className="d-flex flex-column flex-grow-1 min-w-0">
        <header className="d-flex align-items-center justify-content-between px-4 py-3 bg-white shadow-sm">
          <h6 className="mb-0 fw-semibold text-dark">Profile</h6>
          <button type="button" className="btn btn-danger btn-sm px-3 fw-semibold" onClick={handleLogout}>
            Logout
          </button>
        </header>

        <div className="p-4">
          <div className="card border-0 rounded-3 shadow-sm" style={{ maxWidth: 700 }}>
            <div className="card-body p-4">
              {loading ? (
                <div className="cat-state d-flex flex-column align-items-center justify-content-center py-4 gap-2">
                  <div className="spinner-border text-primary" style={{ width: '2rem', height: '2rem' }} role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <span className="text-muted small">Loading profile...</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">

                  {/* ── Avatar ── */}
                  <div className="d-flex flex-column align-items-center gap-2 pb-2 border-bottom">
                    <label
                      htmlFor="profileImageInput"
                      title="Click to change photo"
                      style={{ cursor: 'pointer', position: 'relative', display: 'inline-block' }}
                    >
                      {(profileImagePreviewUrl || profileImage) ? (
                        <img
                          src={profileImagePreviewUrl ? resolveMediaUrl(profileImagePreviewUrl) : resolveMediaUrl(profileImage)}
                          alt="Profile"
                          style={{
                            width: 110, height: 110,
                            objectFit: 'cover',
                            borderRadius: '50%',
                            border: '3px solid #1b3a5c',
                            display: 'block',
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            width: 110, height: 110,
                            borderRadius: '50%',
                            background: '#1b3a5c',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2.4rem',
                            color: '#fff',
                            fontWeight: 700,
                            border: '3px solid #1b3a5c',
                          }}
                        >
                          {fullName ? fullName.charAt(0).toUpperCase() : '?'}
                        </span>
                      )}
                      {/* camera overlay */}
                      <span
                        style={{
                          position: 'absolute', bottom: 4, right: 4,
                          background: '#1b3a5c', color: '#fff',
                          borderRadius: '50%', width: 28, height: 28,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.75rem', border: '2px solid #fff',
                        }}
                        aria-hidden="true"
                      >
                        &#9998;
                      </span>
                    </label>
                    <input
                      id="profileImageInput"
                      type="file"
                      accept="image/*"
                      className="visually-hidden"
                      onChange={(e) => setProfileImageFile(e.target.files?.[0] ?? null)}
                    />
                    <div className="text-center">
                      <div className="fw-semibold" style={{ fontSize: '1.05rem' }}>{fullName || '—'}</div>
                      <div className="text-muted small">{email || '—'}</div>
                    </div>
                    {profileImagePreviewUrl && (
                      <span className="badge" style={{ background: '#e8f5e9', color: '#2e7d32', fontSize: '0.75rem' }}>
                        New photo selected — save to apply
                      </span>
                    )}
                  </div>

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
                      placeholder="Keep blank to keep existing password"
                      minLength={6}
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
                  {success && <p className="text-success small mb-0">{success}</p>}

                  <div className="d-flex justify-content-end gap-2 pt-2">
                    <button type="button" className="btn btn-light border" onClick={fetchProfile} disabled={saving}>
                      Reset
                    </button>
                    <button type="submit" className="btn edit-modal-save-btn px-3" disabled={saving}>
                      {saving ? 'Updating...' : 'Update Profile'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
