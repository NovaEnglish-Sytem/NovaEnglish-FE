import React from 'react'
import PropTypes from 'prop-types'
import { Modal } from '../atoms/Modal.jsx'
import { Button } from '../atoms/Button.jsx'
import { FiAlertTriangle, FiInfo, FiCheckCircle, FiXCircle, FiExternalLink, FiLogOut, FiTrash2, FiX } from 'react-icons/fi'

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText,
  cancelText = 'Cancel',
  confirmVariant,
  isLoading = false,
  className = '',
}) => {
  // Icon mapping based on type (using react-icons)
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <FiAlertTriangle className="w-6 h-6 text-amber-600" />
      case 'danger':
        return <FiXCircle className="w-6 h-6 text-red-600" />
      case 'delete':
        return <FiTrash2 className="w-6 h-6 text-red-600" />
      case 'success':
        return <FiCheckCircle className="w-6 h-6 text-green-600" />
      case 'external':
        return <FiExternalLink className="w-6 h-6 text-blue-600" />
      case 'logout':
        return <FiLogOut className="w-6 h-6 text-gray-600" />
      default:
        return <FiInfo className="w-6 h-6 text-blue-600" />
    }
  }

  // Default confirm text based on type
  const getDefaultConfirmText = () => {
    switch (type) {
      case 'delete':
        return 'Delete'
      case 'logout':
        return 'Logout'
      case 'external':
        return 'Continue'
      case 'danger':
        return 'Confirm'
      case 'warning':
        return 'Proceed'
      default:
        return 'OK'
    }
  }

  // Default button variant based on type
  const getDefaultVariant = () => {
    switch (type) {
      case 'danger':
      case 'delete':
        return 'danger'
      case 'warning':
        return 'outline'
      default:
        return 'primary'
    }
  }

  // Badge background (circle) color classes based on type (matches app theme tones)
  const getBadgeBg = () => {
    switch (type) {
      case 'warning':
        return 'bg-[#FEF3C7]' // soft amber
      case 'danger':
      case 'delete':
        return 'bg-[#FFECE6]' // soft red-orange
      case 'success':
        return 'bg-[#E6F4E7]' // soft green
      case 'external':
        return 'bg-[#E6F5EC]' // soft brand green tint
      case 'logout':
        return 'bg-[#F3F4F6]' // soft gray
      default:
        return 'bg-[#DBEAFE]' // soft blue
    }
  }

  const finalConfirmText = confirmText || getDefaultConfirmText()
  const finalVariant = confirmVariant || getDefaultVariant()

  const titleId = React.useId()
  const descId = React.useId()

  // Keep body scroll enabled while dialog is open (override Modal's default if any)
  React.useEffect(() => {
    if (isOpen) {
      try { document.body.style.overflow = 'unset' } catch (_) {}
    }
    return () => {
      try { document.body.style.overflow = 'unset' } catch (_) {}
    }
  }, [isOpen])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      backdropClassName="backdrop-blur-none bg-transparent"
      ariaLabelledby={titleId}
      ariaDescribedby={descId}
    >
      {/* Close button (top-right) */}
      <button
        type="button"
        aria-label="Close"
        className="absolute top-3 right-3 p-2 rounded-md hover:bg-[#F5F5F5] text-gray-600"
        onClick={onClose}
      >
        <FiX className="w-5 h-5" aria-hidden="true" />
      </button>

      {/* Card content */}
      <div className={["p-6 text-center", className].filter(Boolean).join(' ')}>
        {/* Icon badge */}
        <div className={[
          'mx-auto w-16 h-16 rounded-full flex items-center justify-center',
          'animate-in zoom-in-90 duration-200',
          getBadgeBg()
        ].join(' ')}>
          {getIcon()}
        </div>

        {/* Title */}
        <h2 id={titleId} className="mt-4 text-xl font-semibold text-gray-900 animate-in fade-in-50 duration-200 delay-75">
          {title}
        </h2>

        {/* Message */}
        <p id={descId} className="mt-2 text-gray-700 leading-relaxed whitespace-pre-line animate-in fade-in-50 duration-200 delay-100">
          {message}
        </p>

        {/* Actions */}
        {cancelText ? (
          <div className="mt-8 flex items-center justify-center gap-3 animate-in fade-in-50 duration-200 delay-150">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              className="min-w-[100px]"
            >
              {cancelText}
            </Button>
            <Button
              variant={finalVariant}
              onClick={onConfirm}
              disabled={isLoading}
              className="min-w-[100px]"
            >
              {isLoading ? 'Loading...' : finalConfirmText}
            </Button>
          </div>
        ) : (
          <div className="mt-8 flex items-center justify-center animate-in fade-in-50 duration-200 delay-150">
            <Button
              variant={finalVariant}
              onClick={onConfirm}
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? 'Loading...' : finalConfirmText}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

ConfirmDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['info', 'warning', 'success', 'danger', 'external', 'logout', 'delete']),
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  confirmVariant: PropTypes.string,
  isLoading: PropTypes.bool,
  className: PropTypes.string,
}

export default ConfirmDialog
