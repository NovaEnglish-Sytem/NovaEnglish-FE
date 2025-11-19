import React from 'react'
import PropTypes from 'prop-types'
import { classes } from '../../config/theme/tokens.js'

export const QuestionSummaryCard = ({
  title,
  totalQuestions,
  duration,
  onManage = () => {},
  className = '',
  manageLabel = 'Manage',
  isPublished = null,
}) => {
  const totalText = typeof totalQuestions === 'number' ? `${totalQuestions} Total Questions` : totalQuestions
  const durationText = typeof duration === 'number' ? `${duration} Minutes` : duration

  return (
    <div
      className={[
        'bg-[#F8F8F8] rounded-3xl border border-gray-400/70 p-4 sm:p-5 text-center relative',
        className,
      ].filter(Boolean).join(' ')}
      role="group"
      aria-label={`${title} summary`}
    >
      {/* Published/Unpublished badge */}
      {isPublished !== null && (
        <div className="absolute top-3 right-3">
          <span
            className={[
              'px-2 py-1 text-xs font-medium rounded-full',
              isPublished
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            ].join(' ')}
          >
            {isPublished ? 'Published' : 'Unpublished'}
          </span>
        </div>
      )}

      <div className="mb-3 sm:mb-4">
        <h3 className={[classes.textSuccess, 'text-base sm:text-lg font-semibold mb-1'].join(' ')}>{title}</h3>
        <div className="text-gray-600 text-xs sm:text-sm">{totalText}</div>
        <div className="text-gray-600 text-xs sm:text-sm">{durationText}</div>
      </div>

      <button
        type="button"
        onClick={onManage}
        className={[classes.button.base, classes.button.primary, 'w-[120px] h-[36px] text-sm'].join(' ')}
        aria-label={`${manageLabel} ${title}`}
      >
        {manageLabel}
      </button>
    </div>
  )
}

QuestionSummaryCard.propTypes = {
  title: PropTypes.string.isRequired,
  totalQuestions: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  duration: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  onManage: PropTypes.func,
  className: PropTypes.string,
  manageLabel: PropTypes.string,
  isPublished: PropTypes.bool,
}

export default QuestionSummaryCard
