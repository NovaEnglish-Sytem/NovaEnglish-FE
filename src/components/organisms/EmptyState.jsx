import React from 'react'
import PropTypes from 'prop-types'
import { Button } from '../atoms/Button.jsx'

export const EmptyState = ({
  title = 'No data available',
  message = 'There is nothing to display at the moment.',
  icon = '📭',
  actionLabel,
  onAction,
  actionVariant = 'primary',
  fullPage = false,
  minHeight = 'min-h-[300px]',
  className = '',
}) => {
  const heightClass = fullPage ? 'min-h-screen' : minHeight

  const renderIcon = () => {
    if (typeof icon === 'string') {
      return (
        <div className="text-6xl mb-4" aria-hidden="true">
          {icon}
        </div>
      )
    }
    return <div className="mb-4">{icon}</div>
  }

  return (
    <div
      className={[
        'flex flex-col items-center justify-center gap-2 px-4',
        heightClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-live="polite"
    >
      {icon && renderIcon()}

      <div className="text-center max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-600">
          {message}
        </p>
      </div>

      {actionLabel && onAction && (
        <Button
          variant={actionVariant}
          size="md"
          onClick={onAction}
          className="mt-4"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

EmptyState.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  icon: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
  actionVariant: PropTypes.string,
  fullPage: PropTypes.bool,
  minHeight: PropTypes.string,
  className: PropTypes.string,
}

export default EmptyState
