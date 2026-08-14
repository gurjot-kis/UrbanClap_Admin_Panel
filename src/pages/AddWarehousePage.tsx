import { useCallback, useEffect, useState, type ChangeEvent } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate, useParams, useLocation } from 'react-router-dom'
import { getStoredToken, getStoredUser } from '../utils/auth'
import GoogleAddressInput from '../components/GoogleAddressInput'
import type { ParsedAddress } from '../utils/googlePlaces'
import { ROUTES } from '../routes'
import '../styles/Dashboard.css'
import { useHeader } from '../layout/LayoutContext'

const WAREHOUSES_API = '/api/vendor/warehouses'
const VENDORS_API = '/api/vendor/vendors'

interface VendorOption {
  vendor_id?: string
  id?: string
  name?: string
  [key: string]: unknown
}

const getVendorOptionId = (v: VendorOption): string => String(v.vendor_id ?? v.id ?? '')

function appendFormField(formData: FormData, key: string, value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined) return
  if (typeof value === 'string' && !value.trim()) return
  formData.append(key, String(value))
}

function AddWarehousePage() {
  const navigate = useNavigate()
  const { vendorId: vendorIdFromRoute } = useParams<{ vendorId: string }>()
  const location = useLocation()
  const vendorNameFromState = (location.state as { vendorName?: string } | null)?.vendorName ?? ''
  const { setHeaderConfig } = useHeader()

  const token = getStoredToken()
  const user = getStoredUser()

  const isRootVendorsNew = location.pathname === ROUTES.vendorsNew
  const routeVendorId = isRootVendorsNew ? '' : (vendorIdFromRoute ?? '')

  const [vendorOptions, setVendorOptions] = useState<VendorOption[]>([])
  const [vendorsLoading, setVendorsLoading] = useState(isRootVendorsNew)
  const [selectedVendorId, setSelectedVendorId] = useState('')

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
  const [warehouseImageFile, setWarehouseImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')
  const [status, setStatus] = useState<0 | 1>(1)
  const [isDefault, setIsDefault] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const effectiveVendorId = isRootVendorsNew ? selectedVendorId : routeVendorId
  const listPath = effectiveVendorId ? ROUTES.vendorWarehouses(effectiveVendorId) : ROUTES.vendors

  const selectedVendorName = vendorOptions.find((v) => getVendorOptionId(v) === selectedVendorId)?.name
  const headerSubtitle = isRootVendorsNew
    ? (selectedVendorName ? String(selectedVendorName) : 'Select a vendor')
    : (vendorNameFromState || 'Vendor')

  useEffect(() => {
    setHeaderConfig({
      title: 'Add Warehouse',
      subtitle: headerSubtitle,
      backTo: isRootVendorsNew ? ROUTES.vendors : listPath,
      backTitle: isRootVendorsNew ? 'Back to Vendors' : 'Back to Warehouses'
    })
  }, [headerSubtitle, isRootVendorsNew, listPath, setHeaderConfig])

  if (!token || !user) {
    return <Navigate to={ROUTES.login} replace />
  }

  if (!isRootVendorsNew && !routeVendorId) {
    return <Navigate to={ROUTES.vendors} replace />
  }

  const fetchVendorsForPicker = useCallback(async () => {
    if (!isRootVendorsNew) return
    setVendorsLoading(true)
    try {
      const params = new URLSearchParams({ page: '1', limit: '500' })
      const res = await fetch(`${VENDORS_API}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const json = await res.json()
      const list: VendorOption[] = Array.isArray(json) ? json : (json.data ?? [])
      setVendorOptions(list)
    } catch {
      setVendorOptions([])
    } finally {
      setVendorsLoading(false)
    }
  }, [isRootVendorsNew, token])

  useEffect(() => {
    fetchVendorsForPicker()
  }, [fetchVendorsForPicker])

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!effectiveVendorId) {
      setError(isRootVendorsNew ? 'Please select a vendor' : 'Missing vendor')
      return
    }
    if (!name.trim()) {
      setError('Warehouse name is required')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('vendor_id', effectiveVendorId)
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

      const res = await fetch(WAREHOUSES_API, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)

      const vendorName = isRootVendorsNew
        ? String(selectedVendorName ?? '')
        : vendorNameFromState
      navigate(listPath, { state: { vendorName } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add warehouse')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="p-4">
          <div className="card border-0 rounded-3 shadow-sm" style={{ maxWidth: 720 }}>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                {isRootVendorsNew && (
                  <div>
                    <label className="form-label fw-semibold mb-1">Vendor</label>
                    {vendorsLoading ? (
                      <p className="text-muted small mb-0">Loading vendors…</p>
                    ) : (
                      <select
                        className="form-select edit-modal-input"
                        value={selectedVendorId}
                        onChange={(e) => setSelectedVendorId(e.target.value)}
                        required
                      >
                        <option value="">Select vendor…</option>
                        {vendorOptions.map((v) => {
                          const id = getVendorOptionId(v)
                          if (!id) return null
                          return (
                            <option key={id} value={id}>{String(v.name ?? id)}</option>
                          )
                        })}
                      </select>
                    )}
                  </div>
                )}

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
                  {imagePreviewUrl && (
                    <div className="mt-2">
                      <img
                        src={imagePreviewUrl}
                        alt="Preview"
                        style={{ maxWidth: 200, maxHeight: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #dee2e6' }}
                      />
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
                        id="isDefaultAdd"
                        checked={isDefault}
                        onChange={(e) => setIsDefault(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="isDefaultAdd">Default warehouse</label>
                    </div>
                  </div>
                </div>

                {error && <p className="text-danger small mb-0">{error}</p>}

                <div className="d-flex justify-content-end gap-2 pt-2">
                  <button
                    type="button"
                    className="btn btn-light border"
                    onClick={() => navigate(isRootVendorsNew ? ROUTES.vendors : listPath, { state: { vendorName: vendorNameFromState } })}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn edit-modal-save-btn px-3" disabled={saving || (isRootVendorsNew && vendorsLoading)}>
                    {saving ? 'Saving...' : 'Save Warehouse'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
    </>
  )
}

export default AddWarehousePage
