import React from 'react'
import PropTypes from 'prop-types'

const Pagination = ({
  page,
  totalPages,
  label,
  onPageChange,
  className = '',
}) => {
  const safeTotalPages = Math.max(1, Number(totalPages) || 1)
  const currentPage = Math.min(Math.max(1, Number(page) || 1), safeTotalPages)

  const handleChange = (nextPage) => {
    if (typeof onPageChange !== 'function') return
    if (nextPage < 1 || nextPage > safeTotalPages || nextPage === currentPage) return
    onPageChange(nextPage)
  }

  const maxButtons = 3
  let start = Math.max(1, currentPage - 1)
  let end = Math.min(safeTotalPages, start + maxButtons - 1)
  start = Math.max(1, end - maxButtons + 1)

  const pages = []
  for (let p = start; p <= end; p += 1) {
    pages.push(p)
  }

  const canPrev = currentPage > 1
  const canNext = currentPage < safeTotalPages

  return (
    <div className={['flex items-center justify-between', className].filter(Boolean).join(' ')}>
      <div className="text-sm text-gray-600">
        {label}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleChange(currentPage - 1)}
          disabled={!canPrev}
          className="min-w-[40px] px-3 py-1 rounded border border-[#e5e7eb] text-sm text-gray-700 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Prev
        </button>
        {pages.map((p) => {
          const isActive = p === currentPage
          return (
            <button
              key={p}
              type="button"
              onClick={() => handleChange(p)}
              className={[
                'min-w-[36px] px-3 py-1 rounded border text-sm',
                isActive
                  ? 'bg-[#e6f5e9] text-[#007a33] font-semibold border-[#a7dbb8]'
                  : 'border-[#e5e7eb] text-gray-700 bg-white hover:bg-gray-50',
              ].join(' ')}
            >
              {p}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => handleChange(currentPage + 1)}
          disabled={!canNext}
          className="min-w-[40px] px-3 py-1 rounded border border-[#e5e7eb] text-sm text-gray-700 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}

Pagination.propTypes = {
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  onPageChange: PropTypes.func.isRequired,
  className: PropTypes.string,
}

export default Pagination
