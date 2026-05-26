type VendorListToolbarProps = {
  pageSize: number
  pageSizeOptions: number[]
  search: string
  searchPlaceholder?: string
  onPageSizeChange: (size: number) => void
  onSearchChange: (value: string) => void
}

function VendorListToolbar({
  pageSize,
  pageSizeOptions,
  search,
  searchPlaceholder = 'Search by name…',
  onPageSizeChange,
  onSearchChange,
}: VendorListToolbarProps) {
  return (
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
      <div className="d-flex align-items-center gap-2">
        <label className="text-muted small mb-0">Show</label>
        <select
          className="form-select form-select-sm cat-page-select"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {pageSizeOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span className="text-muted small">entries</span>
      </div>

      <div className="cat-search-wrap">
        <span className="cat-search-icon">
          <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
        </span>
        <input
          type="search"
          className="form-control form-control-sm cat-search-input"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  )
}

export default VendorListToolbar
