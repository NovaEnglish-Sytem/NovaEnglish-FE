import React, { useState } from 'react'
import { AuthLayout } from '../layouts/AuthLayout.jsx'
import { Card } from '../components/molecules/Card.jsx'
import { Input } from '../components/atoms/Input.jsx'
import { Button } from '../components/atoms/Button.jsx'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../config/routes.js'
import { validateEmail } from '../utils/validators.js'
import { authApi } from '../lib/api.js'
import { AuthModal } from '../components/molecules/AuthModal.jsx'

export const RequestReset = () => {
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pageSending, setPageSending] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState({ title: '', message: '', type: 'info' })

  const navigate = useNavigate()

  const handleBlur = () => {
    const em = validateEmail(email)
    setErrors((prev) => ({ ...prev, email: em.valid ? '' : em.message }))
  }

  const handleSubmit = async (e) => {
    e?.preventDefault?.()
    const em = validateEmail(email)
    const next = {}
    if (!em.valid) next.email = em.message
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setIsSubmitting(true)
    try {
      // Probe only: do not send email yet
      const res = await authApi.resendVerification(email, { body: { probeOnly: true } })
      if (!res.ok) {
        if (res.status === 404) {
          setModalContent({ type: 'error', title: 'Email Not Registered', message: 'We could not find an account with this email address.' })
        } else if (res.status === 429) {
          setModalContent({ type: 'warning', title: 'Too Many Attempts', message: 'You have made several requests in a short time. Please wait a few minutes before trying again.' })
        } else {
          setModalContent({ type: 'error', title: 'Request Failed', message: 'We could not process your request at the moment. Please try again shortly.' })
        }
        setShowModal(true)
        return
      }

      const verified = !!res?.data?.verified
      if (verified) {
        // Already verified → send reset password
        setPageSending(true)
        await authApi.forgotPassword(email)
        setModalContent({
          type: 'success',
          title: 'Reset Link Sent',
          message: 'If your email is registered and verified, you will receive a password reset link shortly. Please check your inbox and also your spam or junk folder.',
        })
        setShowModal(true)
        setPageSending(false)
      } else {
        // Not verified → show verification-required modal (no email sent yet)
        setModalContent({
          type: 'warning',
          title: 'Email Verification Required',
          message: 'Your email address has not been verified yet. Please check your inbox (and your spam or junk folder) for our verification email, then follow the instructions to activate your account.',
        })
        setShowModal(true)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendVerification = async () => {
    setResendLoading(true)
    try {
      const res = await authApi.resendVerification(email)
      if (res.ok) {
        setModalContent({ type: 'success', title: 'Verification Email Sent', message: 'We have sent a verification link to your email address. Please check your inbox and also your spam or junk folder.' })
      } else {
        let message = 'We could not send the verification email at the moment. Please try again shortly.'
        if (res.status === 404) message = 'We could not find an account with this email address.'
        else if (res.status === 429) message = 'You have made several requests in a short time. Please wait a few minutes before trying again.'
        setModalContent({ type: 'error', title: "Unable to Send Verification Email", message })
      }
    } finally {
      setShowModal(true)
      setResendLoading(false)
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
              Forgot Your Password?
            </h1>
            <p className="mt-2 font-normal text-gray-700 text-base text-center leading-normal">
              Please enter your email address to receive a reset link
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <Input
              id="email"
              type="email"
              label="E-mail"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }))
              }}
              onBlur={handleBlur}
              required
              placeholder="Enter your email address"
              error={errors.email}
            />
          </form>

          {/* Actions */}
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
              {pageSending ? 'SENDING...' : 'SEND RESET LINK'}
            </Button>
          </div>
        </Card>
      </div>

      {/* Auth Modal for messages */}
      <AuthModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        type={modalContent.type}
        title={modalContent.title}
        message={modalContent.message}
        primaryVariant={modalContent.type === 'warning' && modalContent.title.includes('Verification') ? 'outline' : undefined}
        primaryClassName={modalContent.type === 'warning' && modalContent.title.includes('Verification') ? 'border-green-600 text-green-600' : undefined}
        secondaryVariant={modalContent.type === 'warning' && modalContent.title.includes('Verification') ? 'primary' : undefined}
        primaryDisabled={modalContent.type === 'warning' && modalContent.title.includes('Verification') ? resendLoading : undefined}
        secondaryDisabled={modalContent.type === 'warning' && modalContent.title.includes('Verification') ? resendLoading : undefined}
        primaryAction={
          modalContent.type === 'warning' && modalContent.title.includes('Verification')
            ? { label: resendLoading ? 'Sending...' : 'Resend Verification', onClick: handleResendVerification }
            : undefined
        }
        secondaryAction={
          modalContent.type === 'warning' && modalContent.title.includes('Verification')
            ? { label: 'Close', onClick: () => setShowModal(false) }
            : undefined
        }
      />
    </AuthLayout>
  )
}

export default RequestReset
