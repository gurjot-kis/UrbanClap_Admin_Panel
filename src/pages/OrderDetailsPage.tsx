import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { clearAuthSession, getStoredToken, getStoredUser } from '../utils/auth'
import { resolveMediaUrl } from '../config/api'
import Sidebar from '../components/Sidebar'
import '../styles/Dashboard.css'

interface OrderItem {
  product_id?: string
  name?: string
  slug?: string
  mainImage?: string
  currency?: string
  price?: number
  sellingPrice?: number
  quantity?: number
  itemTotal?: number
}

interface ShippingAddress {
  fullName?: string
  phone?: string
  addressLine1?: string
  addressLine2?: string
  landmark?: string
  city?: string
  state?: string
  country?: string
  pincode?: string
}

interface OrderDetails {
  order_id?: string
  user_id?: string
  user_name?: string
  items?: OrderItem[]
  shippingAddress?: ShippingAddress
  totalItems?: number
  grandTotal?: number
  paymentMethod?: string
  paymentReceived?: number | boolean
  status?: string
  createdAt?: string
  updatedAt?: string
}

const STATUS_OPTIONS = ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled']
const formatOrderPlaced = (value?: string): string => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  const day = date.getDate()
  const suffix = (n: number): string => {
    if (n >= 11 && n <= 13) return 'th'
    const last = n % 10
    if (last === 1) return 'st'
    if (last === 2) return 'nd'
    if (last === 3) return 'rd'
    return 'th'
  }
  const month = date.toLocaleString('en-US', { month: 'long' })
  const year = date.getFullYear()
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
  return `${day}${suffix(day)} ${month} ${year} ${time}`
}

function OrderDetailsPage() {
  const navigate = useNavigate()
  const { orderId } = useParams<{ orderId: string }>()
  const token = getStoredToken()
  const user = getStoredUser()

  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusDraft, setStatusDraft] = useState('placed')
  const [paymentReceivedDraft, setPaymentReceivedDraft] = useState(0)
  const [updating, setUpdating] = useState(false)

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const json = await res.json()
      const data: OrderDetails = json?.data ?? json
      setOrder(data)
      setStatusDraft(String(data.status ?? 'placed'))
      setPaymentReceivedDraft(Number(data.paymentReceived ?? 0))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order details')
    } finally {
      setLoading(false)
    }
  }, [orderId, token])

  useEffect(() => {
    fetchOrderDetails()
  }, [fetchOrderDetails])

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  const handleUpdateStatus = async () => {
    if (!orderId) return
    setUpdating(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: statusDraft,
          paymentReceived: paymentReceivedDraft,
        }),
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      await fetchOrderDetails()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="d-flex min-vh-100" style={{ background: '#eef1f6' }}>
      <Sidebar />
      <div className="d-flex flex-column flex-grow-1 min-w-0">
        <header className="d-flex align-items-center justify-content-between px-4 py-3 bg-white shadow-sm">
          <div className="d-flex align-items-center gap-2">
            <button type="button" className="subcat-back-btn" onClick={() => navigate('/orders')} title="Back to Orders">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
              </svg>
            </button>
            <div>
              <h6 className="mb-0 fw-semibold text-dark">Order Details</h6>
              <small className="text-muted">{orderId}</small>
            </div>
          </div>
          <button type="button" className="btn btn-danger btn-sm px-3 fw-semibold" onClick={handleLogout}>
            Logout
          </button>
        </header>

        <div className="p-4 d-flex flex-column gap-3">
          {loading ? (
            <div className="card border-0 rounded-3 shadow-sm">
              <div className="card-body p-4 d-flex flex-column align-items-center justify-content-center py-5 gap-3">
                <div className="spinner-border text-primary" style={{ width: '2rem', height: '2rem' }} role="status" />
                <span className="text-muted small">Loading order details...</span>
              </div>
            </div>
          ) : error ? (
            <div className="card border-0 rounded-3 shadow-sm">
              <div className="card-body p-4">
                <p className="text-danger small mb-3">{error}</p>
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={fetchOrderDetails}>
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="card border-0 rounded-3 shadow-sm">
                <div className="card-body p-4">
                  <h6 className="fw-semibold mb-3">Summary</h6>
                  <div className="row g-3 small">
                    <div className="col-md-6">Order ID: <span className="fw-semibold">{order?.order_id ?? '-'}</span></div>
                    <div className="col-md-6">User Name: <span className="fw-semibold">{order?.user_name ?? '-'}</span></div>
                    <div className="col-md-6">Total Items: <span className="fw-semibold">{String(order?.totalItems ?? '-')}</span></div>
                    <div className="col-md-6">Grand Total: <span className="fw-semibold">{String(order?.grandTotal ?? '-')}</span></div>
                    <div className="col-md-6">Payment Method: <span className="fw-semibold">{order?.paymentMethod ?? '-'}</span></div>
                    <div className="col-md-6">Order Placed: <span className="fw-semibold">{formatOrderPlaced(order?.createdAt)}</span></div>
                  </div>
                </div>
              </div>

              <div className="card border-0 rounded-3 shadow-sm">
                <div className="card-body p-4">
                  <h6 className="fw-semibold mb-3">Shipping Address</h6>
                  <div className="small text-muted lh-lg">
                    <div><span className="text-dark fw-semibold">{order?.shippingAddress?.fullName ?? '-'}</span></div>
                    <div>Phone: <span className="text-dark fw-semibold">{order?.shippingAddress?.phone ?? '-'}</span></div>
                    <div>{order?.shippingAddress?.addressLine1 ?? '-'}</div>
                    {order?.shippingAddress?.addressLine2 && <div>{order.shippingAddress.addressLine2}</div>}
                    {order?.shippingAddress?.landmark && <div>Landmark: {order.shippingAddress.landmark}</div>}
                    <div>
                      {order?.shippingAddress?.city ?? '-'}, {order?.shippingAddress?.state ?? '-'} {order?.shippingAddress?.pincode ?? '-'}
                    </div>
                    <div>{order?.shippingAddress?.country ?? '-'}</div>
                  </div>
                </div>
              </div>

              <div className="card border-0 rounded-3 shadow-sm">
                <div className="card-body p-4">
                  <h6 className="fw-semibold mb-3">Order Items</h6>
                  <div className="table-responsive">
                    <table className="table cat-table align-middle mb-0">
                      <thead>
                        <tr>
                          <th style={{ width: 60 }}>#</th>
                          <th style={{ width: 80 }}>Image</th>
                          <th>Name</th>
                          <th>Slug</th>
                          <th>Price</th>
                          <th>Selling Price</th>
                          <th>Qty</th>
                          <th>Item Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(order?.items ?? []).length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center text-muted py-4">No items found</td>
                          </tr>
                        ) : (
                          (order?.items ?? []).map((item, idx) => (
                            <tr key={item.product_id ?? `${item.slug}-${idx}`}>
                              <td className="text-muted small">{idx + 1}</td>
                              <td>
                                {item.mainImage ? (
                                  <img
                                    src={resolveMediaUrl(item.mainImage)}
                                    alt={item.name ?? `item-${idx + 1}`}
                                    style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid #dee2e6' }}
                                  />
                                ) : (
                                  <span className="text-muted small">-</span>
                                )}
                              </td>
                              <td className="fw-medium">{item.name ?? '-'}</td>
                              <td className="text-muted small">{item.slug ?? '-'}</td>
                              <td className="text-muted small">{`${item.currency ?? ''}${item.price ?? '-'}`}</td>
                              <td className="text-muted small">{`${item.currency ?? ''}${item.sellingPrice ?? '-'}`}</td>
                              <td className="text-muted small">{String(item.quantity ?? '-')}</td>
                              <td className="text-muted small">{`${item.currency ?? ''}${item.itemTotal ?? '-'}`}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="card border-0 rounded-3 shadow-sm">
                <div className="card-body p-4">
                  <h6 className="fw-semibold mb-3">Update Status</h6>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-dark mb-1">Status</label>
                      <select
                        className="form-select edit-modal-input"
                        value={statusDraft}
                        onChange={(e) => setStatusDraft(e.target.value)}
                        disabled={updating}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 d-flex align-items-end">
                      <div className="form-check mb-2">
                        <input
                          id="paymentReceivedOrderDetailsCheckbox"
                          className="form-check-input"
                          type="checkbox"
                          checked={Boolean(paymentReceivedDraft)}
                          onChange={(e) => setPaymentReceivedDraft(e.target.checked ? 1 : 0)}
                          disabled={updating}
                        />
                        <label htmlFor="paymentReceivedOrderDetailsCheckbox" className="form-check-label small text-dark">
                          Payment Received
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end mt-3">
                    <button type="button" className="btn btn-sm edit-modal-save-btn px-3" onClick={handleUpdateStatus} disabled={updating}>
                      {updating ? 'Updating...' : 'Update Status'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrderDetailsPage
