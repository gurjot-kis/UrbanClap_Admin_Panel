import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { getStoredToken, getStoredUser } from '../../utils/auth'
import { appendProductListQuery } from '../../utils/productForm'
import VendorLayout from '../../components/vendor/VendorLayout'
import VendorListToolbar from '../../components/vendor/VendorListToolbar'
import VendorPagination from '../../components/vendor/VendorPagination'
import { ROUTES, VENDOR_ROUTES } from '../../routes'
import '../../styles/Dashboard.css'

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

function VendorProductListPage() {
  const navigate = useNavigate()
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

  const currentPage = Math.min(page, Math.max(1, Math.ceil(total / pageSize)))

  return (
    <VendorLayout title="Products">
          <div className="card border-0 rounded-3 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                <VendorListToolbar
                  pageSize={pageSize}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  search={search}
                  searchPlaceholder="Search by name..."
                  onPageSizeChange={(val) => {
                    setPageSize(val)
                    setPage(1)
                  }}
                  onSearchChange={handleSearch}
                />
                <button
                  type="button"
                  className="btn btn-sm cat-btn-add"
                  onClick={() => navigate(VENDOR_ROUTES.productsNew)}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" className="me-1">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                  Add Product
                </button>
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
                                      onClick={() => navigate(VENDOR_ROUTES.productEdit(productId))}
                                    >
                                      <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
                                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
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
    </VendorLayout>
  )
}

export default VendorProductListPage
