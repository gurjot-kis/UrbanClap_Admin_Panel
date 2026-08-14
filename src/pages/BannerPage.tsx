import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { getStoredToken, getStoredUser } from '../utils/auth'
import AddBannerModal from '../components/AddBannerModal'
import EditBannerModal from '../components/EditBannerModal'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import { resolveMediaUrl } from '../config/api'
import { ROUTES } from '../routes'
import { formatUploadAreaLabel } from '../utils/banner'
import '../styles/Dashboard.css'
import { useHeader } from '../layout/LayoutContext'

interface Banner {
  id?: string
  banner_id?: string
  title?: string
  description?: string
  banner_image?: string
  order_url?: string
  orderUrl?: string
  status?: number
  upload_area?: string
  [key: string]: unknown
}

const PAGE_SIZE_OPTIONS = [10, 25, 50]

function bannerRowId(b: Banner): string {
  return String(b.banner_id ?? b.id ?? '')
}

function bannerStatus(b: Banner): 0 | 1 {
  const s = Number(b.status)
  return s === 0 ? 0 : 1
}

function BannerPage() {
  const { setHeaderConfig } = useHeader()

  useEffect(() => {
    setHeaderConfig({ title: 'Banners' })
  }, [setHeaderConfig])

  const token = getStoredToken()
  const user = getStoredUser()

  const [banners, setBanners] = useState<Banner[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editing, setEditing] = useState<Banner | null>(null)
  const [deleting, setDeleting] = useState<{ id: string; title: string } | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (!token || !user) {
    return <Navigate to={ROUTES.login} replace />
  }

  const handleSearch = (val: string) => {
    setSearch(val)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(val)
      setPage(1)
    }, 400)
  }

  const handlePageSize = (val: number) => {
    setPageSize(val)
    setPage(1)
  }

  const fetchBanners = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      })
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim())

      const res = await fetch(`/api/banners?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const json = await res.json()

      const items: Banner[] = Array.isArray(json) ? json : (json.data ?? [])
      const serverTotal: number =
        json.total ?? json.meta?.total ?? json.pagination?.total ?? items.length

      setBanners(items)
      setTotal(serverTotal)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load banners')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, debouncedSearch, token])

  useEffect(() => {
    fetchBanners()
  }, [fetchBanners])



  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
  const visiblePages = pageNumbers.filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1
  )

  return (
    <>
      <div className="p-4 d-flex flex-column gap-3 flex-grow-1">
          <div className="card border-0 rounded-3 shadow-sm">
            <div className="card-body p-4">

              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
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

                <div className="d-flex align-items-center gap-3">
                  <button
                    type="button"
                    className="btn btn-sm cat-btn-add"
                    onClick={() => setShowAddModal(true)}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" className="me-1">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                    Add Banner
                  </button>

                  <div className="cat-search-wrap">
                    <span className="cat-search-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
                        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                      </svg>
                    </span>
                    <input
                      type="search"
                      className="form-control form-control-sm cat-search-input"
                      placeholder="Search…"
                      value={search}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="cat-state d-flex flex-column align-items-center justify-content-center py-5 gap-3">
                  <div className="spinner-border text-primary" style={{ width: '2rem', height: '2rem' }} role="status">
                    <span className="visually-hidden">Loading…</span>
                  </div>
                  <span className="text-muted small">Loading banners…</span>
                </div>
              ) : error ? (
                <div className="cat-state d-flex flex-column align-items-center justify-content-center py-5 gap-3">
                  <svg viewBox="0 0 24 24" fill="#dc3545" width="40" height="40">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  <p className="text-danger mb-0 small">{error}</p>
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={fetchBanners}>
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
                          <th style={{ width: 100 }}>Image</th>
                          <th>Title</th>
                          <th>Description</th>
                          <th>Order URL</th>
                          <th style={{ width: 100 }}>Upload Area</th>
                          <th style={{ width: 100 }}>Status</th>
                          <th style={{ width: 120 }} className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {banners.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center text-muted py-5">
                              No banners found
                              {debouncedSearch && (
                                <span>
                                  {' '}
                                  for &quot;<strong>{debouncedSearch}</strong>&quot;
                                </span>
                              )}
                            </td>
                          </tr>
                        ) : (
                          banners.map((b, idx) => {
                            const bid = bannerRowId(b)
                            const title = String(b.title ?? '')
                            const desc = String(b.description ?? '')
                            const orderLink = String(b.order_url ?? b.orderUrl ?? '')
                            const st = bannerStatus(b)
                            const img = String(b.banner_image ?? '')
                            return (
                              <tr key={bid || `${title}-${idx}`}>
                                <td className="text-muted small">{(currentPage - 1) * pageSize + idx + 1}</td>
                                <td>
                                  {img ? (
                                    <img
                                      src={resolveMediaUrl(img)}
                                      alt={title}
                                      style={{ width: 72, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid #dee2e6' }}
                                    />
                                  ) : (
                                    <span className="fst-italic text-muted opacity-50 small">—</span>
                                  )}
                                </td>
                                <td className="fw-medium">{title || '—'}</td>
                                <td className="text-muted small cat-desc-cell">
                                  {desc || <span className="fst-italic text-muted opacity-50">—</span>}
                                </td>
                                <td className="small">
                                  {orderLink ? (
                                    <a href={orderLink} target="_blank" rel="noopener noreferrer" className="text-truncate d-inline-block" style={{ maxWidth: 180 }}>
                                      {orderLink}
                                    </a>
                                  ) : (
                                    <span className="fst-italic text-muted opacity-50">—</span>
                                  )}
                                </td>
                                <td>
                                  <span className="badge text-bg-light border text-capitalize">
                                    {formatUploadAreaLabel(b.upload_area)}
                                  </span>
                                </td>
                                <td>
                                  <span className={`badge ${st === 1 ? 'text-bg-success' : 'text-bg-secondary'}`}>
                                    {st === 1 ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td className="text-center">
                                  <div className="d-flex justify-content-center gap-2">
                                    <button
                                      type="button"
                                      className="btn btn-sm cat-btn-edit"
                                      title="Edit"
                                      disabled={!bid}
                                      onClick={() => setEditing(b)}
                                    >
                                      <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
                                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm cat-btn-delete"
                                      title="Delete"
                                      disabled={!bid}
                                      onClick={() => setDeleting({ id: bid, title: title || 'Banner' })}
                                    >
                                      <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
                                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3 pt-3 border-top">
                    <p className="text-muted small mb-0">
                      {total === 0
                        ? 'No entries'
                        : `Showing ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, total)} of ${total} entr${total === 1 ? 'y' : 'ies'}`}
                    </p>

                    {totalPages > 1 && (
                      <nav>
                        <ul className="pagination pagination-sm mb-0 cat-pagination">
                          <li className={`page-item${currentPage === 1 ? ' disabled' : ''}`}>
                            <button className="page-link" type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1}>
                              ‹
                            </button>
                          </li>

                          {visiblePages.map((n, i) => {
                            const prev = visiblePages[i - 1]
                            return (
                              <React.Fragment key={n}>
                                {prev !== undefined && n - prev > 1 && (
                                  <li className="page-item disabled">
                                    <span className="page-link">…</span>
                                  </li>
                                )}
                                <li className={`page-item${n === currentPage ? ' active' : ''}`}>
                                  <button className="page-link" type="button" onClick={() => setPage(n)}>{n}</button>
                                </li>
                              </React.Fragment>
                            )
                          })}

                          <li className={`page-item${currentPage === totalPages ? ' disabled' : ''}`}>
                            <button className="page-link" type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage === totalPages}>
                              ›
                            </button>
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

      {deleting && (
        <DeleteConfirmModal
          title="Delete Banner"
          itemName={deleting.title}
          apiPath={`/api/banners/${deleting.id}`}
          onClose={() => setDeleting(null)}
          onSuccess={fetchBanners}
        />
      )}

      {showAddModal && (
        <AddBannerModal onClose={() => setShowAddModal(false)} onSuccess={fetchBanners} />
      )}

      {editing && bannerRowId(editing) && (
        <EditBannerModal
          bannerId={bannerRowId(editing)}
          initialTitle={String(editing.title ?? '')}
          initialDescription={String(editing.description ?? '')}
          initialOrderUrl={String(editing.order_url ?? editing.orderUrl ?? '')}
          initialStatus={bannerStatus(editing)}
          initialUploadArea={String(editing.upload_area ?? 'website')}
          initialBannerImage={String(editing.banner_image ?? '')}
          onClose={() => setEditing(null)}
          onSuccess={fetchBanners}
        />
      )}
    </>
  )
}

export default BannerPage
