import React, { useState, useEffect, useCallback } from 'react'
import { AuthLayout } from '../layouts/AuthLayout.jsx'
import { Card } from '../components/molecules/Card.jsx'
import LoadingState from '../components/organisms/LoadingState.jsx'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ROUTES } from '../config/routes.js'
import { authApi } from '../lib/api.js'
import { AuthModal } from '../components/molecules/AuthModal.jsx'

export const VerifyEmailPage = () => {
  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState({ title: '', message: '', type: 'info' })
  const [isVerifying, setIsVerifying] = useState(false)
  
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Email verification via token (from URL)
  const token = searchParams.get('token')
  const emailFromUrl = searchParams.get('email')
  const isVerificationMode = token && emailFromUrl

  const handleEmailVerification = useCallback(async () => {
    setIsVerifying(true)
    try {
      const res = await authApi.verifyEmail(token, emailFromUrl)
      if (res.ok) {
        setModalContent({ title: 'Email verified', message: 'Your email is verified. You can now sign in.', type: 'success' })
      } else {
        let message = 'Something went wrong. Please try again.'
        if (res.status === 410) message = 'This link has expired. Please request a new one.'
        else if (res.status === 404) message = 'This link is invalid. Please request a new one.'
        setModalContent({ title: "Can't verify", message, type: 'error' })
      }
      setShowModal(true)
    } finally {
      setIsVerifying(false)
    }
  }, [token, emailFromUrl])

  useEffect(() => {
    // Auto-verify if token and email are present
    if (isVerificationMode) {
      handleEmailVerification()
    }
  }, [isVerificationMode, token, emailFromUrl, handleEmailVerification])

  // Protect this route: if no token/email, redirect to login
  useEffect(() => {
    if (!isVerificationMode) {
      navigate(ROUTES.login, { replace: true })
    }
  }, [isVerificationMode])

  

  // No form or resend actions here; this page is for token verification only

  const handleModalClose = () => {
    setShowModal(false)
    // After any verification modal, redirect to login
    navigate(ROUTES.login)
  }

  

  // Show verification in progress
  if (isVerifying) {
    return (
      <AuthLayout>
        <LoadingState 
          message="Verifying your email address..." 
          fullPage 
        />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="w-full flex justify-center">
        <Card className="w-[546px]">
          <div className="w-full flex flex-col items-center mb-8">
            <h1 className="font-medium text-gray-900 text-xl text-center leading-normal">Email Verification</h1>
            <p className="mt-2 font-normal text-gray-700 text-base text-center leading-normal">
              We are processing your email verification...
            </p>
          </div>
        </Card>
      </div>

      {/* Auth Modal for messages */}
      <AuthModal
        isOpen={showModal}
        onClose={handleModalClose}
        type={modalContent.type}
        title={modalContent.title}
        message={modalContent.message}
      />
    </AuthLayout>
  )
}
