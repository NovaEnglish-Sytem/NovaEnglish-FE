import React, { useState } from 'react'
import { AuthLayout } from '../layouts/AuthLayout.jsx'
import { Card } from '../components/molecules/Card.jsx'
import { Input } from '../components/atoms/Input.jsx'
import { PasswordField } from '../components/molecules/PasswordField.jsx'
import { Button } from '../components/atoms/Button.jsx'
import { Link, useNavigate } from 'react-router-dom'
import { classes } from '../config/theme/tokens.js'
import { ROUTES } from '../config/routes.js'
import { HiArrowRight } from 'react-icons/hi2'
import { validateEmail, validatePassword } from '../utils/validators.js'
import { authApi } from '../lib/api.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { AuthModal } from '../components/molecules/AuthModal.jsx'
import { LoadingState } from '../components/organisms/LoadingState.jsx'
import { TestStorage } from '../utils/testStorage.js'

export const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [_touched, setTouched] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState({ type: 'info', title: '', message: '' })
  
const { login } = useAuth()
const navigate = useNavigate()

  const handleBlur = (field) => {
    setTouched((t) => ({ ...t, [field]: true }))
    let res = { valid: true }
    if (field === 'email') res = validateEmail(email)
    if (field === 'password') res = validatePassword(password)
    setErrors((prev) => ({ ...prev, [field]: res.valid ? '' : res.message }))
  }

  const handleSubmit = async (e) => {
    e?.preventDefault?.()

    const next = {}
    const em = validateEmail(email)
    if (!em.valid) next.email = em.message

    const pwd = validatePassword(password)
    if (!pwd.valid) next.password = pwd.message

    setErrors(next)
    if (Object.keys(next).length > 0) return

    setIsLoading(true)
    try {
      const response = await authApi.login({ email, password })
      if (!response.ok) {
        const status = response.status
        const code = response.data?.code || response.data?.error
        if (status === 403 && (code === 'EMAIL_NOT_VERIFIED' || code === 'FORBIDDEN')) {
          setModalContent({
            type: 'warning',
            title: 'Email Verification Required',
            message: 'Your email has not been verified. Please check your inbox and verify your account to continue.',
          })
        } else if (status === 401 || status === 400) {
          setModalContent({
            type: 'error',
            title: 'Login Failed',
            message: 'Invalid email or password. Please try again.',
          })
        } else if (status === 429) {
          setModalContent({
            type: 'warning',
            title: 'Too Many Attempts',
            message: 'You have made too many login attempts. Please wait a few minutes before trying again.',
          })
        } else {
          setModalContent({
            type: 'error',
            title: 'Login Error',
            message: 'Something went wrong. Please try again later.',
          })
        }
        setShowModal(true)
        return
      }

      const { user, activeSession, autoSubmitted } = response.data
      
      // Update auth context
      login(user)
      
      // Comprehensive local storage cleanup for Student
      if (user.role === 'STUDENT') {
        try {
          if (activeSession && !activeSession.isExpired) {
            // Keep only the active attempt; clear others and stale data
            TestStorage.validateAndCleanup(activeSession.attemptId)
            TestStorage.clearStaleData(24)
          } else {
            // No active session: clear all test-related data
            TestStorage.clearAllLocal()
          }
        } catch (_) {
          // non-critical
        }
      }

      // Cleanup localStorage for auto-submitted expired sessions
      if (user.role === 'STUDENT' && autoSubmitted?.finalizedAttemptIds?.length > 0) {
        autoSubmitted.finalizedAttemptIds.forEach(attemptId => {
          try {
            TestStorage.clearLocal(attemptId)
            sessionStorage.removeItem('last_valid_attemptId')
          } catch (e) {
            // Silent fail on cleanup
          }
        })
      }
      
      // Check for active test session (student only)
      if (user.role === 'STUDENT' && activeSession && !activeSession.isExpired) {
        // Redirect directly to active test
        navigate(ROUTES.studentTest.replace(':attemptId', activeSession.attemptId), { replace: true })
        return
      }
      
      // Redirect based on role
      if (user.role === 'STUDENT') {
        navigate(ROUTES.studentDashboard, { replace: true })
      } else if (user.role === 'TUTOR') {
        navigate(ROUTES.tutorDashboard, { replace: true })
      } else if (user.role === 'ADMIN') {
        navigate(ROUTES.adminDashboard, { replace: true })
      } else {
        navigate(ROUTES.studentDashboard, { replace: true })
      }
      
    } catch (_) {
      setModalContent({
        type: 'error',
        title: 'Login Error',
        message: 'Something went wrong. Please try again later.',
      })
      setShowModal(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleModalClose = () => {
    setShowModal(false)
  }

  const handleResendVerification = async () => {
    setResendLoading(true)
    try {
      const res = await authApi.resendVerification(email)
      if (!res.ok) {
        if (res.status === 429) {
          setModalContent({ type: 'warning', title: 'Too Many Attempts', message: 'You have requested too many verification emails. Please wait a few minutes before trying again.' })
        } else {
          setModalContent({ type: 'error', title: 'Resend Failed', message: 'Failed to resend verification email. Please try again later.' })
        }
      } else {
        setModalContent({ type: 'success', title: 'Verification Email Sent', message: 'A new verification link has been sent to your email. Please check your inbox.' })
      }
    } finally {
      setResendLoading(false)
    }
  }


  return (
    <AuthLayout>
      {isLoading ? (
        <div className="fixed inset-0 z-50 bg-white/70 backdrop-blur-sm">
          <LoadingState message="Signing in..." size="md" fullPage />
        </div>
      ) : null}
      <div className="w-full flex justify-center">
        <Card className="w-[556px]">
          {/* Title */}
          <div className="w-full flex flex-col items-center mb-8">
            <h1 className="font-medium text-gray-900 text-xl text-center leading-normal">
              Level Up Your English
            </h1>
            <p className="mt-2 font-normal text-gray-700 text-base text-center leading-normal">
              Sign in to start your journey
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col">
            <Input
              id="email"
              type="email"
              label="E-mail"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }))
              }}
              onBlur={() => handleBlur('email')}
              autoComplete="email"
              placeholder=""
              error={errors.email}
              disabled={isLoading}
            />

            <PasswordField
              id="password"
              label="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errors.password) setErrors((prev) => ({ ...prev, password: '' }))
              }}
              inputProps={{ 
                autoComplete: 'current-password', 
                onBlur: () => handleBlur('password'),
                disabled: isLoading
              }}
              error={errors.password}
            />
          </form>

          {/* Forgot password */}
          <div className="w-full flex justify-end">
            <Link
              to={ROUTES.accountRequestReset}
              className={'underline text-sm text-[#0D7377] hover:text-[#0A4F52]'}
            >
              Forgot Password?
            </Link>
          </div>

          {/* Actions */}
          <div className="mt-3 space-y-6">
            <Button 
              type="submit" 
              onClick={handleSubmit} 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'SIGNING IN...' : 'LOGIN'}
            </Button>
            <Link
              to={ROUTES.register}
              className={['flex items-center justify-center gap-2', classes.linkHoverSuccess, 'text-base text-[#007a33]'].join(' ')}
            >
              Don&apos;t have an account? Please sign up
              <HiArrowRight className="w-4 h-4 text-current" aria-hidden="true" />
            </Link>
          </div>
        </Card>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showModal}
        onClose={handleModalClose}
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
            : { label: 'OK', onClick: handleModalClose }
        }
        secondaryAction={
          modalContent.type === 'warning' && modalContent.title.includes('Verification')
            ? { label: 'Close', onClick: handleModalClose }
            : null
        }
      />
    </AuthLayout>
  )
}
