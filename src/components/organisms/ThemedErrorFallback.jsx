import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { classes } from '../../config/theme/tokens.js'
import { Button } from '../atoms/Button.jsx'
import { HiOutlineExclamationTriangle, HiOutlineChevronDown, HiOutlineChevronUp } from 'react-icons/hi2'

export default function ThemedErrorFallback({ error, onRetry }) {
  const [showDetails, setShowDetails] = useState(false)
  const isDev = Boolean(import.meta?.env?.DEV)

  const handleReload = () => {
    try {
      window.location.reload()
    } catch (e) {
      // noop
    }
  }

  const title = 'Something went wrong'
  const subtitle = 'An unexpected error occurred. You can try again or reload the page.'

  return (
    <div className="w-full min-h-screen grid place-items-center px-4 py-8">
      <div className={[classes.surfaceCard, 'w-full max-w-[560px] mx-auto p-6 sm:p-8 text-center'].join(' ')}>
        <div className="mx-auto w-16 h-16 rounded-full bg-[#FEE2E2] flex items-center justify-center">
          <HiOutlineExclamationTriangle className="w-9 h-9 text-[#D14343]" aria-hidden="true" />
        </div>

        <h1 className="mt-4 text-xl sm:text-2xl font-semibold text-gray-900">{title}</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600 mb-10">{subtitle}</p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-center">
          <Button variant="outline" onClick={handleReload} className="sm:w-auto w-full">
            Reload Page
          </Button>
          {typeof onRetry === 'function' && (
            <Button onClick={() => onRetry()} className="sm:w-auto w-full">
              Try Again
            </Button>
          )}
        </div>

        {isDev && error ? (
          <div className="mt-6 text-left">
            <button
              type="button"
              onClick={() => setShowDetails((s) => !s)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-gray-200 hover:bg-[#F8F8F8] transition"
            >
              <span className="text-sm font-medium text-gray-700">Technical details (DEV)</span>
              {showDetails ? (
                <HiOutlineChevronUp className="w-5 h-5 text-gray-600" aria-hidden="true" />
              ) : (
                <HiOutlineChevronDown className="w-5 h-5 text-gray-600" aria-hidden="true" />
              )}
            </button>
            {showDetails && (
              <div className="mt-2 max-h-64 overflow-auto rounded-md border border-gray-200 bg-white p-3">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                  {String(error?.message || 'Unknown error')}
                  {'\n\n'}
                  {String(error?.stack || '')}
                </pre>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

ThemedErrorFallback.propTypes = {
  error: PropTypes.any,
  onRetry: PropTypes.func,
}
