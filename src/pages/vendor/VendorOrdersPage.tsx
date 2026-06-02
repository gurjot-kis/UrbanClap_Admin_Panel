import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import VendorLayout from '../../components/vendor/VendorLayout'
import VendorListToolbar from '../../components/vendor/VendorListToolbar'
import VendorPagination from '../../components/vendor/VendorPagination'
import { ROUTES } from '../../routes'
import { getStoredToken, getStoredUser } from '../../utils/auth'
import { ROLES } from '../../utils/roles'

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
const getUserName = (order: Order): string => String(order.user_name ?? order.user?.name ?? '').trim() || '-'
const getCity = (order: Order): string => String(order.shippingAddress?.city ?? '').trim() || '-'
const getState = (order: Order): string => String(order.shippingAddress?.state ?? '').trim() || '-'

function VendorOrdersPage() {
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

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        user_id: user.user_id,
        role: user.role === ROLES.VENDOR ? ROLES.VENDOR : String(user.role || ''),
      })
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim())

      const res = await fetch(`/api/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const json = await res.json()

      const items: Order[] = Array.isArray(json) ? json : (json.data ?? [])
      const serverTotal: number = json.total ?? json.meta?.total ?? json.pagination?.total ?? items.length

      setOrders(items)
      setTotal(serverTotal)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, page, pageSize, token, user.role, user.user_id])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const currentPage = Math.min(page, Math.max(1, Math.ceil(total / pageSize)))

  return (
    <VendorLayout title="Orders" subtitle="List of your orders with search and pagination.">
      <div className="card border-0 rounded-3 shadow-sm">
        <div className="card-body p-4">
          <VendorListToolbar
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            search={search}
            searchPlaceholder="Search orders..."
            onPageSizeChange={(val) => {
              setPageSize(val)
              setPage(1)
            }}
            onSearchChange={handleSearch}
          />
          {loading ? (
            <div className="cat-state d-flex flex-column align-items-center justify-content-center py-5 gap-3">
              <div className="spinner-border text-primary" style={{ width: '2rem', height: '2rem' }} role="status" />
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
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center text-muted py-5">
                          No orders found
                        </td>
                      </tr>
                    ) : (
                      orders.map((order, idx) => (
                        <tr key={getOrderId(order) || `${getUserName(order)}-${idx}`}>
                          <td className="text-muted small">{(currentPage - 1) * pageSize + idx + 1}</td>
                          <td className="text-muted small">{getOrderId(order) || '-'}</td>
                          <td className="fw-medium">{getUserName(order)}</td>
                          <td className="text-muted small">{getCity(order)}</td>
                          <td className="text-muted small">{getState(order)}</td>
                          <td className="text-muted small">{String(order.grandTotal ?? '-')}</td>
                          <td>
                            <span className="badge text-bg-light border text-capitalize">
                              {String(order.status ?? '-')}
                            </span>
                          </td>
                          <td className="text-muted small">
                            {Number(order.paymentReceived ?? 0) ? 'Received' : 'Pending'}
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

export default VendorOrdersPage
