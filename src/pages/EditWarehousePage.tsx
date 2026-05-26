import { useCallback, useEffect, useState, type ChangeEvent } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate, useParams, useLocation } from 'react-router-dom'
import { clearAuthSession, getStoredToken, getStoredUser } from '../utils/auth'
import { resolveMediaUrl } from '../config/api'
import Sidebar from '../components/Sidebar'
import GoogleAddressInput from '../components/GoogleAddressInput'
import type { ParsedAddress } from '../utils/googlePlaces'
import { ROUTES } from '../routes'
import '../styles/Dashboard.css'

const WAREHOUSES_API = '/api/vendor/warehouses'

interface WarehouseResponse {
  name?: string
  code?: string
  full_address?: string
  address_line1?: string
  addressLine1?: string
  city?: string
  state?: string
  pincode?: string
  country?: string
  latitude?: number | string
  longitude?: number | string
  warehouse_image?: string
  status?: number
  is_default?: number | boolean
  [key: string]: unknown
}

function appendFormField(formData: FormData, key: string, value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined) return
  if (typeof value === 'string' && !value.trim()) return
  formData.append(key, String(value))
}

function EditWarehousePage() {
  const navigate = useNavigate()
  const { vendorId, warehouseId } = useParams<{ vendorId: string; warehouseId: string }>()
  const location = useLocation()
  const vendorName = (location.state as { vendorName?: string } | null)?.vendorName ?? 'Vendor'

  const token = getStoredToken()
  const user = getStoredUser()

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [fullAddress, setFullAddress] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [city, setCity] = useState('')
  const [stateVal, setStateVal] = useState('')
  const [pincode, setPincode] = useState('')
  const [country, setCountry] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState('')
  const [warehouseImageFile, setWarehouseImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')
  const [status, setStatus] = useState<0 | 1>(1)
  const [isDefault, setIsDefault] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!token || !user) {
    return <Navigate to={ROUTES.login} replace />
  }

  if (!vendorId || !warehouseId) {
    return <Navigate to={ROUTES.vendors} replace />
  }

  const listPath = ROUTES.vendorWarehouses(vendorId)

  const handleLogout = () => {
    clearAuthSession()
    navigate(ROUTES.login, { replace: true })
  }

  const fetchWarehouse = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${WAREHOUSES_API}/${warehouseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const json = await res.json()
      const item: WarehouseResponse = json?.data ?? json

      const line1 = String(item.addressLine1 ?? item.address_line1 ?? '')
      const full = String(item.full_address ?? line1)

      setName(String(item.name ?? ''))
      setCode(String(item.code ?? ''))
      setFullAddress(full)
      setAddressLine1(line1 || full)
      setCity(String(item.city ?? ''))
      setStateVal(String(item.state ?? ''))
      setPincode(String(item.pincode ?? ''))
      setCountry(String(item.country ?? ''))
      setLatitude(item.latitude != null && item.latitude !== '' ? Number(item.latitude) : null)
      setLongitude(item.longitude != null && item.longitude !== '' ? Number(item.longitude) : null)
      setExistingImageUrl(String(item.warehouse_image ?? ''))
      setStatus(Number(item.status) === 0 ? 0 : 1)
      setIsDefault(item.is_default === true || item.is_default === 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load warehouse')
    } finally {
      setLoading(false)
    }
  }, [token, warehouseId])

  useEffect(() => {
    fetchWarehouse()
  }, [fetchWarehouse])

  useEffect(() => {
    if (!warehouseImageFile) {
      setImagePreviewUrl('')
      return
    }
    const objectUrl = URL.createObjectURL(warehouseImageFile)
    setImagePreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [warehouseImageFile])

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    setWarehouseImageFile(e.target.files?.[0] ?? null)
  }

  const handlePlaceSelect = (parsed: ParsedAddress) => {
    setFullAddress(parsed.full_address)
    setAddressLine1(parsed.addressLine1)
    setCity(parsed.city)
    setStateVal(parsed.state)
    setPincode(parsed.pincode)
    setCountry(parsed.country)
    setLatitude(parsed.latitude)
    setLongitude(parsed.longitude)
  }

  const handleFullAddressChange = (value: string) => {
    setFullAddress(value)
    setAddressLine1(value)
  }

  const displayImageSrc = imagePreviewUrl || (existingImageUrl ? resolveMediaUrl(existingImageUrl) : '')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Warehouse name is required')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('vendor_id', vendorId)
      formData.append('name', name.trim())
      appendFormField(formData, 'code', code.trim())

      appendFormField(formData, 'full_address', fullAddress.trim())
      appendFormField(formData, 'addressLine1', addressLine1.trim() || fullAddress.trim())
      appendFormField(formData, 'city', city.trim())
      appendFormField(formData, 'state', stateVal.trim())
      appendFormField(formData, 'pincode', pincode.trim())
      appendFormField(formData, 'country', country.trim())

      if (latitude != null) formData.append('latitude', String(latitude))
      if (longitude != null) formData.append('longitude', String(longitude))

      formData.append('status', String(status))
      formData.append('is_default', isDefault ? 'true' : 'false')

      if (warehouseImageFile) {
        formData.append('warehouse_image', warehouseImageFile)
      }

      const res = await fetch(`${WAREHOUSES_API}/${warehouseId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      navigate(listPath, { state: { vendorName } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update warehouse')
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
            <button type="button" className="subcat-back-btn" onClick={() => navigate(listPath, { state: { vendorName } })} title="Back to Warehouses">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
              </svg>
            </button>
            <div>
              <h6 className="mb-0 fw-semibold text-dark">Edit Warehouse</h6>
              <small className="text-muted" style={{ fontSize: '0.75rem' }}>{vendorName}</small>
            </div>
          </div>
          <button type="button" className="btn btn-danger btn-sm px-3 fw-semibold" onClick={handleLogout}>
            Logout
          </button>
        </header>

        <div className="p-4">
          <div className="card border-0 rounded-3 shadow-sm" style={{ maxWidth: 720 }}>
            <div className="card-body p-4">
              {loading ? (
                <div className="cat-state d-flex flex-column align-items-center justify-content-center py-4 gap-2">
                  <div className="spinner-border text-primary" style={{ width: '2rem', height: '2rem' }} role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <span className="text-muted small">Loading warehouse details...</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold mb-1">Name</label>
                      <input
                        className="form-control edit-modal-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Gurgaon Dark Store"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold mb-1">Code</label>
                      <input
                        className="form-control edit-modal-input"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Unique warehouse code"
                        maxLength={50}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label fw-semibold mb-1">Full address</label>
                    <GoogleAddressInput
                      value={fullAddress}
                      onChange={handleFullAddressChange}
                      onPlaceSelect={handlePlaceSelect}
                      placeholder="Search address (Google suggestions)…"
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <label className="form-label fw-semibold mb-1">Address line 1</label>
                    <input
                      className="form-control edit-modal-input"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      placeholder="Filled from Google selection"
                    />
                  </div>

                  <div className="row g-3">
                    <div className="col-md-3">
                      <label className="form-label fw-semibold mb-1">City</label>
                      <input className="form-control edit-modal-input" value={city} onChange={(e) => setCity(e.target.value)} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold mb-1">State</label>
                      <input className="form-control edit-modal-input" value={stateVal} onChange={(e) => setStateVal(e.target.value)} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold mb-1">Pincode</label>
                      <input className="form-control edit-modal-input" value={pincode} onChange={(e) => setPincode(e.target.value)} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold mb-1">Country</label>
                      <input className="form-control edit-modal-input" value={country} onChange={(e) => setCountry(e.target.value)} />
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold mb-1">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        className="form-control edit-modal-input"
                        value={latitude ?? ''}
                        onChange={(e) => setLatitude(e.target.value === '' ? null : Number(e.target.value))}
                        placeholder="From Google Places"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold mb-1">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        className="form-control edit-modal-input"
                        value={longitude ?? ''}
                        onChange={(e) => setLongitude(e.target.value === '' ? null : Number(e.target.value))}
                        placeholder="From Google Places"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label fw-semibold mb-1">Warehouse image</label>
                    <input type="file" className="form-control edit-modal-input" accept="image/*" onChange={handleImageChange} />
                    {displayImageSrc && (
                      <div className="mt-2">
                        <img
                          src={displayImageSrc}
                          alt="Warehouse"
                          style={{ maxWidth: 200, maxHeight: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #dee2e6' }}
                        />
                        {!warehouseImageFile && existingImageUrl && (
                          <p className="text-muted small mb-0 mt-1">Current image — choose a file to replace</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
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
                    <div className="col-md-6 d-flex align-items-end">
                      <div className="form-check mb-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="isDefaultEdit"
                          checked={isDefault}
                          onChange={(e) => setIsDefault(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="isDefaultEdit">Default warehouse</label>
                      </div>
                    </div>
                  </div>

                  {error && <p className="text-danger small mb-0">{error}</p>}

                  <div className="d-flex justify-content-end gap-2 pt-2">
                    <button type="button" className="btn btn-light border" onClick={() => navigate(listPath, { state: { vendorName } })} disabled={saving}>
                      Cancel
                    </button>
                    <button type="submit" className="btn edit-modal-save-btn px-3" disabled={saving}>
                      {saving ? 'Updating...' : 'Update Warehouse'}
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

export default EditWarehousePage
