import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { getStoredToken, getStoredUser } from '../../utils/auth'
import VendorLayout from '../../components/vendor/VendorLayout'
import VendorPagination from '../../components/vendor/VendorPagination'
import WarehouseViewModal from '../../components/WarehouseViewModal'
import { ROUTES, VENDOR_ROUTES } from '../../routes'
import '../../styles/Dashboard.css'

interface WarehouseItem {
  warehouse_id?: string
  id?: string
  vendor_id?: string
  name?: string
  code?: string
  city?: string
  state?: string
  status?: number
  is_default?: number | boolean
  [key: string]: unknown
}

const PAGE_SIZE_OPTIONS = [10, 25, 50]
const WAREHOUSES_API = '/api/vendor/warehouses'

const EYE_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
  </svg>
)

const getWarehouseId = (w: WarehouseItem): string => String(w.warehouse_id ?? w.id ?? '')

function warehouseStatus(w: WarehouseItem): 0 | 1 {
  return Number(w.status) === 0 ? 0 : 1
}

function isDefaultWarehouse(w: WarehouseItem): boolean {
  return w.is_default === true || w.is_default === 1
}

function VendorWarehouseListPage() {
  const navigate = useNavigate()
  const token = getStoredToken()
  const user = getStoredUser()

  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | '0' | '1'>('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [viewing, setViewing] = useState<{ id: string; name: string } | null>(null)
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

  const fetchWarehouses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        vendor_id: user.user_id,
        page: String(page),
        limit: String(pageSize),
      })
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim())
      if (statusFilter !== '') params.set('status', statusFilter)

      const res = await fetch(`${WAREHOUSES_API}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const json = await res.json()

      const items: WarehouseItem[] = Array.isArray(json) ? json : (json.data ?? [])
      const serverTotal: number =
        json.total ?? json.meta?.total ?? json.pagination?.total ?? items.length

      setWarehouses(items)
      setTotal(serverTotal)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load warehouses')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, page, pageSize, statusFilter, token, user.user_id])

  useEffect(() => {
    fetchWarehouses()
  }, [fetchWarehouses])

  const currentPage = Math.min(page, Math.max(1, Math.ceil(total / pageSize)))

  return (
    <>
      <VendorLayout title="Warehouses">
        <div className="card border-0 rounded-3 shadow-sm">
          <div className="card-body p-4">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
              <div className="d-flex flex-wrap align-items-center gap-3">
                <div className="d-flex align-items-center gap-2">
                  <label className="text-muted small mb-0">Show</label>
                  <select
                    className="form-select form-select-sm cat-page-select"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setPage(1)
                    }}
                  >
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <span className="text-muted small">entries</span>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <label className="text-muted small mb-0">Status</label>
                  <select
                    className="form-select form-select-sm cat-page-select"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as '' | '0' | '1')
                      setPage(1)
                    }}
                  >
                    <option value="">All</option>
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="d-flex align-items-center gap-3">
                <div className="cat-search-wrap">
                  <span className="cat-search-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
                      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                    </svg>
                  </span>
                  <input
                    type="search"
                    className="form-control form-control-sm cat-search-input"
                    placeholder="Search warehouses..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="cat-state d-flex flex-column align-items-center justify-content-center py-5 gap-3">
                <div className="spinner-border text-primary" style={{ width: '2rem', height: '2rem' }} role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <span className="text-muted small">Loading warehouses...</span>
              </div>
            ) : error ? (
              <div className="cat-state d-flex flex-column align-items-center justify-content-center py-5 gap-3">
                <p className="text-danger mb-0 small">{error}</p>
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={fetchWarehouses}>
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
                        <th>Code</th>
                        <th>City</th>
                        <th>State</th>
                        <th style={{ width: 90 }}>Default</th>
                        <th style={{ width: 100 }}>Status</th>
                        <th style={{ width: 140 }} className="text-center">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {warehouses.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center text-muted py-5">
                            No warehouses found
                            {debouncedSearch && (
                              <span>
                                {' '}
                                for &quot;<strong>{debouncedSearch}</strong>&quot;
                              </span>
                            )}
                          </td>
                        </tr>
                      ) : (
                        warehouses.map((item, idx) => {
                          const warehouseId = getWarehouseId(item)
                          const name = String(item.name ?? '-')
                          const st = warehouseStatus(item)
                          return (
                            <tr key={warehouseId || `${item.code}-${idx}`}>
                              <td className="text-muted small">{(currentPage - 1) * pageSize + idx + 1}</td>
                              <td className="fw-medium">{name}</td>
                              <td className="text-muted small">{String(item.code ?? '-')}</td>
                              <td className="text-muted small">{String(item.city ?? '-')}</td>
                              <td className="text-muted small">{String(item.state ?? '-')}</td>
                              <td>
                                {isDefaultWarehouse(item) ? (
                                  <span className="badge text-bg-primary">Default</span>
                                ) : (
                                  <span className="text-muted small">—</span>
                                )}
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
                                    className="btn btn-sm cat-btn-view"
                                    title="View Details"
                                    disabled={!warehouseId}
                                    onClick={() => setViewing({ id: warehouseId, name })}
                                  >
                                    {EYE_ICON}
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

                <VendorPagination total={total} page={page} pageSize={pageSize} onPageChange={setPage} />
              </>
            )}
          </div>
        </div>
      </VendorLayout>

      {viewing && (
        <WarehouseViewModal
          warehouseId={viewing.id}
          warehouseName={viewing.name}
          onClose={() => setViewing(null)}
        />
      )}
    </>
  )
}

export default VendorWarehouseListPage
