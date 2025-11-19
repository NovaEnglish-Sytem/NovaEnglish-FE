import React from 'react'
import PropTypes from 'prop-types'
import { Button } from '../atoms/Button.jsx'

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'An error occurred while loading data. Please try again.',
  onRetry,
  retryLabel = 'Try Again',
  showIcon = true,
  fullPage = false,
  minHeight = 'min-h-[400px]',
  className = '',
}) => {
  const heightClass = fullPage ? 'min-h-screen' : minHeight

  return (
    <div
      className={[
        'flex flex-col items-center justify-center gap-4 px-4',
        heightClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="alert"
      aria-live="assertive"
    >
      {showIcon && (
        <div className="w-16 h-16 flex items-center justify-center rounded-full bg-red-100">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      )}

      <div className="text-center max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-600">
          {message}
        </p>
      </div>

      {onRetry && (
        <Button
          variant="primary"
          size="md"
          onClick={onRetry}
          className="mt-2"
        >
          {retryLabel}
        </Button>
      )}
    </div>
  )
}

ErrorState.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  onRetry: PropTypes.func,
  retryLabel: PropTypes.string,
  showIcon: PropTypes.bool,
  fullPage: PropTypes.bool,
  minHeight: PropTypes.string,
  className: PropTypes.string,
}

export default ErrorState
