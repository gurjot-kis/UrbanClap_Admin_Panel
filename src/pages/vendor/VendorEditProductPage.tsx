import { useCallback, useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { getStoredToken, getStoredUser } from '../../utils/auth'
import { resolveMediaUrl } from '../../config/api'
import {
  getCategoryOptionId,
  getOptionName,
  getSubCategoryOptionId,
  parseProductApiError,
  type CategoryOption,
  type SubCategoryOption,
} from '../../utils/productForm'
import VendorLayout from '../../components/vendor/VendorLayout'
import { ROUTES, VENDOR_ROUTES } from '../../routes'
import '../../styles/Dashboard.css'

interface ProductResponse {
  name?: string
  description?: string
  shortDescription?: string
  category_id?: string
  sub_category_id?: string
  mainImage?: string
  featuredImages?: string[]
  sku?: string
  status?: 'pending' | 'active' | 'rejected'
  currency?: string
  stock?: number | string
  slug?: string
  stockStatus?: 'in_stock' | 'out_of_stock'
  costPrice?: number | string
  sellingPrice?: number | string
  price?: number | string
  [key: string]: unknown
}

function VendorEditProductPage() {
  const navigate = useNavigate()
  const { productId } = useParams<{ productId: string }>()
  const token = getStoredToken()
  const user = getStoredUser()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subCategoryId, setSubCategoryId] = useState('')
  const [mainImage, setMainImage] = useState('')
  const [featuredImages, setFeaturedImages] = useState('')
  const [sku, setSku] = useState('')
  const [status, setStatus] = useState<'pending' | 'active' | 'rejected'>('pending')
  const [currency, setCurrency] = useState('INR')
  const [stock, setStock] = useState('')
  const [slug, setSlug] = useState('')
  const [stockStatus, setStockStatus] = useState<'in_stock' | 'out_of_stock'>('in_stock')
  const [costPrice, setCostPrice] = useState('')
  const [sellingPrice, setSellingPrice] = useState('')
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mainImageFile, setMainImageFile] = useState<File | null>(null)
  const [featuredImageFiles, setFeaturedImageFiles] = useState<File[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [subCategories, setSubCategories] = useState<SubCategoryOption[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [loadingSubCategories, setLoadingSubCategories] = useState(false)
  const [mainImagePreviewUrl, setMainImagePreviewUrl] = useState('')
  const [featuredImagePreviewUrls, setFeaturedImagePreviewUrls] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const existingFeaturedImageUrls = featuredImages
    .split('\n')
    .map((url) => url.trim())
    .filter(Boolean)

  if (!token || !user) {
    return <Navigate to={ROUTES.login} replace />
  }

  const fetchProduct = useCallback(async () => {
    if (!productId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const json = await res.json()
      const item: ProductResponse = json?.data ?? json
      setName((item.name as string) ?? '')
      setDescription((item.description as string) ?? '')
      setShortDescription((item.shortDescription as string) ?? '')
      setCategoryId((item.category_id as string) ?? '')
      setSubCategoryId((item.sub_category_id as string) ?? '')
      setMainImage((item.mainImage as string) ?? '')
      setFeaturedImages(Array.isArray(item.featuredImages) ? item.featuredImages.join('\n') : '')
      setSku((item.sku as string) ?? '')
      setStatus(
        item.status === 'active' || item.status === 'rejected' || item.status === 'pending'
          ? item.status
          : 'pending'
      )
      setCurrency((item.currency as string) ?? 'INR')
      setStock(item.stock === undefined || item.stock === null ? '' : String(item.stock))
      setSlug((item.slug as string) ?? '')
      setStockStatus(item.stockStatus === 'out_of_stock' ? 'out_of_stock' : 'in_stock')
      setCostPrice(item.costPrice === undefined || item.costPrice === null ? '' : String(item.costPrice))
      setSellingPrice(item.sellingPrice === undefined || item.sellingPrice === null ? '' : String(item.sellingPrice))
      setPrice(item.price === undefined || item.price === null ? '' : String(item.price))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product')
    } finally {
      setLoading(false)
    }
  }, [productId, token])

  useEffect(() => {
    fetchProduct()
  }, [fetchProduct])

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true)
      try {
        const res = await fetch('/api/categories', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error(`Failed to load categories: ${res.status}`)
        const json = await res.json()
        const items: CategoryOption[] = Array.isArray(json) ? json : (json.data ?? [])
        setCategories(items)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load categories')
      } finally {
        setLoadingCategories(false)
      }
    }
    fetchCategories()
  }, [token])

  useEffect(() => {
    if (!categoryId) {
      setSubCategories([])
      setSubCategoryId('')
      return
    }
    const fetchSubCategories = async () => {
      setLoadingSubCategories(true)
      try {
        const res = await fetch(`/api/sub-categories/category/${categoryId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error(`Failed to load sub categories: ${res.status}`)
        const json = await res.json()
        const items: SubCategoryOption[] = Array.isArray(json) ? json : (json.data ?? [])
        setSubCategories(items)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sub categories')
      } finally {
        setLoadingSubCategories(false)
      }
    }
    fetchSubCategories()
  }, [categoryId, token])

  useEffect(() => {
    if (!mainImageFile) {
      setMainImagePreviewUrl('')
      return
    }
    const objectUrl = URL.createObjectURL(mainImageFile)
    setMainImagePreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [mainImageFile])

  useEffect(() => {
    const objectUrls = featuredImageFiles.map((file) => URL.createObjectURL(file))
    setFeaturedImagePreviewUrls(objectUrls)
    return () => objectUrls.forEach((url) => URL.revokeObjectURL(url))
  }, [featuredImageFiles])

  const handleMainImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setMainImageFile(file)
    e.target.value = ''
  }

  const handleFeaturedImagesUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    setFeaturedImageFiles(files)
    e.target.value = ''
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!productId) return
    if (!name.trim()) {
      setError('Product name is required')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('status', status)
      formData.append('stockStatus', stockStatus)
      formData.append('description', description.trim())
      if (shortDescription.trim()) formData.append('shortDescription', shortDescription.trim())
      if (categoryId.trim()) formData.append('category_id', categoryId.trim())
      if (subCategoryId.trim()) formData.append('sub_category_id', subCategoryId.trim())
      if (sku.trim()) formData.append('sku', sku.trim())
      if (currency.trim()) formData.append('currency', currency.trim())
      if (stock.trim()) formData.append('stock', stock.trim())
      if (slug.trim()) formData.append('slug', slug.trim())
      if (costPrice.trim()) formData.append('costPrice', costPrice.trim())
      if (sellingPrice.trim()) formData.append('sellingPrice', sellingPrice.trim())
      if (price.trim()) formData.append('price', price.trim())

      if (mainImageFile) {
        formData.append('mainImage', mainImageFile)
      } else if (mainImage.trim()) {
        // Keep compatibility when server accepts existing URL string.
        formData.append('mainImage', mainImage.trim())
      }

      if (featuredImageFiles.length > 0) {
        featuredImageFiles.forEach((file) => formData.append('featuredImages', file))
      } else {
        const featuredImageList = featuredImages
          .split('\n')
          .map((url) => url.trim())
          .filter(Boolean)
        featuredImageList.forEach((url) => formData.append('featuredImages', url))
      }

      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })
      if (!res.ok) throw new Error(await parseProductApiError(res, `Server error: ${res.status}`))
      navigate(VENDOR_ROUTES.products)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product')
    } finally {
      setSaving(false)
    }
  }

  return (
    <VendorLayout title="Edit Product" backTo={VENDOR_ROUTES.products} backTitle="Back to Products">
        <div>
          <div className="card border-0 rounded-3 shadow-sm" style={{ maxWidth: 700 }}>
            <div className="card-body p-4">
              {loading ? (
                <div className="cat-state d-flex flex-column align-items-center justify-content-center py-4 gap-2">
                  <div className="spinner-border text-primary" style={{ width: '2rem', height: '2rem' }} role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <span className="text-muted small">Loading product details...</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                  <div>
                    <label className="form-label fw-semibold mb-1">Name</label>
                    <input
                      className="form-control edit-modal-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter product name"
                      maxLength={120}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label fw-semibold mb-1">Description</label>
                    <textarea
                      className="form-control edit-modal-input edit-modal-textarea"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter product description"
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="form-label fw-semibold mb-1">Short Description</label>
                    <textarea
                      className="form-control edit-modal-input edit-modal-textarea"
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      placeholder="Enter short description"
                      rows={2}
                    />
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold mb-1">Category</label>
                      <select
                        className="form-select edit-modal-input"
                        value={categoryId}
                        onChange={(e) => {
                          setCategoryId(e.target.value)
                          setSubCategoryId('')
                        }}
                        disabled={loadingCategories}
                      >
                        <option value="">{loadingCategories ? 'Loading categories...' : 'Select category'}</option>
                        {categories.map((category) => {
                          const id = getCategoryOptionId(category)
                          const label = getOptionName(category)
                          if (!id) return null
                          return (
                            <option key={id} value={id}>
                              {label || id}
                            </option>
                          )
                        })}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold mb-1">Sub Category</label>
                      <select
                        className="form-select edit-modal-input"
                        value={subCategoryId}
                        onChange={(e) => setSubCategoryId(e.target.value)}
                        disabled={!categoryId || loadingSubCategories}
                      >
                        <option value="">
                          {!categoryId
                            ? 'Select category first'
                            : loadingSubCategories
                              ? 'Loading sub categories...'
                              : 'Select sub category'}
                        </option>
                        {subCategories.map((subCategory) => {
                          const id = getSubCategoryOptionId(subCategory)
                          const label = getOptionName(subCategory)
                          if (!id) return null
                          return (
                            <option key={id} value={id}>
                              {label || id}
                            </option>
                          )
                        })}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="form-label fw-semibold mb-1">Main Image URL</label>
                    <input
                      className="form-control edit-modal-input"
                      value={mainImage}
                      onChange={(e) => setMainImage(e.target.value)}
                      placeholder="https://example.com/main.jpg"
                    />
                    <div className="mt-2">
                      {mainImage && !mainImagePreviewUrl && (
                        <div className="mb-2">
                          <small className="text-muted d-block mb-1">Current Main Image</small>
                          <img
                            src={resolveMediaUrl(mainImage)}
                            alt="Current main"
                            style={{ width: 140, height: 140, objectFit: 'cover', borderRadius: 8, border: '1px solid #dee2e6' }}
                          />
                        </div>
                      )}
                      <label className="form-label fw-semibold mb-1">Upload Main Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="form-control edit-modal-input"
                        onChange={handleMainImageUpload}
                      />
                      {mainImagePreviewUrl && (
                        <div className="mt-2">
                          <small className="text-muted d-block mb-1">New Main Image (to replace)</small>
                          <img
                            src={mainImagePreviewUrl}
                            alt="Main preview"
                            style={{ width: 140, height: 140, objectFit: 'cover', borderRadius: 8, border: '1px solid #dee2e6' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="form-label fw-semibold mb-1">Featured Images (one URL per line)</label>
                    <textarea
                      className="form-control edit-modal-input edit-modal-textarea"
                      value={featuredImages}
                      onChange={(e) => setFeaturedImages(e.target.value)}
                      placeholder={'https://example.com/1.jpg\nhttps://example.com/2.jpg'}
                      rows={4}
                    />
                    <div className="mt-2">
                      {existingFeaturedImageUrls.length > 0 && featuredImagePreviewUrls.length === 0 && (
                        <div className="mb-2">
                          <small className="text-muted d-block mb-1">Current Featured Images</small>
                          <div className="d-flex flex-wrap gap-2">
                            {existingFeaturedImageUrls.map((url, idx) => (
                              <img
                                key={`${url}-${idx}`}
                                src={resolveMediaUrl(url)}
                                alt={`Current featured ${idx + 1}`}
                                style={{ width: 110, height: 110, objectFit: 'cover', borderRadius: 8, border: '1px solid #dee2e6' }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      <label className="form-label fw-semibold mb-1">Upload Multiple Featured Images</label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="form-control edit-modal-input"
                        onChange={handleFeaturedImagesUpload}
                      />
                      {featuredImagePreviewUrls.length > 0 && (
                        <div className="mt-2 d-flex flex-wrap gap-2">
                          <small className="text-muted d-block w-100 mb-1">New Featured Images (to replace)</small>
                          {featuredImagePreviewUrls.map((url, idx) => (
                            <img
                              key={url}
                              src={url}
                              alt={`Featured preview ${idx + 1}`}
                              style={{ width: 110, height: 110, objectFit: 'cover', borderRadius: 8, border: '1px solid #dee2e6' }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="form-label fw-semibold mb-1">SKU</label>
                    <input
                      className="form-control edit-modal-input"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="Enter SKU"
                    />
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold mb-1">Status</label>
                      <select
                        className="form-select edit-modal-input"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as 'pending' | 'active' | 'rejected')}
                      >
                        <option value="pending">pending</option>
                        <option value="active">active</option>
                        <option value="rejected">rejected</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold mb-1">Stock Status</label>
                      <select
                        className="form-select edit-modal-input"
                        value={stockStatus}
                        onChange={(e) => setStockStatus(e.target.value as 'in_stock' | 'out_of_stock')}
                      >
                        <option value="in_stock">in_stock</option>
                        <option value="out_of_stock">out_of_stock</option>
                      </select>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold mb-1">Currency</label>
                      <input
                        className="form-control edit-modal-input"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        placeholder="INR"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold mb-1">Stock</label>
                      <input
                        type="number"
                        className="form-control edit-modal-input"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        placeholder="Enter stock"
                        min="0"
                        step="1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label fw-semibold mb-1">Slug</label>
                    <input
                      className="form-control edit-modal-input"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="iphone-17"
                    />
                  </div>

                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold mb-1">Cost Price</label>
                      <input
                        type="number"
                        className="form-control edit-modal-input"
                        value={costPrice}
                        onChange={(e) => setCostPrice(e.target.value)}
                        placeholder="Enter cost price"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold mb-1">Selling Price</label>
                      <input
                        type="number"
                        className="form-control edit-modal-input"
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(e.target.value)}
                        placeholder="Enter selling price"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold mb-1">Price</label>
                      <input
                        type="number"
                        className="form-control edit-modal-input"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="Enter product price"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {error && <p className="text-danger small mb-0">{error}</p>}

                  <div className="d-flex justify-content-end gap-2 pt-2">
                    <button type="button" className="btn btn-light border" onClick={() => navigate(VENDOR_ROUTES.products)} disabled={saving}>
                      Cancel
                    </button>
                    <button type="submit" className="btn edit-modal-save-btn px-3" disabled={saving}>
                      {saving ? 'Updating...' : 'Update Product'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
    </VendorLayout>
  )
}

export default VendorEditProductPage
