import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import VendorLayout from '../../components/vendor/VendorLayout'
import VendorStatCard from '../../components/vendor/VendorStatCard'
import { ROUTES } from '../../routes'
import { getStoredToken, getStoredUser } from '../../utils/auth'
type FilterMode = 'all_time' | 'this_month' | 'last_month' | 'custom'

type VendorSummary = {
  ordersCount: number
  productsCount: number
  revenueTotal: number
}

const toIsoDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getLast12MonthOptions = (): { label: string; value: string }[] => {
  const options: { label: string; value: string }[] = []
  const now = new Date()
  for (let i = 0; i < 12; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    options.push({
      label: d.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    })
  }
  return options
}

const VENDOR_SUMMARY_API = '/api/vendor/dashboard/summary'

function VendorDashboardPage() {
  const token = getStoredToken()
  const user = getStoredUser()
  const [summary, setSummary] = useState<VendorSummary>({
    ordersCount: 0,
    productsCount: 0,
    revenueTotal: 0,
  })
  const [loadingCounts, setLoadingCounts] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterMode, setFilterMode] = useState<FilterMode>('all_time')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const monthOptions = getLast12MonthOptions()

  if (!token || !user) {
    return <Navigate to={ROUTES.login} replace />
  }

  const fetchCounts = useCallback(async () => {
    if (filterMode === 'custom' && (!fromDate || !toDate)) {
      return
    }
    setLoadingCounts(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filterMode === 'this_month') params.set('period', 'this_month')
      if (filterMode === 'last_month') params.set('period', 'last_month')
      if (filterMode === 'custom') {
        params.set('fromDate', fromDate)
        params.set('toDate', toDate)
      }
      const query = params.toString()
      const res = await fetch(`${VENDOR_SUMMARY_API}${query ? `?${query}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const json = await res.json()
      const payload = json?.data ?? json
      setSummary({
        ordersCount: Number(payload?.ordersCount ?? 0),
        productsCount: Number(payload?.productsCount ?? 0),
        revenueTotal: Number(payload?.revenueTotal ?? payload?.grandTotal ?? 0),
      })
    } catch (err) {
      setSummary({ ordersCount: 0, productsCount: 0, revenueTotal: 0 })
      setError(err instanceof Error ? err.message : 'Failed to load dashboard summary')
    } finally {
      setLoadingCounts(false)
    }
  }, [token, filterMode, fromDate, toDate])

  useEffect(() => {
    fetchCounts()
  }, [fetchCounts])

  const handleSelectMonth = (monthValue: string) => {
    setSelectedMonth(monthValue)
    if (!monthValue) return
    const [year, month] = monthValue.split('-').map(Number)
    const first = new Date(year, month - 1, 1)
    const last = new Date(year, month, 0)
    setFromDate(toIsoDate(first))
    setToDate(toIsoDate(last))
    setFilterMode('custom')
  }

  return (
    <VendorLayout title="Vendor Dashboard">
      <div className="card border-0 rounded-3 shadow-sm">
        <div className="card-body p-4">
          <h5 className="fw-semibold mb-1" style={{ color: '#1b3a5c' }}>
            Welcome, {user.name}
          </h5>
          <p className="text-muted small mb-0">
            Overview of your products and orders.
          </p>
        </div>
      </div>

      <div className="card border-0 rounded-3 shadow-sm">
        <div className="card-body p-3">
          <div className="row g-3">
            <div className="col-12 col-lg-3">
              <label className="form-label small fw-semibold mb-1">Month (Last 12 Months)</label>
              <select
                className="form-select form-select-sm"
                value={selectedMonth}
                onChange={(e) => handleSelectMonth(e.target.value)}
              >
                <option value="">Select month</option>
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-lg-2">
              <label className="form-label small fw-semibold mb-1">From Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value)
                  setFilterMode('custom')
                }}
              />
            </div>

            <div className="col-12 col-lg-2">
              <label className="form-label small fw-semibold mb-1">To Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value)
                  setFilterMode('custom')
                }}
              />
            </div>

            <div className="col-12 col-lg-2 d-flex align-items-end">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary w-100"
                onClick={() => {
                  setFilterMode('all_time')
                  setFromDate('')
                  setToDate('')
                  setSelectedMonth('')
                }}
              >
                Reset
              </button>
            </div>
          </div>
          {error && <p className="text-danger small mt-2 mb-0">{error}</p>}
        </div>
      </div>

      <div className="row g-3">
        <VendorStatCard
          label="Products"
          value={summary.productsCount}
          loading={loadingCounts}
          highlight
        />
        <VendorStatCard label="Orders" value={summary.ordersCount} loading={loadingCounts} />
        <VendorStatCard label="Revenue" value={summary.revenueTotal} loading={loadingCounts} />
      </div>
    </VendorLayout>
  )
}

export default VendorDashboardPage
