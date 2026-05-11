import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { clearAuthSession, getStoredToken, getStoredUser } from '../utils/auth'
import Sidebar from '../components/Sidebar'
import '../styles/Dashboard.css'

interface Order {
  id?: string
  order_id?: string
  user_name?: string
  grandTotal?: number | string
  status?: string
  paymentReceived?: number | boolean
  createdAt?: string
  user?: { name?: string }
  shippingAddress?: { city?: string; state?: string }
  [key: string]: unknown
}

const PAGE_SIZE_OPTIONS = [10, 25, 50]
const getOrderId = (order: Order): string => String(order.order_id ?? order.id ?? '')
const getUserName = (order: Order): string =>
  String(order.user_name ?? order.user?.name ?? '').trim() || '-'
const getCity = (order: Order): string =>
  String(order.shippingAddress?.city ?? '').trim() || '-'
const getState = (order: Order): string =>
  String(order.shippingAddress?.state ?? '').trim() || '-'

function OrdersPage() {
  const navigate = useNavigate()
  const token = getStoredToken()
  const user = getStoredUser()

  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  const handleSearch = (val: string) => {
    setSearch(val)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(val)
      setPage(1)
    }, 400)
  }

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      })
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim())

      const res = await fetch(`/api/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const json = await res.json()

      const items: Order[] = Array.isArray(json) ? json : (json.data ?? [])
      const serverTotal: number =
        json.total ?? json.meta?.total ?? json.pagination?.total ?? items.length

      setOrders(items)
      setTotal(serverTotal)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, page, pageSize, token])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
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
          <h6 className="mb-0 fw-semibold text-dark">Orders</h6>
          <button type="button" className="btn btn-danger btn-sm px-3 fw-semibold" onClick={handleLogout}>
            Logout
          </button>
        </header>

        <div className="p-4 d-flex flex-column gap-3 flex-grow-1">
          <div className="card border-0 rounded-3 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
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

                <div className="cat-search-wrap">
                  <span className="cat-search-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
                      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                    </svg>
                  </span>
                  <input
                    type="search"
                    className="form-control form-control-sm cat-search-input"
                    placeholder="Search orders..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
              </div>

              {loading ? (
                <div className="cat-state d-flex flex-column align-items-center justify-content-center py-5 gap-3">
                  <div className="spinner-border text-primary" style={{ width: '2rem', height: '2rem' }} role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <span className="text-muted small">Loading orders...</span>
                </div>
              ) : error ? (
                <div className="cat-state d-flex flex-column align-items-center justify-content-center py-5 gap-3">
                  <p className="text-danger mb-0 small">{error}</p>
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={fetchOrders}>
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
                          <th>Order ID</th>
                          <th>User</th>
                          <th>City</th>
                          <th>State</th>
                          <th>Grand Total</th>
                          <th>Status</th>
                          <th>Payment</th>
                          <th style={{ width: 110 }} className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="text-center text-muted py-5">
                              No orders found
                            </td>
                          </tr>
                        ) : (
                          orders.map((order, idx) => {
                            const orderId = getOrderId(order)
                            return (
                              <tr key={orderId || `${getUserName(order)}-${idx}`}>
                                <td className="text-muted small">{(currentPage - 1) * pageSize + idx + 1}</td>
                                <td className="text-muted small">{orderId || '-'}</td>
                                <td className="fw-medium">{getUserName(order)}</td>
                                <td className="text-muted small">{getCity(order)}</td>
                                <td className="text-muted small">{getState(order)}</td>
                                <td className="text-muted small">{String(order.grandTotal ?? '-')}</td>
                                <td>
                                  <span className="badge text-bg-light border text-capitalize">{String(order.status ?? '-')}</span>
                                </td>
                                <td className="text-muted small">{Number(order.paymentReceived ?? 0) ? 'Received' : 'Pending'}</td>
                                <td className="text-center">
                                  <button
                                    type="button"
                                    className="btn btn-sm cat-btn-view"
                                    title="View Order"
                                    disabled={!orderId}
                                    onClick={() => {
                                      if (orderId) navigate(`/orders/${orderId}`)
                                    }}
                                  >
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
                                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                                    </svg>
                                  </button>
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
                            <button className="page-link" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1}>‹</button>
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
      </div>
    </div>
  )
}

export default OrdersPage
