import { useState, useEffect, useRef } from 'react'
import { getStoredToken } from '../utils/auth'

export interface CartSettingsFormValues {
  handling_charge: number
  delivery_charge: number
  free_delivery_min_amount: number
  small_cart_charge: number
  small_cart_max_amount: number
}

interface Props {
  cartSettingsId: string
  initialValues: CartSettingsFormValues
  onClose: () => void
  onSuccess: () => void
  apiBasePath?: string
  queryString?: string
  extraPayload?: Record<string, unknown>
}

type FormState = 'ready' | 'saving' | 'success' | 'saveError'

type FieldKey = keyof CartSettingsFormValues

const FIELDS: { key: FieldKey; label: string }[] = [
  { key: 'handling_charge', label: 'Handling charge' },
  { key: 'delivery_charge', label: 'Delivery charge' },
  { key: 'free_delivery_min_amount', label: 'Free delivery min amount' },
  { key: 'small_cart_charge', label: 'Small cart charge' },
  { key: 'small_cart_max_amount', label: 'Small cart max amount' },
]

function toStrings(v: CartSettingsFormValues): Record<FieldKey, string> {
  return {
    handling_charge: String(v.handling_charge ?? ''),
    delivery_charge: String(v.delivery_charge ?? ''),
    free_delivery_min_amount: String(v.free_delivery_min_amount ?? ''),
    small_cart_charge: String(v.small_cart_charge ?? ''),
    small_cart_max_amount: String(v.small_cart_max_amount ?? ''),
  }
}

function buildPayload(values: Record<FieldKey, string>) {
  const handling_charge = Number(values.handling_charge)
  const delivery_charge = Number(values.delivery_charge)
  const free_delivery_min_amount = Number(values.free_delivery_min_amount)
  const small_cart_charge = Number(values.small_cart_charge)
  const small_cart_max_amount = Number(values.small_cart_max_amount)
  const nums = [handling_charge, delivery_charge, free_delivery_min_amount, small_cart_charge, small_cart_max_amount]
  if (nums.some((n) => !Number.isFinite(n) || n < 0)) return null
  return { handling_charge, delivery_charge, free_delivery_min_amount, small_cart_charge, small_cart_max_amount }
}

function recordToValues(record: Record<string, unknown>, fallback: CartSettingsFormValues): CartSettingsFormValues {
  return {
    handling_charge: Number(record.handling_charge ?? fallback.handling_charge),
    delivery_charge: Number(record.delivery_charge ?? fallback.delivery_charge),
    free_delivery_min_amount: Number(record.free_delivery_min_amount ?? fallback.free_delivery_min_amount),
    small_cart_charge: Number(record.small_cart_charge ?? fallback.small_cart_charge),
    small_cart_max_amount: Number(record.small_cart_max_amount ?? fallback.small_cart_max_amount),
  }
}

function EditCartSettingsModal({
  cartSettingsId,
  initialValues,
  onClose,
  onSuccess,
  apiBasePath = '/api/admin/cart-settings',
  queryString = '',
  extraPayload,
}: Props) {
  const token = getStoredToken()
  const backdropRef = useRef<HTMLDivElement>(null)
  const firstRef = useRef<HTMLInputElement>(null)
  const apiPath = `${apiBasePath}/${cartSettingsId}${queryString ? `?${queryString}` : ''}`

  const [formState, setFormState] = useState<FormState>('ready')
  const [values, setValues] = useState(() => toStrings(initialValues))
  const [hydrating, setHydrating] = useState(true)
  const [saveError, setSaveError] = useState('')

  useEffect(() => { firstRef.current?.focus() }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(apiPath, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) throw new Error(`Server error: ${res.status}`)
        const json = await res.json()
        const record = (json?.data ?? json) as Record<string, unknown>
        if (!cancelled) setValues(toStrings(recordToValues(record, initialValues)))
      } catch { /* keep list-row values */ } finally {
        if (!cancelled) setHydrating(false)
      }
    })()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiPath, token])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && formState !== 'saving') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose, formState])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const payload = buildPayload(values)
  const isSaving = formState === 'saving'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payload) return
    setFormState('saving')
    setSaveError('')
    try {
      const res = await fetch(apiPath, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, ...(extraPayload ?? {}) }),
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      setFormState('success')
      onSuccess()
      setTimeout(onClose, 900)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update cart settings')
      setFormState('saveError')
    }
  }

  return (
    <div className="subcat-backdrop" ref={backdropRef} onClick={(e) => { if (e.target === backdropRef.current && !isSaving) onClose() }}>
      <div className="edit-modal card border-0 rounded-3 shadow-lg" role="dialog" aria-modal="true">
        <div className="subcat-modal-header d-flex align-items-center justify-content-between px-4 py-3">
          <div>
            <h6 className="mb-0 fw-bold text-dark">Edit Cart Settings</h6>
            <small className="text-muted">#{cartSettingsId}</small>
          </div>
          <button type="button" className="subcat-close-btn" onClick={onClose} disabled={isSaving} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
          </button>
        </div>
        <div className="subcat-modal-body px-4 pb-4">
          {formState === 'success' ? (
            <div className="d-flex flex-column align-items-center py-5 gap-3">
              <div className="edit-modal-success-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.59L5.41 12l1.41-1.41L10 13.17l7.18-7.18 1.41 1.42L10 16.59z" /></svg>
              </div>
              <p className="mb-0 fw-semibold" style={{ color: '#198754' }}>Updated successfully!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="pt-3">
              {FIELDS.map(({ key, label }, idx) => (
                <div key={key} className="mb-3">
                  <label className="form-label fw-semibold small text-dark d-flex align-items-center gap-2">
                    {label} <span className="text-danger">*</span>
                    {idx === 0 && hydrating && <span className="spinner-border spinner-border-sm text-secondary" style={{ width: '0.7rem', height: '0.7rem' }} role="status" />}
                  </label>
                  <input ref={idx === 0 ? firstRef : undefined} type="number" className="form-control edit-modal-input" value={values[key]} onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))} placeholder="0" min={0} step={1} disabled={isSaving} required />
                </div>
              ))}
              {formState === 'saveError' && <div className="alert alert-danger py-2 px-3 small mb-3">{saveError}</div>}
              <div className="d-flex justify-content-end gap-2 pt-1">
                <button type="button" className="btn btn-sm btn-outline-secondary px-4" onClick={onClose} disabled={isSaving}>Cancel</button>
                <button type="submit" className="btn btn-sm edit-modal-save-btn px-4" disabled={isSaving || !payload}>
                  {isSaving ? (<><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Saving…</>) : 'Save'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default EditCartSettingsModal
