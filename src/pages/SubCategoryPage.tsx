import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Navigate, useNavigate, useParams, useLocation } from 'react-router-dom'
import { getStoredToken, getStoredUser } from '../utils/auth'
import EditModal from '../components/EditModal'
import AddSubCategoryModal from '../components/AddSubCategoryModal'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import { resolveMediaUrl } from '../config/api'
import { ROUTES } from '../routes'
import '../styles/Dashboard.css'
import { useHeader } from '../layout/LayoutContext'

interface SubCategory {
  sub_category_id?: string
  id?: string
  name: string
  description?: string
  sub_category_image?: string
  [key: string]: unknown
}

const PAGE_SIZE_OPTIONS = [10, 25, 50]

function SubCategoryPage() {
  const navigate = useNavigate()
  const { categoryId } = useParams<{ categoryId: string }>()
  const location = useLocation()
  const categoryName = (location.state as { categoryName?: string } | null)?.categoryName ?? 'Category'
  const { setHeaderConfig } = useHeader()

  useEffect(() => {
    setHeaderConfig({
      title: 'Sub-Categories',
      subtitle: categoryName,
      backTo: ROUTES.categories,
      backTitle: 'Back to Categories'
    })
  }, [categoryName, setHeaderConfig])

  const token = getStoredToken()
  const user = getStoredUser()

  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [editing, setEditing] = useState<{ id: string; name: string; description: string; subCategoryImage: string } | null>(null)
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (!token || !user) {
    return <Navigate to={ROUTES.login} replace />
  }

  // Debounce search — reset to page 1 and fire after 400 ms
  const handleSearch = (val: string) => {
    setSearch(val)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(val)
      setPage(1)
    }, 400)
  }

  const handlePageSize = (val: number) => { setPageSize(val); setPage(1) }

  const fetchSubCategories = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      })
      if (debouncedSearch.trim()) params.set('name', debouncedSearch.trim())

      const res = await fetch(`/api/sub-categories/category/${categoryId}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const json = await res.json()

      const items: SubCategory[] = Array.isArray(json) ? json : (json.data ?? [])
      const serverTotal: number =
        json.total ?? json.meta?.total ?? json.pagination?.total ?? items.length

      setSubCategories(items)
      setTotal(serverTotal)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sub-categories')
    } finally {
      setLoading(false)
    }
  }, [categoryId, page, pageSize, debouncedSearch, token])

  useEffect(() => {
    fetchSubCategories()
  }, [fetchSubCategories])



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

              {/* ── Toolbar ── */}
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
                    Add Sub-Category
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
                      placeholder="Search by name…"
                      value={search}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* ── Table ── */}
              {loading ? (
                <div className="cat-state d-flex flex-column align-items-center justify-content-center py-5 gap-3">
                  <div className="spinner-border" style={{ width: '2rem', height: '2rem', color: '#1b3a5c' }} role="status">
                    <span className="visually-hidden">Loading…</span>
                  </div>
                  <span className="text-muted small">Loading sub-categories…</span>
                </div>
              ) : error ? (
                <div className="cat-state d-flex flex-column align-items-center justify-content-center py-5 gap-3">
                  <svg viewBox="0 0 24 24" fill="#dc3545" width="40" height="40">
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
                          <th style={{ width: 90 }}>Image</th>
                          <th>Name</th>
                          <th>Description</th>
                          <th style={{ width: 120 }} className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subCategories.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center text-muted py-5">
                              No sub-categories found
                              {debouncedSearch && <span> for "<strong>{debouncedSearch}</strong>"</span>}
                            </td>
                          </tr>
                        ) : (
                          subCategories.map((sub, idx) => (
                            <tr key={String(sub.sub_category_id ?? sub.id ?? `${sub.name}-${idx}`)}>
                              <td className="text-muted small">{(currentPage - 1) * pageSize + idx + 1}</td>
                              <td>
                                {sub.sub_category_image ? (
                                  <img
                                    src={resolveMediaUrl(String(sub.sub_category_image))}
                                    alt={sub.name}
                                    style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid #dee2e6' }}
                                  />
                                ) : (
                                  <span className="fst-italic text-muted opacity-50 small">—</span>
                                )}
                              </td>
                              <td className="fw-medium">{sub.name}</td>
                              <td className="text-muted small cat-desc-cell">
                                {(sub.description as string) || <span className="fst-italic opacity-50">—</span>}
                              </td>
                              <td className="text-center">
                                <div className="d-flex justify-content-center gap-2">
                                  <button
                                    type="button"
                                    className="btn btn-sm cat-btn-edit"
                                    title="Edit"
                                    onClick={() =>
                                      setEditing({
                                        id: String(sub.sub_category_id ?? sub.id ?? ''),
                                        name: sub.name,
                                        description: (sub.description as string) ?? '',
                                        subCategoryImage: String(sub.sub_category_image ?? ''),
                                      })
                                    }
                                  >
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
                                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm cat-btn-delete"
                                    title="Delete"
                                    onClick={() => setDeleting({ id: sub.sub_category_id || "", name: sub.name })}
                                  >
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
                                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* ── Footer ── */}
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
                            <button className="page-link" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1}>‹</button>
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
                                  <button className="page-link" onClick={() => setPage(n)}>{n}</button>
                                </li>
                              </React.Fragment>
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
      {deleting && (
        <DeleteConfirmModal
          title="Delete Sub-Category"
          itemName={deleting.name}
          apiPath={`/api/sub-categories/${deleting.id}`}
          onClose={() => setDeleting(null)}
          onSuccess={fetchSubCategories}
        />
      )}

      {showAddModal && (
        <AddSubCategoryModal
          categoryId={categoryId!}
          categoryName={categoryName}
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchSubCategories}
        />
      )}

      {editing && (
        <EditModal
          title="Edit Sub-Category"
          subtitle={editing.name}
          initialName={editing.name}
          initialDescription={editing.description}
          initialImageUrl={editing.subCategoryImage}
          imageFieldName="sub_category_image"
          showImageUpload
          apiPath={`/api/sub-categories/${editing.id}`}
          showDescription
          onClose={() => setEditing(null)}
          onSuccess={fetchSubCategories}
        />
      )}
    </>
  )
}

export default SubCategoryPage
