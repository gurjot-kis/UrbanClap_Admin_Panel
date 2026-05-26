type VendorStatCardProps = {
  label: string
  value: string | number
  loading?: boolean
  highlight?: boolean
}

function VendorStatCard({ label, value, loading = false, highlight = false }: VendorStatCardProps) {
  return (
    <div className="col-6 col-lg-3">
      <div
        className={`card border-0 rounded-3 shadow-sm h-100${highlight ? ' text-white' : ''}`}
        style={highlight ? { background: '#1b3a5c' } : undefined}
      >
        <div className="card-body p-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className={`small${highlight ? ' opacity-75' : ' text-muted'}`}>{label}</span>
          </div>
          <div className="fw-bold" style={{ fontSize: '1.6rem' }}>
            {loading ? '-' : value}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VendorStatCard
