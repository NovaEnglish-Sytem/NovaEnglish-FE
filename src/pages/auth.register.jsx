import React, { useState } from 'react'
import DatePickerField from '../components/atoms/DatePickerField.jsx'
import { AuthLayout } from '../layouts/AuthLayout.jsx'
import { Card } from '../components/molecules/Card.jsx'
import { Input } from '../components/atoms/Input.jsx'
import { PhoneNumberInput } from '../components/molecules/PhoneNumberInput.jsx'
import GenderSelect from '../components/molecules/GenderSelect.jsx'
import { PasswordField } from '../components/molecules/PasswordField.jsx'
import { Checkbox } from '../components/atoms/Checkbox.jsx'
import { Button } from '../components/atoms/Button.jsx'
import { Link, useNavigate } from 'react-router-dom'
// import { classes } from '../config/theme/tokens.js'
import { ROUTES } from '../config/routes.js'
import { validateFullName, validateEmail, validatePassword, validateConfirmPassword, validatePhone, formatPhoneE164, toTitleCase } from '../utils/validators.js'
import { authApi } from '../lib/api.js'
import { AuthModal } from '../components/molecules/AuthModal.jsx'
import ConfirmDialog from '../components/molecules/ConfirmDialog.jsx'

export const Register = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    placeOfBirth: '',
    dateOfBirth: '',
    gender: '',
  })
  const [country, setCountry] = useState({ code: 'ID', dial_code: '+62', name: 'Indonesia' })
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState({ title: '', message: '', type: 'success' })
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [validationMessage, setValidationMessage] = useState('')

  // Date picker: allow all years up to current year; block future dates visually

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Behavior B: clear the error while user is typing; re-validate on blur/submit only
    setErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev))
  }

  const handleBlur = (field) => {
    setTouched((t) => ({ ...t, [field]: true }))
    let res = { valid: true }
    switch (field) {
      case 'fullName':
        res = validateFullName(formData.fullName)
        break
      case 'email':
        res = validateEmail(formData.email)
        break
      case 'phoneNumber':
        res = validatePhone(formData.phoneNumber, country.code)
        break
      case 'password':
        res = validatePassword(formData.password)
        break
      case 'confirmPassword':
        res = validateConfirmPassword(formData.password, formData.confirmPassword)
        break
      case 'placeOfBirth': {
        const v = String(formData.placeOfBirth || '').trim()
        if (!v) res = { valid: false, message: 'Place of Birth is required.' }
        else if (v.length < 3) res = { valid: false, message: 'Place of Birth must be at least 3 characters.' }
        break
      }
      case 'dateOfBirth': {
        const v = formData.dateOfBirth
        if (!v) res = { valid: false, message: 'Date of Birth is required.' }
        else {
          const dob = new Date(v)
          const min = new Date(); min.setFullYear(min.getFullYear() - 5)
          if (dob > min) res = { valid: false, message: 'Minimum age is 5 years.' }
        }
        break
      }
      case 'gender': {
        const g = String(formData.gender || '').toUpperCase()
        if (!g) res = { valid: false, message: 'Gender is required.' }
        else if (!['MALE','FEMALE'].includes(g)) res = { valid: false, message: 'Please select gender.' }
        break
      }
      default:
        break
    }
    setErrors((prev) => ({ ...prev, [field]: res.valid ? '' : res.message }))
  }

  const handleCountryChange = (c) => {
    setCountry(c)
    if (touched?.phoneNumber) {
      const ph = validatePhone(formData.phoneNumber, c.code)
      setErrors((prev) => ({ ...prev, phoneNumber: ph.valid ? '' : ph.message }))
    }
  }

  const handleSubmit = async (e) => {
    e?.preventDefault?.()

    const nextErrors = {}

    const fName = validateFullName(formData.fullName)
    if (!fName.valid) nextErrors.fullName = fName.message

    // no nickname

    const mail = validateEmail(formData.email)
    if (!mail.valid) nextErrors.email = mail.message

    const ph = validatePhone(formData.phoneNumber, country.code)
    if (!ph.valid) nextErrors.phoneNumber = ph.message

    const pwd = validatePassword(formData.password)
    if (!pwd.valid) nextErrors.password = pwd.message

    const cpwd = validateConfirmPassword(formData.password, formData.confirmPassword)
    if (!cpwd.valid) nextErrors.confirmPassword = cpwd.message

    // Place of birth required min 3
    const pobTrimmed = String(formData.placeOfBirth || '').trim()
    if (!pobTrimmed) {
      nextErrors.placeOfBirth = 'Place of Birth is required.'
    } else if (pobTrimmed.length < 3) {
      nextErrors.placeOfBirth = 'Place of Birth must be at least 3 characters.'
    }

    // Date of birth required and must be at least 5 years ago
    if (!formData.dateOfBirth) {
      nextErrors.dateOfBirth = 'Date of Birth is required.'
    } else {
      const dob = new Date(formData.dateOfBirth)
      const min = new Date()
      min.setFullYear(min.getFullYear() - 5)
      if (dob > min) {
        nextErrors.dateOfBirth = 'Minimum age is 5 years.'
      }
    }

    // Gender required
    if (!formData.gender || !['MALE', 'FEMALE'].includes(String(formData.gender).toUpperCase())) {
      nextErrors.gender = 'Please select gender.'
    }

    if (!agreeToTerms) {
      nextErrors.agreeToTerms = 'You must agree to the Terms & Privacy Policy.'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      // Show validation warning modal
      setValidationMessage('Some fields are incomplete or invalid. Please check all required fields and try again.')
      setShowValidationModal(true)
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare payload for backend (phone in E.164)
      const payload = {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phoneE164: formatPhoneE164(formData.phoneNumber, country.code),
        role: 'STUDENT', // Default role
        placeOfBirth: formData.placeOfBirth,
        dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
        gender: String(formData.gender).toUpperCase(),
      }

      const res = await authApi.register(payload)

      if (!res.ok) {
        let title = "Can't sign up"
        let message = 'Something went wrong. Please try again.'
        const status = res.status
        const msg = String(res.error || '').toLowerCase()

        if (status === 409) {
          message = 'This email is already registered. Use a different email or try logging in.'
        } else if (status === 400) {
          if (msg.includes('invalid email domain')) {
            message = 'That email domain looks invalid. Please use a valid email address.'
          } else if (msg.includes('no mx records')) {
            message = "We can't reach that email's domain. Please use a different email."
          } else if (msg.includes('mx lookup failed')) {
            message = "We couldn't verify your email right now. Try a different email or try again later."
          } else {
            message = 'Please check your details and try again.'
          }
        }

        setModalContent({
          title,
          message,
          type: 'error'
        })
        setShowModal(true)
        return
      }

      const emailSent = res?.data?.emailSent

      if (emailSent === false) {
        setModalContent({
          title: 'Account created, but email not sent',
          message: 'Your account has been created, but we could not send the verification email right now. Please try again later or contact support if you still do not receive it.',
          type: 'warning'
        })
      } else {
        // Default: treat missing flag as sent, for backward compatibility
        setModalContent({
          title: "You're almost there!",
          message: 'Your account has been created. Please check your inbox for our verification email, then return here to sign in.',
          type: 'success'
        })
      }
      setShowModal(true)

    } finally {
      setIsSubmitting(false)
    }
  }

  const handleModalClose = () => {
    setShowModal(false)
    if (modalContent.type === 'success') {
      // Redirect to login (no additional modal/notice)
      navigate(ROUTES.login)
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <AuthLayout>
      <div className="w-full flex justify-center my-10">
        <Card className="w-[546px]">
          {/* Title */}
          <div className="w-full flex flex-col items-center mb-8">
            <h1 className="font-medium text-gray-900 text-xl text-center leading-normal">
              Level Up Your English
            </h1>
            <p className="mt-2 font-normal text-gray-700 text-base text-center leading-normal">
              Join now to start your journey
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col">
            <Input
              id="fullName"
              label="Full Name"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', toTitleCase(e.target.value))}
              onBlur={() => handleBlur('fullName')}
              error={errors.fullName}
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                id="placeOfBirth"
                label="Place of Birth"
                value={formData.placeOfBirth}
                onChange={(e) => handleInputChange('placeOfBirth', toTitleCase(e.target.value))}
                onBlur={() => handleBlur('placeOfBirth')}
                error={errors.placeOfBirth}
                required
              />
              <DatePickerField
                id="dateOfBirth"
                label="Date of Birth"
                value={formData.dateOfBirth}
                onChange={(v) => {
                  handleInputChange('dateOfBirth', v)
                  if (v) {
                    const dob = new Date(v)
                    const min = new Date(); min.setFullYear(min.getFullYear() - 5)
                    setErrors((prev) => ({ ...prev, dateOfBirth: dob > min ? 'Minimum age is 5 years.' : '' }))
                  } else {
                    setErrors((prev) => ({ ...prev, dateOfBirth: 'Date of Birth is required.' }))
                  }
                }}
                onBlur={() => handleBlur('dateOfBirth')}
                error={errors.dateOfBirth}
                helperText={errors.dateOfBirth || ''}
              />
            </div>
            <GenderSelect
              id="gender"
              value={formData.gender}
              onChange={(val) => handleInputChange('gender', val)}
              onBlur={() => handleBlur('gender')}
              error={errors.gender}
              required
            />
            <Input
              id="email"
              type="email"
              label="E-mail"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              error={errors.email}
              required
            />
            <PhoneNumberInput
              id="phoneNumber"
              label="Phone Number"
              phoneValue={formData.phoneNumber}
              onPhoneChange={(val) => handleInputChange('phoneNumber', val)}
              countryCode={country.code}
              onCountryChange={handleCountryChange}
              onPhoneBlur={() => handleBlur('phoneNumber')}
              error={errors.phoneNumber}
              required
            />
            <div className="grid grid-row-2 sm:grid-cols-2 gap-3">
              <PasswordField
                id="password"
                label="Password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                error={errors.password}
                inputProps={{ onBlur: () => handleBlur('password') }}
              />
              <PasswordField
                id="confirmPassword"
                label="Confirm Password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                error={errors.confirmPassword}
                inputProps={{ onBlur: () => handleBlur('confirmPassword') }}
              />
            </div>
          </form>

          {/* Terms */}
          <Checkbox
            variant="checklist"
            id="agree"
            checked={agreeToTerms}
            onChange={(e) => setAgreeToTerms(e.target.checked)}
            error={errors.agreeToTerms}
            label={
              <span className='text-gray-700'>
                I agree to the{' '}
                <Link
                  to={ROUTES.terms}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={'underline text-[#0D7377] hover:text-[#0A4F52]'}
                >
                  Terms &amp; Conditions
                </Link>
                {' '}and{' '}
                <Link
                  to={ROUTES.privacyPolicy}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={'underline text-[#0D7377] hover:text-[#0A4F52]'}
                >
                  Privacy Policy
                </Link>
              </span>
            }
          />

          {/* Actions */}
          <div className="space-y-4 mt-2">
            <Button 
              type="submit" 
              onClick={handleSubmit} 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'SIGNING UP...' : 'SIGN UP'}
            </Button>

            <Button variant="outline" onClick={handleBack} className="w-full">
              BACK
            </Button>
          </div>
        </Card>
      </div>

      {/* Auth Modal for success/error messages */}
      <AuthModal
        isOpen={showModal}
        onClose={handleModalClose}
        type={modalContent.type}
        title={modalContent.title}
        message={modalContent.message}
      />

      {/* Validation warning modal */}
      <ConfirmDialog
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        onConfirm={() => setShowValidationModal(false)}
        title="Incomplete or Invalid Data"
        message={validationMessage}
        type="warning"
        confirmText="OK"
        cancelText={null}
      />
    </AuthLayout>
  )
}