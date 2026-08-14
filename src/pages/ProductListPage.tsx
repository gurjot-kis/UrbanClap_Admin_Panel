import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { getStoredToken, getStoredUser } from '../utils/auth'
import { appendProductListQuery } from '../utils/productForm'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import { ROUTES } from '../routes'
import '../styles/Dashboard.css'
import { useHeader } from '../layout/LayoutContext'

interface Product {
  id?: string
  product_id?: string
  name: string
  description?: string
  price?: number | string
  [key: string]: unknown
}

const PAGE_SIZE_OPTIONS = [10, 25, 50]

const getProductId = (product: Product): string => String(product.product_id ?? product.id ?? '')
const getText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')
const getNestedName = (value: unknown): string => {
  if (!value || typeof value !== 'object') return ''
  const record = value as Record<string, unknown>
  return getText(record.name) || getText(record.title)
}

const getCategoryName = (product: Product): string =>
  getText(product.category_name) ||
  getText(product.categoryName) ||
  getText(product.category) ||
  getNestedName(product.category_data) ||
  getNestedName(product.categoryData) ||
  getNestedName(product.category)

const getSubCategoryName = (product: Product): string =>
  getText(product.sub_category_name) ||
  getText(product.subCategoryName) ||
  getText(product.subcategory_name) ||
  getText(product.subcategory) ||
  getNestedName(product.sub_category) ||
  getNestedName(product.subCategory) ||
  getNestedName(product.subcategory)

function ProductListPage() {
  const navigate = useNavigate()
  const { setHeaderConfig } = useHeader()

  useEffect(() => {
    setHeaderConfig({ title: 'Products' })
  }, [setHeaderConfig])
  const token = getStoredToken()
  const user = getStoredUser()

  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
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

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      })
      if (debouncedSearch.trim()) params.set('name', debouncedSearch.trim())
      appendProductListQuery(params, user)

      const res = await fetch(`/api/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const json = await res.json()

      const items: Product[] = Array.isArray(json) ? json : (json.data ?? [])
      const serverTotal: number =
        json.total ?? json.meta?.total ?? json.pagination?.total ?? items.length

      setProducts(items)
      setTotal(serverTotal)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, page, pageSize, token, user.user_id, user.role])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])



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

                <div className="d-flex align-items-center gap-3">
                  <button
                    type="button"
                    className="btn btn-sm cat-btn-add"
                    onClick={() => navigate(ROUTES.productsNew)}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" className="me-1">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                    Add Product
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
                      placeholder="Search by name..."
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
                  <span className="text-muted small">Loading products...</span>
                </div>
              ) : error ? (
                <div className="cat-state d-flex flex-column align-items-center justify-content-center py-5 gap-3">
                  <p className="text-danger mb-0 small">{error}</p>
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={fetchProducts}>
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
                          <th>Category</th>
                          <th>Sub Category</th>
                          <th>Description</th>
                          <th>Price</th>
                          <th style={{ width: 150 }} className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center text-muted py-5">
                              No products found
                              {debouncedSearch && <span> for "<strong>{debouncedSearch}</strong>"</span>}
                            </td>
                          </tr>
                        ) : (
                          products.map((product, idx) => {
                            const productId = getProductId(product)
                            const categoryName = getCategoryName(product)
                            const subCategoryName = getSubCategoryName(product)
                            return (
                              <tr key={productId || `${product.name}-${idx}`}>
                                <td className="text-muted small">{(currentPage - 1) * pageSize + idx + 1}</td>
                                <td className="fw-medium">{product.name}</td>
                                <td className="text-muted small">{categoryName || <span className="fst-italic opacity-50">-</span>}</td>
                                <td className="text-muted small">{subCategoryName || <span className="fst-italic opacity-50">-</span>}</td>
                                <td className="text-muted small cat-desc-cell">
                                  {(product.description as string) || <span className="fst-italic opacity-50">-</span>}
                                </td>
                                <td className="text-muted small">{String(product.price ?? '-')}</td>
                                <td className="text-center">
                                  <div className="d-flex justify-content-center gap-2">
                                    <button
                                      type="button"
                                      className="btn btn-sm cat-btn-edit"
                                      title="Edit Product"
                                      disabled={!productId}
                                      onClick={() => navigate(ROUTES.productEdit(productId))}
                                    >
                                      <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
                                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm cat-btn-delete"
                                      title="Delete Product"
                                      disabled={!productId}
                                      onClick={() => setDeleting({ id: productId, name: product.name })}
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
                            <button className="page-link" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1}>
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
                                  <button className="page-link" onClick={() => setPage(n)}>{n}</button>
                                </li>
                              </React.Fragment>
                            )
                          })}
                          <li className={`page-item${currentPage === totalPages ? ' disabled' : ''}`}>
                            <button className="page-link" onClick={() => setPage(currentPage + 1)} disabled={currentPage === totalPages}>
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
      {deleting && (
        <DeleteConfirmModal
          title="Delete Product"
          itemName={deleting.name}
          apiPath={`/api/products/${deleting.id}`}
          onClose={() => setDeleting(null)}
          onSuccess={fetchProducts}
        />
      )}
    </>
  )
}

export default ProductListPage
