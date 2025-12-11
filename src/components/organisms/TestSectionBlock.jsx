import React from 'react'
import PropTypes from 'prop-types'
import CategoryCard from '../molecules/CategoryCard.jsx'
import ScoreShield from '../molecules/ScoreShield.jsx'
import { classes } from '../../config/theme/tokens.js'

export default function TestSectionBlock({
  record,
  highlight = false,
  onViewDetails,
  className = '',
  highlightClassesOverride = 'bg-[#f4f9f3] border border-[#d9e7d6] rounded-[10px] shadow-[0_4px_4px_#00000033]',
}) {
  if (!record) return null

  const containerClasses = [
    'p-6',
    highlight ? highlightClassesOverride : classes.whiteCard,
    className,
  ].filter(Boolean).join(' ')

  const showViewDetails = typeof onViewDetails === 'function'
  const categories = Array.isArray(record.categories) ? record.categories : []
  const isScrollable = categories.length > 3

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-3 md:flex-row md:items-start md:justify-between">
        <div className="order-2 md:order-1 underline text-gray-600 text-lg font-medium text-center md:text-left">
          {record.title}
        </div>
        <div className="order-1 md:order-2">
          <ScoreShield value={record.total} />
        </div>
      </div>

      <div
        className={[
          'mt-6',
          isScrollable
            ? 'grid grid-cols-1 gap-6 max-h-[320px] overflow-y-auto tutor-scroll md:max-h-none md:overflow-y-visible md:flex md:flex-row md:flex-nowrap md:overflow-x-auto md:gap-6 md:pb-4 md:pr-1 scroll-smooth'
            : 'grid grid-cols-1 md:grid-cols-3 gap-6',
        ].join(' ')}
      >
        {categories.map((c, idx) => (
          <div
            key={`${String(c?.name)}-${idx}`}
            className={isScrollable ? 'md:flex-shrink-0 md:min-w-[300px] md:max-w-[300px]' : ''}
          >
            <CategoryCard name={c.name} score={c.score} />
          </div>
        ))}
      </div>

      {(record.date || showViewDetails) && (
        <div className="mt-6 flex flex-col items-center justify-center gap-2 text-gray-500 md:flex-row md:justify-end md:gap-6">
          {record.date && <span>{record.date}</span>}
          {showViewDetails && (
            <button
              type="button"
              className="underline hover:text-gray-800 cursor-pointer"
              onClick={onViewDetails}
              aria-label="View Details"
            >
              View Details
            </button>
          )}
        </div>
      )}
    </div>
  )
}

TestSectionBlock.propTypes = {
  record: PropTypes.shape({
    title: PropTypes.string.isRequired,
    total: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    averageScore: PropTypes.number,
    categories: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.node.isRequired,
      score: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    })),
    date: PropTypes.string,
  }).isRequired,
  highlight: PropTypes.bool,
  onViewDetails: PropTypes.func,
  className: PropTypes.string,
  highlightClassesOverride: PropTypes.string,
}
