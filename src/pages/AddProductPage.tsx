import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { clearAuthSession, getStoredToken, getStoredUser } from '../utils/auth'
import Sidebar from '../components/Sidebar'
import '../styles/Dashboard.css'

interface CategoryOption {
  id?: string
  category_id?: string
  name?: string
  category_name?: string
  [key: string]: unknown
}

interface SubCategoryOption {
  id?: string
  sub_category_id?: string
  name?: string
  sub_category_name?: string
  [key: string]: unknown
}

const getCategoryOptionId = (item: CategoryOption): string =>
  String(item.id ?? item.category_id ?? '')

const getSubCategoryOptionId = (item: SubCategoryOption): string =>
  String(item.id ?? item.sub_category_id ?? '')

const getOptionName = (item: CategoryOption | SubCategoryOption): string =>
  String(item.name ?? item.category_name ?? item.sub_category_name ?? '')

function AddProductPage() {
  const navigate = useNavigate()
  const token = getStoredToken()
  const user = getStoredUser()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subCategoryId, setSubCategoryId] = useState('')
  const [mainImageFile, setMainImageFile] = useState<File | null>(null)
  const [featuredImageFiles, setFeaturedImageFiles] = useState<File[]>([])
  const [sku, setSku] = useState('')
  const [status, setStatus] = useState<'pending' | 'active' | 'rejected'>('pending')
  const [currency, setCurrency] = useState('INR')
  const [stock, setStock] = useState('')
  const [slug, setSlug] = useState('')
  const [stockStatus, setStockStatus] = useState<'in_stock' | 'out_of_stock'>('in_stock')
  const [costPrice, setCostPrice] = useState('')
  const [sellingPrice, setSellingPrice] = useState('')
  const [price, setPrice] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [subCategories, setSubCategories] = useState<SubCategoryOption[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [loadingSubCategories, setLoadingSubCategories] = useState(false)
  const [mainImagePreviewUrl, setMainImagePreviewUrl] = useState('')
  const [featuredImagePreviewUrls, setFeaturedImagePreviewUrls] = useState<string[]>([])

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  const handleMainImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setMainImageFile(file)
  }

  const handleFeaturedImagesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    setFeaturedImageFiles(files)
  }

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
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
      if (description.trim()) formData.append('description', description.trim())
      if (shortDescription.trim()) formData.append('shortDescription', shortDescription.trim())
      if (categoryId.trim()) formData.append('category_id', categoryId.trim())
      if (subCategoryId.trim()) formData.append('sub_category_id', subCategoryId.trim())
      if (mainImageFile) formData.append('mainImage', mainImageFile)
      featuredImageFiles.forEach((file) => formData.append('featuredImages', file))
      if (sku.trim()) formData.append('sku', sku.trim())
      if (currency.trim()) formData.append('currency', currency.trim())
      if (stock.trim()) formData.append('stock', stock.trim())
      if (slug.trim()) formData.append('slug', slug.trim())
      if (costPrice.trim()) formData.append('costPrice', costPrice.trim())
      if (sellingPrice.trim()) formData.append('sellingPrice', sellingPrice.trim())
      if (price.trim()) formData.append('price', price.trim())

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      navigate('/products')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add product')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="d-flex min-vh-100" style={{ background: '#eef1f6' }}>
      <Sidebar />
      <div className="d-flex flex-column flex-grow-1 min-w-0">
        <header className="d-flex align-items-center justify-content-between px-4 py-3 bg-white shadow-sm">
          <div className="d-flex align-items-center gap-2">
            <button type="button" className="subcat-back-btn" onClick={() => navigate('/products')} title="Back to Products">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
              </svg>
            </button>
            <h6 className="mb-0 fw-semibold text-dark">Add Product</h6>
          </div>
          <button type="button" className="btn btn-danger btn-sm px-3 fw-semibold" onClick={handleLogout}>
            Logout
          </button>
        </header>

        <div className="p-4">
          <div className="card border-0 rounded-3 shadow-sm" style={{ maxWidth: 700 }}>
            <div className="card-body p-4">
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
                  <label className="form-label fw-semibold mb-1">Upload Main Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control edit-modal-input"
                    onChange={handleMainImageChange}
                  />
                  {mainImagePreviewUrl && (
                    <div className="mt-2">
                      <img
                        src={mainImagePreviewUrl}
                        alt="Main preview"
                        style={{ width: 140, height: 140, objectFit: 'cover', borderRadius: 8, border: '1px solid #dee2e6' }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="form-label fw-semibold mb-1">Upload Multiple Featured Images</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="form-control edit-modal-input"
                    onChange={handleFeaturedImagesChange}
                  />
                  {featuredImagePreviewUrls.length > 0 && (
                    <div className="mt-2 d-flex flex-wrap gap-2">
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

                <div>
                  <label className="form-label fw-semibold mb-1">SKU</label>
                  <input
                    className="form-control edit-modal-input"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="IPH17-128-BLK"
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
                  <div className="col-md-4">
                    <label className="form-label fw-semibold mb-1">Currency</label>
                    <input
                      className="form-control edit-modal-input"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      placeholder="INR"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold mb-1">Stock</label>
                    <input
                      type="number"
                      className="form-control edit-modal-input"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      placeholder="10"
                      min="0"
                      step="1"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold mb-1">Slug</label>
                    <input
                      className="form-control edit-modal-input"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="iphone-17"
                    />
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold mb-1">Cost Price</label>
                    <input
                      type="number"
                      className="form-control edit-modal-input"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      placeholder="80000"
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
                      placeholder="89999"
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
                      placeholder="79000"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {error && <p className="text-danger small mb-0">{error}</p>}

                <div className="d-flex justify-content-end gap-2 pt-2">
                  <button type="button" className="btn btn-light border" onClick={() => navigate('/products')} disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" className="btn edit-modal-save-btn px-3" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddProductPage
