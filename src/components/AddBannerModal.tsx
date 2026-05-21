import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { resolveMediaUrl } from '../config/api'
import { getStoredToken } from '../utils/auth'

interface Props {
  onClose: () => void
  onSuccess: () => void
}

type FormState = 'ready' | 'saving' | 'success' | 'saveError'

function AddBannerModal({ onClose, onSuccess }: Props) {
  const token = getStoredToken()
  const backdropRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  const [formState, setFormState] = useState<FormState>('ready')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [orderUrl, setOrderUrl] = useState('')
  const [status, setStatus] = useState<0 | 1>(1)
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null)
  const [saveError, setSaveError] = useState('')
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && formState !== 'saving') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose, formState])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    if (!bannerImageFile) {
      setImagePreviewUrl('')
      return
    }
    const objectUrl = URL.createObjectURL(bannerImageFile)
    setImagePreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [bannerImageFile])

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setBannerImageFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return

    setFormState('saving')
    setSaveError('')
    try {
      const formData = new FormData()
      formData.append('title', trimmedTitle)
      formData.append('description', description.trim())
      formData.append('order_url', orderUrl.trim())
      formData.append('status', String(status))
      if (bannerImageFile) formData.append('banner_image', bannerImageFile)

      const res = await fetch('/api/banners', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      setFormState('success')
      onSuccess()
      setTimeout(onClose, 900)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to create banner')
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
            <h6 className="mb-0 fw-bold text-dark">Add Banner</h6>
            <small className="text-muted">Create a new banner</small>
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
              <p className="mb-0 fw-semibold" style={{ color: '#198754' }}>Banner created successfully!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="pt-3">

              <div className="mb-3">
                <label className="form-label fw-semibold small text-dark">
                  Title <span className="text-danger">*</span>
                </label>
                <input
                  ref={titleRef}
                  type="text"
                  className="form-control edit-modal-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Summer sale"
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
                  placeholder="Short description"
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
                  placeholder="https://…"
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
                <label className="form-label fw-semibold small text-dark">Banner image</label>
                <input
                  type="file"
                  className="form-control edit-modal-input"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isSaving}
                />
                {imagePreviewUrl && (
                  <div className="mt-2">
                    <img
                      src={resolveMediaUrl(imagePreviewUrl)}
                      alt="Banner preview"
                      style={{ width: 160, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #dee2e6' }}
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
                      Creating…
                    </>
                  ) : 'Add Banner'}
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  )
}

export default AddBannerModal
