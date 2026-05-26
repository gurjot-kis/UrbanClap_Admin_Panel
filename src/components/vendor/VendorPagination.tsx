import React from 'react'

type VendorPaginationProps = {
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
}

function VendorPagination({ total, page, pageSize, onPageChange }: VendorPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
  const visiblePages = pageNumbers.filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1
  )

  return (
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3 pt-3 border-top">
      <p className="text-muted small mb-0">
        {total === 0
          ? 'No entries'
          : `Showing ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, total)} of ${total} entr${total === 1 ? 'y' : 'ies'}`}
      </p>

      {totalPages > 1 && (
        <nav>
          <ul className="pagination pagination-sm mb-0 cat-pagination">
            <li className={`page-item${currentPage === 1 ? ' disabled' : ''}`}>
              <button
                type="button"
                className="page-link"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ‹
              </button>
            </li>

            {visiblePages.map((n, i) => {
              const prev = visiblePages[i - 1]
              return (
                <React.Fragment key={n}>
                  {prev !== undefined && n - prev > 1 && (
                    <li className="page-item disabled">
                      <span className="page-link">…</span>
                    </li>
                  )}
                  <li className={`page-item${n === currentPage ? ' active' : ''}`}>
                    <button type="button" className="page-link" onClick={() => onPageChange(n)}>
                      {n}
                    </button>
                  </li>
                </React.Fragment>
              )
            })}

            <li className={`page-item${currentPage === totalPages ? ' disabled' : ''}`}>
              <button
                type="button"
                className="page-link"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                ›
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  )
}

export default VendorPagination
