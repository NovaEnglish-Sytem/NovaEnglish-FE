import React from 'react'
import { Modal } from '../atoms/Modal.jsx'
import { Button } from '../atoms/Button.jsx'
import { HiExclamationTriangle, HiCheckCircle, HiInformationCircle, HiXCircle } from 'react-icons/hi2'
import { FiX } from 'react-icons/fi'

export const AuthModal = ({ 
  isOpen, 
  onClose, 
  type = 'info', 
  title, 
  message, 
  primaryAction,
  secondaryAction,
  primaryVariant,
  primaryClassName,
  secondaryVariant,
  secondaryClassName,
  primaryDisabled,
  secondaryDisabled,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <HiCheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
      case 'error':
        return <HiXCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      case 'warning':
        return <HiExclamationTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
      default:
        return <HiInformationCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
    }
  }

  const getTitle = () => {
    if (title) return title
    
    switch (type) {
      case 'success':
        return 'Success'
      case 'error':
        return 'Authentication Error'
      case 'warning':
        return 'Action Required'
      default:
        return 'Information'
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="sm"
      lockScroll={false}
    >
      <div className="text-center p-6 relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 p-2 rounded-md hover:bg-[#F5F5F5] text-gray-600"
        >
          <FiX className="w-5 h-5" aria-hidden="true" />
        </button>
        {getIcon()}
        
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {getTitle()}
        </h3>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          {message}
        </p>
        
        <div className="flex justify-center gap-3">
          {secondaryAction && (
            <Button
              variant={secondaryVariant || 'outline'}
              onClick={secondaryAction.onClick}
              className={secondaryClassName}
              disabled={!!secondaryDisabled}
            >
              {secondaryAction.label}
            </Button>
          )}
          <Button
            variant={primaryVariant || (type === 'error' ? 'danger' : 'primary')}
            onClick={primaryAction?.onClick || onClose}
            className={primaryClassName}
            disabled={!!primaryDisabled}
          >
            {primaryAction?.label || 'OK'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default AuthModal
