import React, { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { getStoredToken, getStoredUser } from '../utils/auth'
import AddCartSettingsModal from '../components/AddCartSettingsModal'
import EditCartSettingsModal from '../components/EditCartSettingsModal'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import { ROUTES } from '../routes'
import '../styles/Dashboard.css'
import { useHeader } from '../layout/LayoutContext'

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
  if (!Number.isFinite(n)) return '—'
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

function CartSettingsPage() {
  const { setHeaderConfig } = useHeader()

  useEffect(() => {
    setHeaderConfig({ title: 'Cart Settings' })
  }, [setHeaderConfig])

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

  const handlePageSize = (val: number) => {
    setPageSize(val)
    setPage(1)
  }

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(pageSize) })
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
  }, [page, pageSize, token])

  useEffect(() => { fetchItems() }, [fetchItems])



  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
  const visiblePages = pageNumbers.filter((n) => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1)

  return (
    <>
      <div className="p-4 d-flex flex-column gap-3 flex-grow-1">
          <div className="card border-0 rounded-3 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                <div className="d-flex align-items-center gap-2">
                  <label className="text-muted small mb-0">Show</label>
                  <select className="form-select form-select-sm cat-page-select" value={pageSize} onChange={(e) => handlePageSize(Number(e.target.value))}>
                    {PAGE_SIZE_OPTIONS.map((n) => (<option key={n} value={n}>{n}</option>))}
                  </select>
                  <span className="text-muted small">entries</span>
                </div>
                {total === 0 && (
                  <button type="button" className="btn btn-sm cat-btn-add" onClick={() => setShowAddModal(true)}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" className="me-1"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                    Add Cart Settings
                  </button>
                )}
              </div>
              {loading ? (
                <div className="cat-state d-flex flex-column align-items-center justify-content-center py-5 gap-3">
                  <div className="spinner-border text-primary" style={{ width: '2rem', height: '2rem' }} role="status"><span className="visually-hidden">Loading…</span></div>
                  <span className="text-muted small">Loading cart settings…</span>
                </div>
              ) : error ? (
                <div className="cat-state d-flex flex-column align-items-center justify-content-center py-5 gap-3">
                  <p className="text-danger mb-0 small">{error}</p>
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={fetchItems}>Retry</button>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="table cat-table align-middle mb-0">
                      <thead><tr>
                        <th style={{ width: 60 }}>#</th>
                        <th>Handling</th><th>Delivery</th><th>Free delivery min</th>
                        <th>Small cart charge</th><th>Small cart max</th>
                        <th style={{ width: 120 }} className="text-center">Actions</th>
                      </tr></thead>
                      <tbody>
                        {items.length === 0 ? (
                          <tr><td colSpan={7} className="text-center text-muted py-5">No cart settings found</td></tr>
                        ) : items.map((row, idx) => {
                          const rowId = cartSettingsRowId(row)
                          return (
                            <tr key={rowId || `row-${idx}`}>
                              <td className="text-muted small">{(currentPage - 1) * pageSize + idx + 1}</td>
                              <td>{formatAmount(row.handling_charge)}</td>
                              <td>{formatAmount(row.delivery_charge)}</td>
                              <td>{formatAmount(row.free_delivery_min_amount)}</td>
                              <td>{formatAmount(row.small_cart_charge)}</td>
                              <td>{formatAmount(row.small_cart_max_amount)}</td>
                              <td className="text-center">
                                <div className="d-flex justify-content-center gap-2">
                                  <button type="button" className="btn btn-sm cat-btn-edit" title="Edit" disabled={!rowId} onClick={() => setEditing(row)}>
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>
                                  </button>
                                  <button type="button" className="btn btn-sm cat-btn-delete" title="Delete" disabled={!rowId} onClick={() => setDeleting({ id: rowId, label: cartSettingsLabel(row) })}>
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3 pt-3 border-top">
                    <p className="text-muted small mb-0">
                      {total === 0 ? 'No entries' : `Showing ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, total)} of ${total} entr${total === 1 ? 'y' : 'ies'}`}
                    </p>
                    {totalPages > 1 && (
                      <nav><ul className="pagination pagination-sm mb-0 cat-pagination">
                        <li className={`page-item${currentPage === 1 ? ' disabled' : ''}`}>
                          <button className="page-link" type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1}>‹</button>
                        </li>
                        {visiblePages.map((n, i) => {
                          const prev = visiblePages[i - 1]
                          return (
                            <React.Fragment key={n}>
                              {prev !== undefined && n - prev > 1 && (<li className="page-item disabled"><span className="page-link">…</span></li>)}
                              <li className={`page-item${n === currentPage ? ' active' : ''}`}>
                                <button className="page-link" type="button" onClick={() => setPage(n)}>{n}</button>
                              </li>
                            </React.Fragment>
                          )
                        })}
                        <li className={`page-item${currentPage === totalPages ? ' disabled' : ''}`}>
                          <button className="page-link" type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage === totalPages}>›</button>
                        </li>
                      </ul></nav>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      {deleting && (
        <DeleteConfirmModal title="Delete Cart Settings" itemName={deleting.label} apiPath={`/api/admin/cart-settings/${deleting.id}`} onClose={() => setDeleting(null)} onSuccess={fetchItems} />
      )}
      {showAddModal && (<AddCartSettingsModal onClose={() => setShowAddModal(false)} onSuccess={fetchItems} />)}
      {editing && cartSettingsRowId(editing) && (
        <EditCartSettingsModal cartSettingsId={cartSettingsRowId(editing)} initialValues={rowFormValues(editing)} onClose={() => setEditing(null)} onSuccess={fetchItems} />
      )}
    </>
  )
}

export default CartSettingsPage
