import React from 'react'
import PropTypes from 'prop-types'
import { Spinner } from '../atoms/Spinner.jsx'

export const LoadingState = ({
  message = 'Loading...',
  size = 'md',
  fullPage = false,
  minHeight = 'min-h-[400px]',
  className = '',
}) => {
  const spinnerSizes = {
    sm: 24,
    md: 40,
    lg: 56,
  }

  const heightClass = fullPage ? 'min-h-screen' : minHeight

  return (
    <div
      className={[
        'flex flex-col items-center justify-center gap-4',
        heightClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Spinner size={spinnerSizes[size] || spinnerSizes.md} />
      {message && (
        <p className="text-sm text-gray-600 font-medium">
          {message}
        </p>
      )}
    </div>
  )
}

LoadingState.propTypes = {
  message: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  fullPage: PropTypes.bool,
  minHeight: PropTypes.string,
  className: PropTypes.string,
}

export default LoadingState
