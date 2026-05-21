import { useCallback, useEffect, useRef, useState } from 'react'
import { getStoredToken } from '../utils/auth'

const WAREHOUSES_API = '/api/vendor/warehouses'

export interface WarehouseDetail {
  warehouse_id?: string
  id?: string
  vendor_id?: string
  name?: string
  code?: string
  warehouse_image?: string
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  pincode?: string
  country?: string
  address?: string
  full_address?: string
  latitude?: number | string
  longitude?: number | string
  status?: number
  is_default?: number | boolean
  [key: string]: unknown
}

interface Props {
  warehouseId: string
  warehouseName?: string
  onClose: () => void
}

function formatAddress(item: WarehouseDetail): string {
  const parts = [
    item.address_line1,
    item.address_line2,
    item.city,
    item.state,
    item.pincode,
    item.country,
  ].filter((p) => p != null && String(p).trim() !== '')

  if (item.full_address && String(item.full_address).trim()) return String(item.full_address)
  if (parts.length > 0) return parts.map(String).join(', ')
  if (item.address && String(item.address).trim()) return String(item.address)
  return '—'
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="row py-2 border-bottom border-light">
      <div className="col-4 text-muted small fw-semibold">{label}</div>
      <div className="col-8 small text-dark">{value || '—'}</div>
    </div>
  )
}

function WarehouseViewModal({ warehouseId, warehouseName, onClose }: Props) {
  const token = getStoredToken()
  const backdropRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [item, setItem] = useState<WarehouseDetail | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose, loading])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const fetchWarehouse = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${WAREHOUSES_API}/${warehouseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const json = await res.json()
      setItem((json?.data ?? json) as WarehouseDetail)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load warehouse')
    } finally {
      setLoading(false)
    }
  }, [token, warehouseId])

  useEffect(() => {
    fetchWarehouse()
  }, [fetchWarehouse])

  const title = item?.name ?? warehouseName ?? 'Warehouse'
  const st = Number(item?.status) === 0 ? 0 : 1
  const isDefault = item?.is_default === true || item?.is_default === 1

  return (
    <div
      className="subcat-backdrop"
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current && !loading) onClose() }}
    >
      <div className="edit-modal card border-0 rounded-3 shadow-lg" role="dialog" aria-modal="true" style={{ maxWidth: 560, width: '100%' }}>
        <div className="subcat-modal-header d-flex align-items-center justify-content-between px-4 py-3">
          <h6 className="mb-0 fw-bold text-dark">Warehouse Details</h6>
          <button type="button" className="subcat-close-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <div className="subcat-modal-body px-4 pb-4">
          {loading ? (
            <div className="d-flex flex-column align-items-center py-4 gap-2">
              <div className="spinner-border text-primary" style={{ width: '2rem', height: '2rem' }} role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <span className="text-muted small">Loading warehouse details...</span>
            </div>
          ) : error ? (
            <div className="text-center py-3">
              <p className="text-danger small mb-2">{error}</p>
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={fetchWarehouse}>
                Retry
              </button>
            </div>
          ) : item ? (
            <>
              <p className="fw-semibold text-dark mb-3">{title}</p>
              <DetailRow label="Code" value={String(item.code ?? '')} />
              <DetailRow label="Vendor ID" value={String(item.vendor_id ?? '')} />
              <DetailRow label="Full address" value={String(item.full_address ?? formatAddress(item))} />
              <DetailRow label="Address line 1" value={String(item.address_line1 ?? item.addressLine1 ?? '')} />
              <DetailRow
                label="Coordinates"
                value={
                  item.latitude != null || item.longitude != null
                    ? `${item.latitude ?? '—'}, ${item.longitude ?? '—'}`
                    : '—'
                }
              />
              <DetailRow label="Status" value={st === 1 ? 'Active' : 'Inactive'} />
              <DetailRow label="Default warehouse" value={isDefault ? 'Yes' : 'No'} />
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default WarehouseViewModal
