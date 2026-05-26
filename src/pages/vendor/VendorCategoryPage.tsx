import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import VendorLayout from '../../components/vendor/VendorLayout'
import VendorListToolbar from '../../components/vendor/VendorListToolbar'
import VendorPagination from '../../components/vendor/VendorPagination'
import { resolveMediaUrl } from '../../config/api'
import { ROUTES, VENDOR_ROUTES } from '../../routes'
import { getStoredToken, getStoredUser } from '../../utils/auth'
import '../../styles/Dashboard.css'

interface Category {
  id?: string
  category_id?: string
  name: string
  description?: string
  category_image?: string
  [key: string]: unknown
}

const PAGE_SIZE_OPTIONS = [10, 25, 50]

function VendorCategoryPage() {
  const navigate = useNavigate()
  const token = getStoredToken()
  const user = getStoredUser()

  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
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

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      })
      if (debouncedSearch.trim()) params.set('name', debouncedSearch.trim())

      const res = await fetch(`/api/categories?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const json = await res.json()

      const items: Category[] = Array.isArray(json) ? json : (json.data ?? [])
      const serverTotal: number =
        json.total ?? json.meta?.total ?? json.pagination?.total ?? items.length

      setCategories(items)
      setTotal(serverTotal)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, debouncedSearch, token])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const currentPage = Math.min(page, Math.max(1, Math.ceil(total / pageSize)))

  return (
    <VendorLayout title="Categories">
      <div className="card border-0 rounded-3 shadow-sm">
        <div className="card-body p-4">
          <VendorListToolbar
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            search={search}
            onPageSizeChange={handlePageSize}
            onSearchChange={handleSearch}
          />

          {loading ? (
            <div className="cat-state d-flex flex-column align-items-center justify-content-center py-5 gap-3">
              <div className="spinner-border text-primary" style={{ width: '2rem', height: '2rem' }} role="status">
                <span className="visually-hidden">Loading…</span>
              </div>
              <span className="text-muted small">Loading categories…</span>
            </div>
          ) : error ? (
            <div className="cat-state d-flex flex-column align-items-center justify-content-center py-5 gap-3">
              <p className="text-danger mb-0 small">{error}</p>
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={fetchCategories}>
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
                      <th style={{ width: 140 }} className="text-center">Sub-Categories</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-5">
                          No categories found
                          {debouncedSearch && (
                            <span>
                              {' '}
                              for "<strong>{debouncedSearch}</strong>"
                            </span>
                          )}
                        </td>
                      </tr>
                    ) : (
                      categories.map((cat, idx) => {
                        const categoryId = String(cat.category_id ?? cat.id ?? '')
                        return (
                          <tr key={categoryId || `${cat.name}-${idx}`}>
                            <td className="text-muted small">{(currentPage - 1) * pageSize + idx + 1}</td>
                            <td>
                              {cat.category_image ? (
                                <img
                                  src={resolveMediaUrl(String(cat.category_image))}
                                  alt={cat.name}
                                  style={{
                                    width: 44,
                                    height: 44,
                                    objectFit: 'cover',
                                    borderRadius: 6,
                                    border: '1px solid #dee2e6',
                                  }}
                                />
                              ) : (
                                <span className="fst-italic text-muted opacity-50 small">—</span>
                              )}
                            </td>
                            <td className="fw-medium">{cat.name}</td>
                            <td className="text-muted small cat-desc-cell">
                              {(cat.description as string) || (
                                <span className="fst-italic text-muted opacity-50">—</span>
                              )}
                            </td>
                            <td className="text-center">
                              {categoryId ? (
                                <button
                                  type="button"
                                  className="btn btn-sm cat-btn-view"
                                  title="View Sub-Categories"
                                  onClick={() =>
                                    navigate(VENDOR_ROUTES.subCategories(categoryId), {
                                      state: { categoryName: cat.name },
                                    })
                                  }
                                >
                                  <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
                                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                                  </svg>
                                  <span className="ms-1">View</span>
                                </button>
                              ) : (
                                <span className="text-muted small">—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <VendorPagination total={total} page={page} pageSize={pageSize} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>
    </VendorLayout>
  )
}

export default VendorCategoryPage
