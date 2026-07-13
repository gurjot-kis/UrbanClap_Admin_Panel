import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import AddCartSettingsModal from '../../components/AddCartSettingsModal'
import DeleteConfirmModal from '../../components/DeleteConfirmModal'
import EditCartSettingsModal from '../../components/EditCartSettingsModal'
import VendorLayout from '../../components/vendor/VendorLayout'
import VendorPagination from '../../components/vendor/VendorPagination'
import { ROUTES } from '../../routes'
import { getStoredToken, getStoredUser } from '../../utils/auth'
import { ROLES } from '../../utils/roles'

interface CartSettings {
  cart_settings_id?: string
  id?: string
  handling_charge?: number
  delivery_charge?: number
  free_delivery_min_amount?: number
  small_cart_charge?: number
  small_cart_max_amount?: number
  [key: string]: unknown
}

const PAGE_SIZE_OPTIONS = [10, 25, 50]

function cartSettingsRowId(item: CartSettings): string {
  return String(item.cart_settings_id ?? item.id ?? '')
}

function cartSettingsLabel(item: CartSettings): string {
  const id = cartSettingsRowId(item)
  return id ? `Cart settings #${id}` : 'Cart settings'
}

function formatAmount(value: unknown): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return '-'
  return n.toLocaleString('en-IN')
}

function rowFormValues(item: CartSettings) {
  return {
    handling_charge: Number(item.handling_charge ?? 0),
    delivery_charge: Number(item.delivery_charge ?? 0),
    free_delivery_min_amount: Number(item.free_delivery_min_amount ?? 0),
    small_cart_charge: Number(item.small_cart_charge ?? 0),
    small_cart_max_amount: Number(item.small_cart_max_amount ?? 0),
  }
}

function VendorCartSettingsPage() {
  const token = getStoredToken()
  const user = getStoredUser()

  const [items, setItems] = useState<CartSettings[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editing, setEditing] = useState<CartSettings | null>(null)
  const [deleting, setDeleting] = useState<{ id: string; label: string } | null>(null)

  if (!token || !user) {
    return <Navigate to={ROUTES.login} replace />
  }

  const role = user.role === ROLES.VENDOR ? ROLES.VENDOR : String(user.role || '')
  const ownershipQuery = new URLSearchParams({ user_id: user.user_id, role }).toString()

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        user_id: user.user_id,
        role,
      })
      const res = await fetch(`/api/admin/cart-settings?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const json = await res.json()
      const list: CartSettings[] = Array.isArray(json) ? json : (json.data ?? [])
      const serverTotal: number = json.total ?? json.meta?.total ?? json.pagination?.total ?? list.length
      setItems(list)
      setTotal(serverTotal)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cart settings')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, token, user.user_id, role])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  return (
    <VendorLayout title="Cart Settings" subtitle="Manage cart charge rules for your vendor account.">
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
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="text-muted small">entries</span>
            </div>
            {total === 0 && (
              <button type="button" className="btn btn-sm cat-btn-add" onClick={() => setShowAddModal(true)}>
                Add Cart Settings
              </button>
            )}
          </div>

          {loading ? (
            <div className="cat-state d-flex flex-column align-items-center justify-content-center py-5 gap-3">
              <div className="spinner-border text-primary" style={{ width: '2rem', height: '2rem' }} role="status" />
              <span className="text-muted small">Loading cart settings...</span>
            </div>
          ) : error ? (
            <div className="cat-state d-flex flex-column align-items-center justify-content-center py-5 gap-3">
              <p className="text-danger mb-0 small">{error}</p>
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={fetchItems}>
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
                      <th>Handling</th>
                      <th>Delivery</th>
                      <th>Free delivery min</th>
                      <th>Small cart charge</th>
                      <th>Small cart max</th>
                      <th style={{ width: 120 }} className="text-center">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center text-muted py-5">
                          No cart settings found
                        </td>
                      </tr>
                    ) : (
                      items.map((row, idx) => {
                        const rowId = cartSettingsRowId(row)
                        return (
                          <tr key={rowId || `row-${idx}`}>
                            <td className="text-muted small">{(page - 1) * pageSize + idx + 1}</td>
                            <td>{formatAmount(row.handling_charge)}</td>
                            <td>{formatAmount(row.delivery_charge)}</td>
                            <td>{formatAmount(row.free_delivery_min_amount)}</td>
                            <td>{formatAmount(row.small_cart_charge)}</td>
                            <td>{formatAmount(row.small_cart_max_amount)}</td>
                            <td className="text-center">
                              <div className="d-flex justify-content-center gap-2">
                                <button
                                  type="button"
                                  className="btn btn-sm cat-btn-edit"
                                  title="Edit"
                                  disabled={!rowId}
                                  onClick={() => setEditing(row)}
                                >
                                  <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
                                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm cat-btn-delete"
                                  title="Delete"
                                  disabled={!rowId}
                                  onClick={() => setDeleting({ id: rowId, label: cartSettingsLabel(row) })}
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

              <VendorPagination total={total} page={page} pageSize={pageSize} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>

      {deleting && (
        <DeleteConfirmModal
          title="Delete Cart Settings"
          itemName={deleting.label}
          apiPath={`/api/admin/cart-settings/${deleting.id}?${ownershipQuery}`}
          onClose={() => setDeleting(null)}
          onSuccess={fetchItems}
        />
      )}
      {showAddModal && (
        <AddCartSettingsModal
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchItems}
          apiPath="/api/admin/cart-settings"
          extraPayload={{ user_id: user.user_id, role }}
        />
      )}
      {editing && cartSettingsRowId(editing) && (
        <EditCartSettingsModal
          cartSettingsId={cartSettingsRowId(editing)}
          initialValues={rowFormValues(editing)}
          onClose={() => setEditing(null)}
          onSuccess={fetchItems}
          apiBasePath="/api/admin/cart-settings"
          queryString={ownershipQuery}
          extraPayload={{ user_id: user.user_id, role }}
        />
      )}
    </VendorLayout>
  )
}

export default VendorCartSettingsPage
