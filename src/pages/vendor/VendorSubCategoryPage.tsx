import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import VendorLayout from '../../components/vendor/VendorLayout'
import VendorListToolbar from '../../components/vendor/VendorListToolbar'
import VendorPagination from '../../components/vendor/VendorPagination'
import { resolveMediaUrl } from '../../config/api'
import { ROUTES, VENDOR_ROUTES } from '../../routes'
import { getStoredToken, getStoredUser } from '../../utils/auth'
import '../../styles/Dashboard.css'

interface SubCategory {
  sub_category_id?: string
  id?: string
  name: string
  description?: string
  sub_category_image?: string
  [key: string]: unknown
}

const PAGE_SIZE_OPTIONS = [10, 25, 50]

function VendorSubCategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const location = useLocation()
  const categoryName =
    (location.state as { categoryName?: string } | null)?.categoryName ?? 'Category'

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
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (!token || !user) {
    return <Navigate to={ROUTES.login} replace />
  }

  if (!categoryId) {
    return <Navigate to={VENDOR_ROUTES.categories} replace />
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

  const currentPage = Math.min(page, Math.max(1, Math.ceil(total / pageSize)))

  return (
    <VendorLayout
      title="Sub-Categories"
      subtitle={categoryName}
      backTo={VENDOR_ROUTES.categories}
      backTitle="Back to Categories"
    >
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
              <div className="spinner-border" style={{ width: '2rem', height: '2rem', color: '#1b3a5c' }} role="status">
                <span className="visually-hidden">Loading…</span>
              </div>
              <span className="text-muted small">Loading sub-categories…</span>
            </div>
          ) : error ? (
            <div className="cat-state d-flex flex-column align-items-center justify-content-center py-5 gap-3">
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
                    </tr>
                  </thead>
                  <tbody>
                    {subCategories.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center text-muted py-5">
                          No sub-categories found
                          {debouncedSearch && (
                            <span>
                              {' '}
                              for "<strong>{debouncedSearch}</strong>"
                            </span>
                          )}
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
                          <td className="fw-medium">{sub.name}</td>
                          <td className="text-muted small cat-desc-cell">
                            {(sub.description as string) || (
                              <span className="fst-italic opacity-50">—</span>
                            )}
                          </td>
                        </tr>
                      ))
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

export default VendorSubCategoryPage
