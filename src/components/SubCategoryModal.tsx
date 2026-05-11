import { useState, useEffect, useCallback, useRef } from 'react'
import { getStoredToken } from '../utils/auth'

interface SubCategory {
  sub_category_id: string
  name: string
  [key: string]: unknown
}

interface Props {
  categoryId: string
  categoryName: string
  onClose: () => void
}

const PAGE_SIZE_OPTIONS = [10, 25, 50]

function SubCategoryModal({ categoryId, categoryName, onClose }: Props) {
  const token = getStoredToken()
  const backdropRef = useRef<HTMLDivElement>(null)

  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const fetchSubCategories = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/sub-categories/category/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      setSubCategories(Array.isArray(data) ? data : (data.data ?? []))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sub-categories')
    } finally {
      setLoading(false)
    }
  }, [categoryId, token])

  useEffect(() => {
    fetchSubCategories()
  }, [fetchSubCategories])

  // close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const filtered = subCategories.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleSearch = (val: string) => { setSearch(val); setPage(1) }
  const handlePageSize = (val: number) => { setPageSize(val); setPage(1) }

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
  const visiblePages = pageNumbers.filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1
  )

  return (
    <div
      className="subcat-backdrop"
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose() }}
    >
      <div className="subcat-modal card border-0 rounded-3 shadow-lg">

        {/* ── Header ── */}
        <div className="subcat-modal-header d-flex align-items-center justify-content-between px-4 py-3">
          <div>
            <h6 className="mb-0 fw-bold text-dark">Sub-Categories</h6>
            <small className="text-muted">{categoryName}</small>
          </div>
          <button type="button" className="subcat-close-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="subcat-modal-body px-4 pb-4">

          {/* Toolbar */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
            <div className="d-flex align-items-center gap-2">
              <label className="text-muted small mb-0">Show</label>
              <select
                className="form-select form-select-sm cat-page-select"
                value={pageSize}
                onChange={(e) => handlePageSize(Number(e.target.value))}
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="text-muted small">entries</span>
            </div>

            <div className="cat-search-wrap">
              <span className="cat-search-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
                  <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
              </span>
              <input
                type="search"
                className="form-control form-control-sm cat-search-input"
                placeholder="Search by name…"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="cat-state d-flex flex-column align-items-center justify-content-center py-5 gap-3">
              <div className="spinner-border" style={{ width: '1.8rem', height: '1.8rem', color: '#1b3a5c' }} role="status">
                <span className="visually-hidden">Loading…</span>
              </div>
              <span className="text-muted small">Loading sub-categories…</span>
            </div>
          ) : error ? (
            <div className="cat-state d-flex flex-column align-items-center justify-content-center py-5 gap-3">
              <svg viewBox="0 0 24 24" fill="#dc3545" width="36" height="36">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <p className="text-danger mb-0 small">{error}</p>
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={fetchSubCategories}>
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table cat-table align-middle mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>#</th>
                      <th>Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="text-center text-muted py-5">
                          No sub-categories found
                          {search && <span> for "<strong>{search}</strong>"</span>}
                        </td>
                      </tr>
                    ) : (
                      paginated.map((sub, idx) => (
                        <tr key={sub.sub_category_id}>
                          <td className="text-muted small">{(currentPage - 1) * pageSize + idx + 1}</td>
                          <td className="fw-medium">{sub.name}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3 pt-3 border-top">
                <p className="text-muted small mb-0">
                  {filtered.length === 0
                    ? 'No entries'
                    : `Showing ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filtered.length)} of ${filtered.length} entr${filtered.length === 1 ? 'y' : 'ies'}`}
                </p>

                {totalPages > 1 && (
                  <nav>
                    <ul className="pagination pagination-sm mb-0 cat-pagination">
                      <li className={`page-item${currentPage === 1 ? ' disabled' : ''}`}>
                        <button className="page-link" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1}>‹</button>
                      </li>

                      {visiblePages.map((n, i) => {
                        const prev = visiblePages[i - 1]
                        return (
                          <>
                            {prev !== undefined && n - prev > 1 && (
                              <li key={`ellipsis-${n}`} className="page-item disabled">
                                <span className="page-link">…</span>
                              </li>
                            )}
                            <li key={n} className={`page-item${n === currentPage ? ' active' : ''}`}>
                              <button className="page-link" onClick={() => setPage(n)}>{n}</button>
                            </li>
                          </>
                        )
                      })}

                      <li className={`page-item${currentPage === totalPages ? ' disabled' : ''}`}>
                        <button className="page-link" onClick={() => setPage(currentPage + 1)} disabled={currentPage === totalPages}>›</button>
                      </li>
                    </ul>
                  </nav>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default SubCategoryModal
