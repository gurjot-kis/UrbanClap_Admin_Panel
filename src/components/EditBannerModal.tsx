import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { getStoredToken } from '../utils/auth'
import { resolveMediaUrl } from '../config/api'

interface Props {
  bannerId: string
  /** Shown in header while loading / as subtitle */
  initialTitle: string
  initialDescription: string
  initialOrderUrl: string
  initialStatus: 0 | 1
  initialBannerImage: string
  onClose: () => void
  onSuccess: () => void
}

type FormState = 'ready' | 'saving' | 'success' | 'saveError'

function parseStatus(v: unknown): 0 | 1 {
  const n = Number(v)
  return n === 0 ? 0 : 1
}

function EditBannerModal({
  bannerId,
  initialTitle,
  initialDescription,
  initialOrderUrl,
  initialStatus,
  initialBannerImage,
  onClose,
  onSuccess,
}: Props) {
  const token = getStoredToken()
  const backdropRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  const apiPath = `/api/banners/${bannerId}`

  const [formState, setFormState] = useState<FormState>('ready')
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [orderUrl, setOrderUrl] = useState(initialOrderUrl)
  const [status, setStatus] = useState<0 | 1>(initialStatus)
  const [imageUrl, setImageUrl] = useState(initialBannerImage)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')
  const [hydrating, setHydrating] = useState(true)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    titleRef.current?.select()
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(apiPath, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error(`Server error: ${res.status}`)
        const json = await res.json()
        const record = json?.data ?? json
        if (cancelled) return
        if (title === initialTitle) setTitle(String(record.title ?? initialTitle ?? ''))
        setDescription(String(record.description ?? ''))
        setOrderUrl(String(record.order_url ?? record.orderUrl ?? ''))
        setStatus(parseStatus(record.status ?? initialStatus))
        const img = record.banner_image ?? record.bannerImage ?? initialBannerImage
        setImageUrl(String(img ?? ''))
      } catch {
        // keep list-row values
      } finally {
        if (!cancelled) setHydrating(false)
      }
    })()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiPath, token])

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl('')
      return
    }
    const objectUrl = URL.createObjectURL(imageFile)
    setImagePreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [imageFile])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && formState !== 'saving') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose, formState])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return

    setFormState('saving')
    setSaveError('')
    try {
      const formData = new FormData()
      formData.append('title', trimmed)
      formData.append('description', description.trim())
      formData.append('order_url', orderUrl.trim())
      formData.append('status', String(status))
      if (imageFile) formData.append('banner_image', imageFile)

      const res = await fetch(apiPath, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      setFormState('success')
      onSuccess()
      setTimeout(onClose, 900)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update')
      setFormState('saveError')
    }
  }

  const isSaving = formState === 'saving'

  return (
    <div
      className="subcat-backdrop"
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current && !isSaving) onClose() }}
    >
      <div className="edit-modal card border-0 rounded-3 shadow-lg" role="dialog" aria-modal="true">

        <div className="subcat-modal-header d-flex align-items-center justify-content-between px-4 py-3">
          <div>
            <h6 className="mb-0 fw-bold text-dark">Edit Banner</h6>
            <small className="text-muted">{initialTitle}</small>
          </div>
          <button
            type="button"
            className="subcat-close-btn"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <div className="subcat-modal-body px-4 pb-4">

          {formState === 'success' ? (
            <div className="d-flex flex-column align-items-center py-5 gap-3">
              <div className="edit-modal-success-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.59L5.41 12l1.41-1.41L10 13.17l7.18-7.18 1.41 1.42L10 16.59z" />
                </svg>
              </div>
              <p className="mb-0 fw-semibold" style={{ color: '#198754' }}>Updated successfully!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="pt-3">

              <div className="mb-3">
                <label className="form-label fw-semibold small text-dark d-flex align-items-center gap-2">
                  Title
                  {hydrating && (
                    <span className="spinner-border spinner-border-sm text-secondary" style={{ width: '0.7rem', height: '0.7rem' }} role="status" />
                  )}
                </label>
                <input
                  ref={titleRef}
                  type="text"
                  className="form-control edit-modal-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isSaving}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small text-dark">Description</label>
                <textarea
                  className="form-control edit-modal-input edit-modal-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSaving}
                  rows={3}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small text-dark">Order URL</label>
                <input
                  type="url"
                  className="form-control edit-modal-input"
                  value={orderUrl}
                  onChange={(e) => setOrderUrl(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small text-dark">Status</label>
                <select
                  className="form-select edit-modal-input"
                  value={status}
                  onChange={(e) => setStatus(Number(e.target.value) as 0 | 1)}
                  disabled={isSaving}
                >
                  <option value={1}>Active (1)</option>
                  <option value={0}>Inactive (0)</option>
                </select>
              </div>

              <div className="mb-3">
                {imageUrl && !imagePreviewUrl && (
                  <div className="mb-2">
                    <label className="form-label fw-semibold small text-dark d-block">Current image</label>
                    <img
                      src={resolveMediaUrl(imageUrl)}
                      alt="Current banner"
                      style={{ width: 200, height: 100, objectFit: 'cover', borderRadius: 8, border: '1px solid #dee2e6' }}
                    />
                  </div>
                )}
                <label className="form-label fw-semibold small text-dark">Replace image</label>
                <input
                  type="file"
                  className="form-control edit-modal-input"
                  accept="image/*"
                  disabled={isSaving}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setImageFile(e.target.files?.[0] ?? null)
                  }}
                />
                {imagePreviewUrl && (
                  <div className="mt-2">
                    <label className="form-label fw-semibold small text-dark d-block">New image</label>
                    <img
                      src={resolveMediaUrl(imagePreviewUrl)}
                      alt="Preview"
                      style={{ width: 200, height: 100, objectFit: 'cover', borderRadius: 8, border: '1px solid #dee2e6' }}
                    />
                  </div>
                )}
              </div>

              {formState === 'saveError' && (
                <div className="alert alert-danger py-2 px-3 small mb-3">{saveError}</div>
              )}

              <div className="d-flex justify-content-end gap-2 pt-1">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary px-4"
                  onClick={onClose}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm edit-modal-save-btn px-4"
                  disabled={isSaving || !title.trim()}
                >
                  {isSaving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                      Saving…
                    </>
                  ) : 'Save'}
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  )
}

export default EditBannerModal
