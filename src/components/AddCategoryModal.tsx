import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { resolveMediaUrl } from '../config/api'
import { getStoredToken } from '../utils/auth'

interface Props {
  onClose: () => void
  onSuccess: () => void
}

type FormState = 'ready' | 'saving' | 'success' | 'saveError'

function AddCategoryModal({ onClose, onSuccess }: Props) {
  const token = getStoredToken()
  const backdropRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  const [formState, setFormState] = useState<FormState>('ready')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null)
  const [saveError, setSaveError] = useState('')
  const [categoryImagePreviewUrl, setCategoryImagePreviewUrl] = useState('')

  // Focus name input on open
  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  // Escape closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && formState !== 'saving') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose, formState])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    if (!categoryImageFile) {
      setCategoryImagePreviewUrl('')
      return
    }
    const objectUrl = URL.createObjectURL(categoryImageFile)
    setCategoryImagePreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [categoryImageFile])

  const handleCategoryImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setCategoryImageFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return

    setFormState('saving')
    setSaveError('')
    try {
      const formData = new FormData()
      formData.append('name', trimmedName)
      formData.append('description', description.trim())
      if (categoryImageFile) formData.append('category_image', categoryImageFile)

      const res = await fetch('/api/categories', {
        method: 'POST',
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
      setSaveError(err instanceof Error ? err.message : 'Failed to create category')
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
            <h6 className="mb-0 fw-bold text-dark">Add Category</h6>
            <small className="text-muted">Create a new category</small>
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

          {formState === 'success' ? (
            <div className="d-flex flex-column align-items-center py-5 gap-3">
              <div className="edit-modal-success-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.59L5.41 12l1.41-1.41L10 13.17l7.18-7.18 1.41 1.42L10 16.59z" />
                </svg>
              </div>
              <p className="mb-0 fw-semibold" style={{ color: '#198754' }}>Category created successfully!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="pt-3">

              {/* Name */}
              <div className="mb-3">
                <label className="form-label fw-semibold small text-dark">
                  Name <span className="text-danger">*</span>
                </label>
                <input
                  ref={nameRef}
                  type="text"
                  className="form-control edit-modal-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Laptop"
                  disabled={isSaving}
                  required
                />
              </div>

              {/* Description */}
              <div className="mb-3">
                <label className="form-label fw-semibold small text-dark">Description</label>
                <textarea
                  className="form-control edit-modal-input edit-modal-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Laptop items"
                  disabled={isSaving}
                  rows={3}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small text-dark">Category Image</label>
                <input
                  type="file"
                  className="form-control edit-modal-input"
                  accept="image/*"
                  onChange={handleCategoryImageChange}
                  disabled={isSaving}
                />
                {categoryImagePreviewUrl && (
                  <div className="mt-2">
                    <img
                      src={resolveMediaUrl(categoryImagePreviewUrl)}
                      alt="Category preview"
                      style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #dee2e6' }}
                    />
                  </div>
                )}
              </div>

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
                      Creating…
                    </>
                  ) : 'Add Category'}
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  )
}

export default AddCategoryModal
