import React from 'react'
import { classes } from '../../config/theme/tokens.js'

/**
 * Generic confirmation modal with optional countdown display
 * Props:
 * - isOpen: boolean
 * - title: string
 * - message: string
 * - countdown: number | null
 * - actionLabel: string
 * - onConfirm: () => void
 */
const ConfirmModal = ({ isOpen, title, message, countdown = null, actionLabel = 'OK', onConfirm }) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
      <div className={[classes.whiteCard, 'w-full max-w-sm p-6 text-center'].join(' ')}>
        {title ? <div className="text-lg font-semibold text-gray-800">{title}</div> : null}
        {message ? <p className="mt-2 text-gray-600">{message}</p> : null}
        {typeof countdown === 'number' ? (
          <div className="mt-4 text-4xl font-bold text-[#007a33]">{countdown}</div>
        ) : null}
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={onConfirm}
            className={[classes.button.base, classes.button.primary, 'px-6 py-2'].join(' ')}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
