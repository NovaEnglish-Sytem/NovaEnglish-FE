import React from 'react'
import PropTypes from 'prop-types'
import { classes } from '../../config/theme/tokens.js'
import QuestionSummaryCard from '../molecules/QuestionSummaryCard.jsx'
import { HiArrowRight } from 'react-icons/hi'
import { FaRegEdit } from 'react-icons/fa'

export const QuestionSection = ({
  title,
  items = [],
  onManage = () => {},
  onViewAll = () => {},
  onEdit = null,
  packageCount = null,
  className = '',
}) => {
  return (
    <section className={['w-full', className].filter(Boolean).join(' ')}>
      <div className={[classes.whiteCard, 'bg-amber-200 w-full p-4 sm:p-5'].join(' ')}>
        <div className="flex items-center justify-between gap-2 mb-4">
          <h2 className="text-gray-600 text-lg sm:text-xl font-medium underline flex items-center gap-2">
            {title}
            {onEdit && (
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700"
                aria-label={`Edit ${title} category`}
                onClick={onEdit}
              >
                <FaRegEdit className="w-4 h-4" />
              </button>
            )}
          </h2>

          <button
            type="button"
            onClick={onViewAll}
            className="hidden md:inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 underline justify-center cursor-pointer"
            aria-label={`View all ${title}`}
          >
            <span>View All</span>
            <HiArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Display package count or items grid */}
        {packageCount !== null ? (
          <div className="text-center py-8 text-gray-600">
            <p className="text-lg">
              {packageCount === 0 ? 'No packages yet' : `${packageCount} package${packageCount !== 1 ? 's' : ''}`}
            </p>
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {items.map((it) => (
              <QuestionSummaryCard
                key={it.id}
                title={it.title}
                totalQuestions={it.totalQuestions}
                duration={it.duration}
                isPublished={it.isPublished}
                onManage={() => onManage(it)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No items to display
          </div>
        )}

        <button
          type="button"
          onClick={onViewAll}
          className="md:hidden inline-flex justify-center items-center gap-2 text-gray-500 hover:text-gray-700 underline w-full mt-8"
          aria-label={`View all ${title}`}
        >
          <span>View All</span>
          <HiArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  )
}

QuestionSection.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    totalQuestions: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    duration: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  })),
  onManage: PropTypes.func,
  onViewAll: PropTypes.func,
  onEdit: PropTypes.func,
  packageCount: PropTypes.number,
  className: PropTypes.string,
}

export default QuestionSection
