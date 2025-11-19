import React, { useState, useEffect } from 'react'
import { AuthLayout } from '../layouts/AuthLayout.jsx'
import { Card } from '../components/molecules/Card.jsx'
import { PasswordField } from '../components/molecules/PasswordField.jsx'
import { Button } from '../components/atoms/Button.jsx'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ROUTES } from '../config/routes.js'
import { validatePassword, validateConfirmPassword } from '../utils/validators.js'
import { authApi } from '../lib/api.js'
import { AuthModal } from '../components/molecules/AuthModal.jsx'

export const ResetPassword = () => {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState({ title: '', message: '', type: 'info' })
  const [isTokenValid, setIsTokenValid] = useState(true)

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Get token and email from URL (for reset via email link)
  const token = searchParams.get('token')
  const email = searchParams.get('email')
  const mode = searchParams.get('mode') // 'logged-in' for direct password change

  const isResetMode = token && email
  const isLoggedInMode = mode === 'logged-in'

  useEffect(() => {
    // Validate that we have the required parameters for reset mode
    if (!isResetMode && !isLoggedInMode) {
      navigate(ROUTES.accountRequestReset)
      return
    }

    // On reset mode, pre-validate token before rendering form
    const checkToken = async () => {
      if (!isResetMode) return
      const res = await authApi.validateResetToken(token, email)
      if (res.ok) {
        setIsTokenValid(true)
        return
      }
      const status = res.status
      if (status === 410 || status === 404) {
        setIsTokenValid(false)
        setModalContent({
          title: 'Token Expired',
          message: 'This token has expired. Please request a new password reset link.',
          type: 'error'
        })
        setShowModal(true)
      } else {
        setIsTokenValid(false)
        setModalContent({
          title: 'Cannot Reset Password',
          message: 'Something went wrong. Please request a new password reset link.',
          type: 'error'
        })
        setShowModal(true)
      }
    }
    checkToken()
  }, [isResetMode, isLoggedInMode, navigate, token, email])

  const handleBlur = (field) => {
    if (field === 'newPassword') {
      const res = validatePassword(formData.newPassword)
      setErrors((prev) => ({ ...prev, newPassword: res.valid ? '' : res.message }))
    } else if (field === 'confirmPassword') {
      const res = validateConfirmPassword(formData.newPassword, formData.confirmPassword)
      setErrors((prev) => ({ ...prev, confirmPassword: res.valid ? '' : res.message }))
    }
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear existing error while typing; final validation on submit/blur
    setErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev))
  }

  const handleSubmit = async (e) => {
    e?.preventDefault?.()
    const next = {}

    const pwd = validatePassword(formData.newPassword)
    if (!pwd.valid) next.newPassword = pwd.message

    const cpwd = validateConfirmPassword(formData.newPassword, formData.confirmPassword)
    if (!cpwd.valid) next.confirmPassword = cpwd.message

    setErrors(next)
    if (Object.keys(next).length > 0) return

    setIsSubmitting(true)

    try {
      if (isResetMode) {
        const res = await authApi.resetPassword({
          email,
          token,
          newPassword: formData.newPassword
        })
        if (res.ok) {
          setModalContent({
            title: 'Password Reset Successful',
            message: 'Your password has been successfully changed. You can now log in with your new password.',
            type: 'success'
          })
          setShowModal(true)
        } else {
          const status = res.status
          let errorMessage = 'Something went wrong. Please request a new password reset.'
          if (status === 410) {
            errorMessage = 'The reset link has expired. Please request a new password reset.'
          } else if (status === 404) {
            errorMessage = 'The reset link is invalid. Please request a new password reset.'
          }
          setModalContent({
            title: 'Password Reset Failed',
            message: errorMessage,
            type: 'error'
          })
          setShowModal(true)
        }

      } else if (isLoggedInMode) {
        // This mode would require current password - redirect to account settings instead
        navigate(ROUTES.accountSettings)
        return
      }

    } catch (error) {
      let errorMessage = 'Something went wrong. Please try again later.'
      setModalContent({
        title: 'Password Reset Failed',
        message: errorMessage,
        type: 'error'
      })
      setShowModal(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleModalClose = () => {
    setShowModal(false)
    if (modalContent.type === 'success') {
      navigate(ROUTES.login)
    } else if (modalContent.type === 'error') {
      // On invalid/expired token, go back to request page
      navigate(ROUTES.accountRequestReset)
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <AuthLayout>
      <div className="w-full flex justify-center">
        <Card className="w-[546px]">
          {/* Title */}
          <div className="w-full flex flex-col items-center mb-8">
            <h1 className="font-medium text-gray-900 text-xl text-center leading-normal">
              {isResetMode ? 'Reset Your Password' : 'Change Password'}
            </h1>
            <p className="mt-2 font-normal text-gray-700 text-base text-center leading-normal">
              {isResetMode 
                ? 'Enter your new password below'
                : 'Enter your new password'
              }
            </p>
          </div>

          {/* Form (hidden when token invalid/expired) */}
          {(!isResetMode || isTokenValid) && (
          <form onSubmit={handleSubmit} className="flex flex-col">
            <PasswordField
              id="newPassword"
              label="New Password"
              value={formData.newPassword}
              onChange={(e) => handleChange('newPassword', e.target.value)}
              inputProps={{ required: true, onBlur: () => handleBlur('newPassword') }}
              error={errors.newPassword}
            />
            <PasswordField
              id="confirmPassword"
              label="Confirm New Password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              inputProps={{ required: true, onBlur: () => handleBlur('confirmPassword') }}
              error={errors.confirmPassword}
            />
          </form>
          )}

          {/* Actions */}
          {(!isResetMode || isTokenValid) && (
          <div className="mt-2 grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleBack} className="w-full">
              BACK
            </Button>
            <Button 
              type="submit" 
              onClick={handleSubmit} 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'CHANGING...' : 'CHANGE PASSWORD'}
            </Button>
          </div>
          )}
        </Card>
      </div>

      {/* Auth Modal for messages */}
      <AuthModal
        isOpen={showModal}
        onClose={handleModalClose}
        type={modalContent.type}
        title={modalContent.title}
        message={modalContent.message}
        primaryVariant={modalContent.type === 'error' ? 'danger' : undefined}
        primaryAction={{ label: 'OK', onClick: handleModalClose }}
      />
    </AuthLayout>
  )
}
