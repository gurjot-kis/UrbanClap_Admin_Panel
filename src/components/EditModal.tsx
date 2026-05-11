import { useState, useEffect, useRef } from 'react'
import { getStoredToken } from '../utils/auth'
import { resolveMediaUrl } from '../config/api'

interface Props {
  title: string
  /** Name shown in the header below the title */
  subtitle?: string
  /** Pre-fills the Name input immediately (no loading wait) */
  initialName?: string
  /** Pre-fills the Description textarea immediately (no loading wait) */
  initialDescription?: string
  /** Full API path used for both GET and PUT, e.g. /api/categories/{id} */
  apiPath: string
  /** When true, shows a Description textarea */
  showDescription?: boolean
  initialImageUrl?: string
  imageFieldName?: string
  showImageUpload?: boolean
  onClose: () => void
  onSuccess: () => void
}

type FormState = 'ready' | 'saving' | 'success' | 'saveError'

function EditModal({
  title,
  subtitle,
  initialName,
  initialDescription,
  apiPath,
  showDescription = false,
  initialImageUrl = '',
  imageFieldName = 'image',
  showImageUpload = false,
  onClose,
  onSuccess,
}: Props) {
  const token = getStoredToken()
  const backdropRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Form is shown immediately; name is pre-filled from initialName
  const [formState, setFormState] = useState<FormState>('ready')
  const [name, setName] = useState(initialName ?? '')
  const [description, setDescription] = useState(initialDescription ?? '')
  const [imageUrl, setImageUrl] = useState(initialImageUrl)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')
  // Show loading spinner when description has no pre-filled value (empty or not provided)
  const [descLoading, setDescLoading] = useState(showDescription && !initialDescription)
  const [saveError, setSaveError] = useState('')

  // Focus name input on open
  useEffect(() => {
    inputRef.current?.select()
  }, [])

  // Fetch full record in background to hydrate description (and sync name if not yet edited)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(apiPath, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error(`Server error: ${res.status}`)
        const json = await res.json()
        // Handle both flat { name, description } and wrapped { data: { name, description } }
        const record = json?.data ?? json
        if (!cancelled) {
          if (name === (initialName ?? '')) setName(record.name ?? initialName ?? '')
          setDescription(record.description ?? '')
          if (showImageUpload) setImageUrl((record.category_image as string) ?? initialImageUrl ?? '')
        }
      } catch {
        // silently ignore – user can still edit name
      } finally {
        if (!cancelled) setDescLoading(false)
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

  // Escape closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && formState !== 'saving') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose, formState])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    setFormState('saving')
    setSaveError('')
    try {
      const formData = new FormData()
      formData.append('name', trimmed)
      if (showDescription) formData.append('description', description.trim())
      if (showImageUpload && imageFile) formData.append(imageFieldName, imageFile)

      const res = await fetch(apiPath, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

        {/* ── Header ── */}
        <div className="subcat-modal-header d-flex align-items-center justify-content-between px-4 py-3">
          <div>
            <h6 className="mb-0 fw-bold text-dark">{title}</h6>
            {subtitle && <small className="text-muted">{subtitle}</small>}
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

        {/* ── Body ── */}
        <div className="subcat-modal-body px-4 pb-4">

          {/* Success state */}
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

              {/* Name */}
              <div className="mb-3">
                <label className="form-label fw-semibold small text-dark">Name</label>
                <input
                  ref={inputRef}
                  type="text"
                  className="form-control edit-modal-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter name"
                  disabled={isSaving}
                  required
                />
              </div>

              {/* Description (only for categories) */}
              {showDescription && (
                <div className="mb-3">
                  <label className="form-label fw-semibold small text-dark d-flex align-items-center gap-2">
                    Description
                    {descLoading && (
                      <span className="spinner-border spinner-border-sm text-secondary" style={{ width: '0.7rem', height: '0.7rem' }} role="status" />
                    )}
                  </label>
                  <textarea
                    className="form-control edit-modal-input edit-modal-textarea"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={descLoading ? 'Loading…' : 'Enter description'}
                    disabled={isSaving || descLoading}
                    rows={3}
                  />
                </div>
              )}

              {showImageUpload && (
                <div className="mb-3">
                  {imageUrl && !imagePreviewUrl && (
                    <div className="mb-2">
                      <label className="form-label fw-semibold small text-dark d-block">Current Image</label>
                      <img
                        src={resolveMediaUrl(imageUrl)}
                        alt="Current"
                        style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #dee2e6' }}
                      />
                    </div>
                  )}
                  <label className="form-label fw-semibold small text-dark">Upload Image</label>
                  <input
                    type="file"
                    className="form-control edit-modal-input"
                    accept="image/*"
                    disabled={isSaving}
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null
                      setImageFile(file)
                    }}
                  />
                  {imagePreviewUrl && (
                    <div className="mt-2">
                      <label className="form-label fw-semibold small text-dark d-block">New Image (to replace)</label>
                      <img
                        src={resolveMediaUrl(imagePreviewUrl)}
                        alt="Preview"
                        style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #dee2e6' }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Save error */}
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
                  disabled={isSaving || !name.trim()}
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

export default EditModal
