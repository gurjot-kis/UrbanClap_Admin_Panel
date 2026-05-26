import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { clearAuthSession, getStoredToken, getStoredUser } from '../utils/auth'
import Sidebar from '../components/Sidebar'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import { ROUTES } from '../routes'
import '../styles/Dashboard.css'

interface VendorItem {
  vendor_id?: string
  id?: string
  name?: string
  code?: string
  email?: string
  phone?: string
  address?: string
  gst_number?: string
  status?: number
  [key: string]: unknown
}

const PAGE_SIZE_OPTIONS = [10, 25, 50]
const VENDORS_API = '/api/vendor/vendors'

const getVendorId = (vendor: VendorItem): string => String(vendor.vendor_id ?? vendor.id ?? '')

function vendorStatus(vendor: VendorItem): 0 | 1 {
  const s = Number(vendor.status)
  return s === 0 ? 0 : 1
}

function VendorListPage() {
  const navigate = useNavigate()
  const token = getStoredToken()
  const user = getStoredUser()

  const [vendors, setVendors] = useState<VendorItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | '0' | '1'>('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null)
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

  const fetchVendors = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      })
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim())
      if (statusFilter !== '') params.set('status', statusFilter)

      const res = await fetch(`${VENDORS_API}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const json = await res.json()

      const items: VendorItem[] = Array.isArray(json) ? json : (json.data ?? [])
      const serverTotal: number =
        json.total ?? json.meta?.total ?? json.pagination?.total ?? items.length

      setVendors(items)
      setTotal(serverTotal)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vendors')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, page, pageSize, statusFilter, token])

  useEffect(() => {
    fetchVendors()
  }, [fetchVendors])

  const handleLogout = () => {
    clearAuthSession()
    navigate(ROUTES.login, { replace: true })
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
  const visiblePages = pageNumbers.filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1
  )

  return (
    <div className="d-flex min-vh-100" style={{ background: '#eef1f6' }}>
      <Sidebar />

      <div className="d-flex flex-column flex-grow-1 min-w-0">
        <header className="d-flex align-items-center justify-content-between px-4 py-3 bg-white shadow-sm">
          <h6 className="mb-0 fw-semibold text-dark">Vendors</h6>
          <button type="button" className="btn btn-danger btn-sm px-3 fw-semibold" onClick={handleLogout}>
            Logout
          </button>
        </header>

        <div className="p-4 d-flex flex-column gap-3 flex-grow-1">
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
                        <option key={n} value={n}>{n}</option>
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

                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    className="btn btn-sm cat-btn-add"
                    onClick={() => navigate(ROUTES.vendorsCreate)}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" className="me-1">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                    Add Vendor
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => navigate(ROUTES.vendorsNew)}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" className="me-1">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                    Add Warehouse
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
                      placeholder="Search vendors..."
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
                  <span className="text-muted small">Loading vendors...</span>
                </div>
              ) : error ? (
                <div className="cat-state d-flex flex-column align-items-center justify-content-center py-5 gap-3">
                  <p className="text-danger mb-0 small">{error}</p>
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={fetchVendors}>
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
                          <th>Email</th>
                          <th>Phone</th>
                          <th>GST Number</th>
                          <th>Address</th>
                          <th style={{ width: 100 }}>Status</th>
                          <th style={{ width: 160 }} className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendors.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="text-center text-muted py-5">
                              No vendors found
                              {debouncedSearch && <span> for &quot;<strong>{debouncedSearch}</strong>&quot;</span>}
                            </td>
                          </tr>
                        ) : (
                          vendors.map((item, idx) => {
                            const vendorId = getVendorId(item)
                            const name = String(item.name ?? '-')
                            const st = vendorStatus(item)
                            return (
                              <tr key={vendorId || `${item.email}-${idx}`}>
                                <td className="text-muted small">{(currentPage - 1) * pageSize + idx + 1}</td>
                                <td className="fw-medium">{name}</td>
                                <td className="text-muted small">{String(item.code ?? '-')}</td>
                                <td className="text-muted small">{String(item.email ?? '-')}</td>
                                <td className="text-muted small">{String(item.phone ?? '-')}</td>
                                <td className="text-muted small">{String(item.gst_number ?? '-')}</td>
                                <td className="text-muted small cat-desc-cell">{String(item.address ?? '-')}</td>
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
                                      title="View Warehouses"
                                      disabled={!vendorId}
                                      onClick={() => navigate(ROUTES.vendorWarehouses(vendorId), { state: { vendorName: name } })}
                                    >
                                      <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
                                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm cat-btn-edit"
                                      title="Edit Vendor"
                                      disabled={!vendorId}
                                      onClick={() => navigate(ROUTES.vendorEdit(vendorId))}
                                    >
                                      <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
                                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm cat-btn-delete"
                                      title="Delete Vendor"
                                      disabled={!vendorId}
                                      onClick={() => setDeleting({ id: vendorId, name })}
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
                        : `Showing ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, total)} of ${total} entr${total === 1 ? 'y' : 'ies'}`}
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
                                    <span className="page-link">...</span>
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
      </div>

      {deleting && (
        <DeleteConfirmModal
          title="Delete Vendor"
          itemName={deleting.name}
          apiPath={`${VENDORS_API}/${deleting.id}`}
          onClose={() => setDeleting(null)}
          onSuccess={fetchVendors}
        />
      )}
    </div>
  )
}

export default VendorListPage
