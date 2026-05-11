import { useState, useEffect, useRef } from 'react'
import { getStoredToken } from '../utils/auth'

interface Props {
  /** e.g. "Delete Category" */
  title: string
  /** Name of the item being deleted, shown in the confirmation message */
  itemName: string
  /** Full API path, e.g. /api/categories/{id} */
  apiPath: string
  onClose: () => void
  onSuccess: () => void
}

type ModalState = 'confirm' | 'deleting' | 'success' | 'error'

function DeleteConfirmModal({ title, itemName, apiPath, onClose, onSuccess }: Props) {
  const token = getStoredToken()
  const backdropRef = useRef<HTMLDivElement>(null)

  const [state, setState] = useState<ModalState>('confirm')
  const [errorMsg, setErrorMsg] = useState('')

  // Escape closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state !== 'deleting') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose, state])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleDelete = async () => {
    setState('deleting')
    setErrorMsg('')
    try {
      const res = await fetch(apiPath, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      setState('success')
      onSuccess()
      setTimeout(onClose, 900)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete')
      setState('error')
    }
  }

  const isDeleting = state === 'deleting'

  return (
    <div
      className="subcat-backdrop"
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current && !isDeleting) onClose() }}
    >
      <div className="delete-modal card border-0 rounded-3 shadow-lg" role="dialog" aria-modal="true">

        {/* Header */}
        <div className="subcat-modal-header d-flex align-items-center justify-content-between px-4 py-3">
          <h6 className="mb-0 fw-bold text-dark">{title}</h6>
          <button
            type="button"
            className="subcat-close-btn"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="subcat-modal-body px-4 pb-4 pt-3">

          {state === 'success' ? (
            <div className="d-flex flex-column align-items-center py-4 gap-3">
              <div className="edit-modal-success-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.59L5.41 12l1.41-1.41L10 13.17l7.18-7.18 1.41 1.42L10 16.59z" />
                </svg>
              </div>
              <p className="mb-0 fw-semibold" style={{ color: '#198754' }}>Deleted successfully!</p>
            </div>
          ) : (
            <>
              {/* Warning icon + message */}
              <div className="d-flex gap-3 align-items-start mb-4">
                <div className="delete-modal-warn-icon flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                  </svg>
                </div>
                <div>
                  <p className="mb-1 fw-semibold text-dark" style={{ fontSize: '0.92rem' }}>
                    Are you sure you want to delete this?
                  </p>
                  <p className="mb-0 text-muted" style={{ fontSize: '0.85rem' }}>
                    <span className="fw-semibold text-dark">"{itemName}"</span> will be permanently removed. This action cannot be undone.
                  </p>
                </div>
              </div>

              {state === 'error' && (
                <div className="alert alert-danger py-2 px-3 small mb-3">{errorMsg}</div>
              )}

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary px-4"
                  onClick={onClose}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm delete-modal-confirm-btn px-4"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                      Deleting…
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" className="me-1">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                      </svg>
                      Delete
                    </>
                  )}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmModal
