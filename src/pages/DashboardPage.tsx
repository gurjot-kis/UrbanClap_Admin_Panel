import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { clearAuthSession, getStoredToken, getStoredUser } from '../utils/auth'
import Sidebar from '../components/Sidebar'
import '../styles/Dashboard.css'

// const BAR_DATA = [
//   { month: 'JAN', y2019: 28, y2020: 15 },
//   { month: 'FEB', y2019: 32, y2020: 22 },
//   { month: 'MAR', y2019: 20, y2020: 35 },
//   { month: 'APR', y2019: 18, y2020: 28 },
//   { month: 'MAY', y2019: 38, y2020: 22 },
//   { month: 'JUN', y2019: 44, y2020: 38 },
//   { month: 'JUL', y2019: 30, y2020: 44 },
//   { month: 'AUG', y2019: 22, y2020: 32 },
//   { month: 'SEP', y2019: 18, y2020: 26 },
// ]

// const AREA_DATA = [
//   { x: 'Jan', lorem: 30, dolor: 15 },
//   { x: 'Feb', lorem: 55, dolor: 28 },
//   { x: 'Mar', lorem: 38, dolor: 45 },
//   { x: 'Apr', lorem: 65, dolor: 32 },
//   { x: 'May', lorem: 48, dolor: 55 },
//   { x: 'Jun', lorem: 72, dolor: 42 },
//   { x: 'Jul', lorem: 58, dolor: 68 },
//   { x: 'Aug', lorem: 82, dolor: 52 },
// ]

// const DONUT_DATA = [
//   { name: 'Progress', value: 45 },
//   { name: 'Remaining', value: 55 },
// ]

type FilterMode = 'all_time' | 'this_month' | 'last_month' | 'custom'

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

function DashboardPage() {
  const navigate = useNavigate()

  const token = getStoredToken()
  const user = getStoredUser()
  const [summary, setSummary] = useState({ usersCount: 0, productsCount: 0, ordersCount: 0, grandTotal: 0 })
  const [loadingCounts, setLoadingCounts] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterMode, setFilterMode] = useState<FilterMode>('all_time')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const monthOptions = getLast12MonthOptions()

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
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
      const res = await fetch(`/api/dashboard/summary${query ? `?${query}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const json = await res.json()
      const payload = json?.data ?? json
      setSummary({
        usersCount: Number(payload?.usersCount ?? 0),
        productsCount: Number(payload?.productsCount ?? 0),
        ordersCount: Number(payload?.ordersCount ?? 0),
        grandTotal: Number(payload?.grandTotal ?? 0),
      })
    } catch (err) {
      setSummary({ usersCount: 0, productsCount: 0, ordersCount: 0, grandTotal: 0 })
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
    <div className="d-flex min-vh-100" style={{ background: '#eef1f6' }}>

      {/* ── Sidebar ── */}
      <Sidebar />

      {/* ── Main ── */}
      <div className="d-flex flex-column flex-grow-1 min-w-0">

        {/* Top bar */}
        <header className="d-flex align-items-center justify-content-between px-4 py-3 bg-white shadow-sm">
          <h6 className="mb-0 fw-semibold text-dark">Dashboard</h6>
          <button type="button" className="btn btn-danger btn-sm px-3 fw-semibold" onClick={handleLogout}>
            Logout
          </button>
        </header>

        {/* Body */}
        <div className="p-4 d-flex flex-column gap-3 flex-grow-1">
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
                      <option key={month.value} value={month.value}>{month.label}</option>
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

          {/* ── Stats row ── */}
          <div className="row g-3">

            {/* Users Count */}
            <div className="col-6 col-lg-3">
              <div className="card border-0 rounded-3 shadow-sm h-100">
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small text-muted">Users</span>
                  </div>
                  <div className="fw-bold" style={{ fontSize: '1.6rem' }}>
                    {loadingCounts ? '-' : summary.usersCount}
                  </div>
                </div>
              </div>
            </div>

            {/* Products Count */}
            <div className="col-6 col-lg-3">
              <div className="card border-0 rounded-3 shadow-sm h-100 text-white" style={{ background: '#1b3a5c' }}>
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small opacity-75">Products</span>
                  </div>
                  <div className="fw-bold" style={{ fontSize: '1.6rem' }}>
                    {loadingCounts ? '-' : summary.productsCount}
                  </div>
                </div>
              </div>
            </div>

            {/* Orders Count */}
            <div className="col-6 col-lg-3">
              <div className="card border-0 rounded-3 shadow-sm h-100">
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small text-muted">Orders</span>
                  </div>
                  <div className="fw-bold" style={{ fontSize: '1.6rem' }}>
                    {loadingCounts ? '-' : summary.ordersCount}
                  </div>
                </div>
              </div>
            </div>

            {/* Grand Total */}
            <div className="col-6 col-lg-3">
              <div className="card border-0 rounded-3 shadow-sm h-100">
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small text-muted">Grand Total</span>
                  </div>
                  <div className="fw-bold" style={{ fontSize: '1.6rem' }}>
                    {loadingCounts ? '-' : summary.grandTotal}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Charts row ── */}
          <div className="row g-3">
            {/* Bar chart */}
            {/* <div className="col-12 col-lg-8">
              <div className="card border-0 rounded-3 shadow-sm h-100">
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-semibold small text-dark">Result</span>
                    <button type="button" className="btn btn-sm btn-check-orange px-3">Check Now</button>
                  </div>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="leg-dot navy-dot" />
                    <small className="text-muted">2019</small>
                    <span className="leg-dot orange-dot" />
                    <small className="text-muted">2020</small>
                  </div>
                  <ResponsiveContainer width="100%" height={195}>
                    <BarChart data={BAR_DATA} barCategoryGap="35%" barGap={3}>
                      <CartesianGrid vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={28} />
                      <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                      <Bar dataKey="y2019" name="2019" fill="#1b3a5c" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="y2020" name="2020" fill="#f5a623" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div> */}

            {/* Donut chart */}
            {/* <div className="col-12 col-lg-4">
              <div className="card border-0 rounded-3 shadow-sm h-100">
                <div className="card-body p-3 d-flex flex-column align-items-center gap-2">
                  <div className="donut-ring-wrap">
                    <PieChart width={130} height={130}>
                      <Pie
                        data={DONUT_DATA}
                        cx={65} cy={65}
                        innerRadius={44} outerRadius={62}
                        startAngle={90} endAngle={-270}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {DONUT_DATA.map((_, i) => (
                          <Cell key={i} fill={DONUT_COLORS[i]} />
                        ))}
                      </Pie>
                    </PieChart>
                    <span className="donut-pct">45%</span>
                  </div>

                  <ul className="list-group list-group-flush w-100 small">
                    {['Lorem ipsum', 'Lorem ipsum', 'Lorem ipsum', 'Lorem ipsum'].map((t, i) => (
                      <li key={i} className="list-group-item px-0 py-1 text-muted border-bottom">{t}</li>
                    ))}
                  </ul>

                  <button type="button" className="btn btn-sm btn-check-orange w-100 mt-1">Check Now</button>
                </div>
              </div>
            </div> */}
          </div>

          {/* ── Bottom row ── */}
          <div className="row g-3">
            {/* Area chart */}
            {/* <div className="col-12 col-lg-8">
              <div className="card border-0 rounded-3 shadow-sm h-100">
                <div className="card-body p-3">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="leg-dot orange-dot" />
                    <small className="text-muted">Lorem Ipsum</small>
                    <span className="leg-dot navy-dot" />
                    <small className="text-muted">Dolor Amet</small>
                  </div>
                  <ResponsiveContainer width="100%" height={155}>
                    <AreaChart data={AREA_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gLorem" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f5a623" stopOpacity={0.65} />
                          <stop offset="95%" stopColor="#f5a623" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="gDolor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1b3a5c" stopOpacity={0.7} />
                          <stop offset="95%" stopColor="#1b3a5c" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="x" hide />
                      <YAxis hide />
                      <Tooltip />
                      <Area type="monotone" dataKey="lorem" name="Lorem Ipsum" stroke="#f5a623" fill="url(#gLorem)" strokeWidth={2} />
                      <Area type="monotone" dataKey="dolor" name="Dolor Amet" stroke="#1b3a5c" fill="url(#gDolor)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div> */}

            {/* Calendar */}
            {/* <div className="col-12 col-lg-4">
              <div className="card border-0 rounded-3 shadow-sm h-100">
                <div className="card-body p-3">
                  <MiniCalendar />
                </div>
              </div>
            </div> */}
          </div>

        </div>
      </div>
    </div>
  )
}

export default DashboardPage
