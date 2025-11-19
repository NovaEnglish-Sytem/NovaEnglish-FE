import React, { useState, useEffect, useCallback } from 'react'
import { AuthLayout } from '../layouts/AuthLayout.jsx'
import { Card } from '../components/molecules/Card.jsx'
import { Input } from '../components/atoms/Input.jsx'
import { PhoneNumberInput } from '../components/molecules/PhoneNumberInput.jsx'
import DatePickerField from '../components/atoms/DatePickerField.jsx'
import GenderSelect from '../components/molecules/GenderSelect.jsx'
import { Button } from '../components/atoms/Button.jsx'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../config/routes.js'
import { validateFullName, validatePhone, formatPhoneE164, toTitleCase } from '../utils/validators.js'
import { accountApi } from '../lib/api.js'
import CountryCodeSelect from '../components/molecules/CountryCodeSelect.jsx'
import LoadingState from '../components/organisms/LoadingState.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { AuthModal } from '../components/molecules/AuthModal.jsx'
import ConfirmDialog from '../components/molecules/ConfirmDialog.jsx'

const getErrorMessage = (error) => {
  return error?.response?.data?.error || error?.message || 'An error occurred'
}

export default function AccountSettings() {
  const { user, refreshUser, logout } = useAuth()
  const navigate = useNavigate()
  
  const [initialData, setInitialData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    placeOfBirth: '',
    dateOfBirth: '',
    gender: '',
  })
  const [formData, setFormData] = useState(initialData)
  const [country, setCountry] = useState({ code: 'ID', dial_code: '+62', name: 'Indonesia' })
  const [isEditing, setIsEditing] = useState(false)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState({ title: '', message: '', type: 'info' })
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  // removed unused meta state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirmSave, setShowConfirmSave] = useState(false)
  const [afterDeleteNavigate, setAfterDeleteNavigate] = useState(false)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [validationMessage, setValidationMessage] = useState('')

  // Load user profile on mount
  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = useCallback(async () => {
    try {
      // Try to get fresh user data
      const updatedUser = await refreshUser()
      
      const userData = {
        fullName: updatedUser.fullName || '',
        phoneNumber: updatedUser.phoneE164 || '',
        email: updatedUser.email || '',
        placeOfBirth: updatedUser.placeOfBirth || '',
        dateOfBirth: updatedUser.dateOfBirth ? String(updatedUser.dateOfBirth).slice(0,10) : '',
        gender: updatedUser.gender || '',
      }
      
        setInitialData(userData)
        setFormData(userData)
    } catch (error) {
      
      
      // If we have user from context, use that as fallback
      if (user) {
        const userData = {
          fullName: user.fullName || '',
          phoneNumber: user.phoneE164 || '',
          email: user.email || '',
          placeOfBirth: user.placeOfBirth || '',
          dateOfBirth: user.dateOfBirth ? String(user.dateOfBirth).slice(0,10) : '',
          gender: user.gender || '',
        }
        setInitialData(userData)
        setFormData(userData)
      } else {
        setModalContent({
          title: 'Profile Loading Error',
          message: 'We couldn\'t load your profile information. Please refresh the page and try again.',
          type: 'error'
        })
        setShowModal(true)
      }
    } finally {
      setIsLoading(false)
    }
  }, [refreshUser, user])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Clear existing error while typing; final validation on submit/blur
    setErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev))
  }

  const handleBlur = (field) => {
    if (!isEditing) return

    let res = { valid: true, message: '' }
    switch (field) {
      case 'fullName':
        res = validateFullName(formData.fullName)
        break
      case 'phoneNumber':
        res = validatePhone(formData.phoneNumber, country.code)
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
        if (!g) res = { valid: false, message: 'Please select gender.' }
        else if (!['MALE','FEMALE'].includes(g)) res = { valid: false, message: 'Please select gender.' }
        break
      }
      default:
        break
    }

    setErrors((prev) => ({ ...prev, [field]: res.valid ? '' : res.message }))
  }

  const handleSaveChanges = async () => {
    if (!isEditing) return

    const nextErrors = {}

    const fName = validateFullName(formData.fullName)
    if (!fName.valid) nextErrors.fullName = fName.message

    // no nickname

    const ph = validatePhone(formData.phoneNumber, country.code)
    if (!ph.valid) nextErrors.phoneNumber = ph.message

    // Validate additional fields like Register
    // Place of birth: empty => required; 1-2 chars => min length
    {
      const t = String(formData.placeOfBirth || '').trim()
      if (!t) {
        nextErrors.placeOfBirth = 'Place of Birth is required.'
      } else if (t.length < 3) {
        nextErrors.placeOfBirth = 'Place of Birth must be at least 3 characters.'
      }
    }
    // Date of birth required and must be at least 5 years ago
    if (!formData.dateOfBirth) {
      nextErrors.dateOfBirth = 'Date of Birth is required.'
    } else {
      const dob = new Date(formData.dateOfBirth)
      const min = new Date(); min.setFullYear(min.getFullYear() - 5)
      if (dob > min) {
        nextErrors.dateOfBirth = 'Minimum age is 5 years.'
      }
    }
    // Gender required and valid
    if (!formData.gender || !['MALE', 'FEMALE'].includes(String(formData.gender).toUpperCase())) {
      nextErrors.gender = 'Please select gender.'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    // Close confirm modal if open (when invoked from it)
    setShowConfirmSave(false)
    setIsSaving(true)
    try {
      // Only send fields that backend supports
      const payload = {
        fullName: formData.fullName,
        phoneE164: formatPhoneE164(formData.phoneNumber, country.code) || null,
        placeOfBirth: formData.placeOfBirth || null,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
        gender: formData.gender ? String(formData.gender).toUpperCase() : null,
      }

      const response = await accountApi.updateProfile(payload)
      const { user: updatedUser } = response.data
      
      // Refresh user in auth context
      await refreshUser()
      
      // Update local state with response
      const updatedData = {
        fullName: updatedUser.fullName || '',
        phoneNumber: updatedUser.phoneE164 || '',
        email: updatedUser.email || '',
        placeOfBirth: updatedUser.placeOfBirth || '',
        dateOfBirth: updatedUser.dateOfBirth ? String(updatedUser.dateOfBirth).slice(0,10) : '',
        gender: updatedUser.gender || '',
      }
      
      setInitialData(updatedData)
      setFormData(updatedData)
      setIsEditing(false)
      
      setModalContent({
        title: 'Profile Updated',
        message: 'Your profile information has been successfully updated.',
        type: 'success'
      })
      setShowModal(true)
      
    } catch (error) {
      
      
      setModalContent({
        title: 'Update Failed',
        message: getErrorMessage(error) || 'Failed to update your profile. Please try again.',
        type: 'error'
      })
      setShowModal(true)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveClick = () => {
    if (!isEditing) return

    const nextErrors = {}

    const fName = validateFullName(formData.fullName)
    if (!fName.valid) nextErrors.fullName = fName.message

    const ph = validatePhone(formData.phoneNumber, country.code)
    if (!ph.valid) nextErrors.phoneNumber = ph.message

    {
      const t = String(formData.placeOfBirth || '').trim()
      if (!t) {
        nextErrors.placeOfBirth = 'Place of Birth is required.'
      } else if (t.length < 3) {
        nextErrors.placeOfBirth = 'Place of Birth must be at least 3 characters.'
      }
    }

    if (!formData.dateOfBirth) {
      nextErrors.dateOfBirth = 'Date of Birth is required.'
    } else {
      const dob = new Date(formData.dateOfBirth)
      const min = new Date(); min.setFullYear(min.getFullYear() - 5)
      if (dob > min) nextErrors.dateOfBirth = 'Minimum age is 5 years.'
    }

    if (!formData.gender || !['MALE', 'FEMALE'].includes(String(formData.gender).toUpperCase())) {
      nextErrors.gender = 'Please select gender.'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      // Show validation warning modal
      setValidationMessage('Some fields are incomplete or invalid. Please check all required fields and try again.')
      setShowValidationModal(true)
      return
    }

    // Open confirmation modal
    setShowConfirmSave(true)
  }

  const handleCancel = () => {
    setShowConfirmSave(false)
    setFormData(initialData)
    setErrors({})
    setIsEditing(false)
  }

  const handleModalClose = async () => {
    setShowModal(false)
    if (afterDeleteNavigate) {
      setAfterDeleteNavigate(false)
      try { await logout() } catch (_) {}
      navigate(ROUTES.login, { replace: true })
    }
  }

  const handleChangePassword = () => {
    setShowPasswordModal(true)
  }

  const handleGoToChangePassword = () => {
    setShowPasswordModal(false)
    navigate(ROUTES.accountRequestReset)
  }

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      await accountApi.delete()
      // Show success modal first on the same page, then navigate to login when closed
      setShowDeleteConfirm(false)
      setModalContent({
        title: 'Account Deleted',
        message: 'Your account has been deleted. You have been logged out.',
        type: 'success'
      })
      setShowModal(true)
      setAfterDeleteNavigate(true)
    } catch (error) {
      
      setShowDeleteConfirm(false)
      setModalContent({
        title: 'Deletion Failed',
        message: getErrorMessage(error) || 'Failed to delete your account. Please try again.',
        type: 'error'
      })
      setShowModal(true)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleExitSettings = () => {
    setShowConfirmSave(false)
    navigate(-1)
  }

  if (isLoading) {
    return (
      <AuthLayout>
        <LoadingState message="Loading profile..." minHeight="min-h-[calc(100vh-100px)]" />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="w-full flex justify-center my-10">
        <Card className="w-full max-w-[556px] mx-4 sm:mx-0 rounded-[20px] shadow-[4px_6px_4px_#e0e0e00d]">
          {/* Title */}
          <div className="w-full flex justify-center mb-4 sm:mb-6">
            <h1 className="font-medium text-gray-900 text-lg sm:text-xl text-center leading-normal">
              Account Settings
            </h1>
          </div>

          {/* Form-like bordered container */}
          <div className="w-full rounded-md border border-gray-400 p-3 sm:p-4">
            <div className="space-y-4 sm:space-y-0">
              <Input
                id="fullName"
                label="Full Name"
                value={formData.fullName}
                onChange={(e) => {
                  const titleCased = toTitleCase(e.target.value)
                  handleInputChange('fullName', titleCased)
                }}
                onBlur={() => handleBlur('fullName')}
                error={errors.fullName}
                disabled={!isEditing}
                inputClassName={[!isEditing ? 'bg-[#e7e7e7b2] text-gray-500' : '', 'h-11 sm:h-12'].filter(Boolean).join(' ')}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  id="placeOfBirth"
                  label="Place of Birth"
                  value={formData.placeOfBirth}
                  onChange={(e) => {
                    const titleCased = toTitleCase(e.target.value)
                    handleInputChange('placeOfBirth', titleCased)
                    if (isEditing) {
                      const t = String(titleCased || '').trim()
                      setErrors((prev) => ({
                        ...prev,
                        placeOfBirth: !t ? 'Place of Birth is required.' : (t.length < 3 ? 'Place of Birth must be at least 3 characters.' : '')
                      }))
                    }
                  }}
                  onBlur={() => handleBlur('placeOfBirth')}
                  error={errors.placeOfBirth}
                  disabled={!isEditing}
                  inputClassName={[!isEditing ? 'bg-[#e7e7e7b2] text-gray-500' : '', 'h-11 sm:h-12'].filter(Boolean).join(' ')}
                />
                <DatePickerField
                  id="dateOfBirth"
                  label="Date of Birth"
                  value={formData.dateOfBirth}
                  onChange={(v) => {
                    handleInputChange('dateOfBirth', v)
                    if (isEditing) {
                      if (v) {
                        const dob = new Date(v)
                        const min = new Date(); min.setFullYear(min.getFullYear() - 5)
                        setErrors((prev) => ({ ...prev, dateOfBirth: dob > min ? 'Minimum age is 5 years.' : '' }))
                      } else {
                        // keep clean while typing; validate on blur
                        setErrors((prev) => ({ ...prev, dateOfBirth: '' }))
                      }
                    }
                  }}
                  onBlur={() => handleBlur('dateOfBirth')}
                  error={errors.dateOfBirth}
                  helperText={errors.dateOfBirth || ''}
                  disabled={!isEditing}
                />
              </div>
              <GenderSelect
                id="gender"
                value={formData.gender}
                onChange={(val) => {
                  handleInputChange('gender', val)
                  if (isEditing) setErrors((prev) => ({ ...prev, gender: '' }))
                }}
                onBlur={() => handleBlur('gender')}
                error={errors.gender}
                disabled={!isEditing}
              />

              <PhoneNumberInput
                id="phoneNumber"
                label="Phone Number"
                phoneValue={formData.phoneNumber}
                onPhoneChange={(val) => handleInputChange('phoneNumber', val)}
                onPhoneBlur={() => handleBlur('phoneNumber')}
                countryCode={country.code}
                onCountryChange={(c) => setCountry(c)}
                error={errors.phoneNumber}
                disabled={!isEditing}
                inputClassName={[!isEditing ? 'bg-[#e7e7e7b2] text-gray-500' : '', 'h-11 sm:h-12'].filter(Boolean).join(' ')}
              />

              {/* Email (read-only) */}
              <div>
                <label htmlFor="email" className="block mb-2 text-base font-normal text-gray-600">
                  E-mail
                </label>
                <div className="relative">
                  <input
                    id="email"
                    value={formData.email}
                    disabled
                    className="w-full h-11 sm:h-12 rounded-[5px] px-3 bg-[#e7e7e7b2] border border-gray-400 text-gray-500"
                  />
                </div>
              </div>


            {/* Footer actions */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 sm:gap-5 sm:justify-end mt-5 sm-0">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} className="h-[31px] text-xs px-4 w-full sm:w-auto">
                  EDIT
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={handleCancel} className="h-[31px] text-xs px-4 w-full sm:w-auto">
                    CANCEL
                  </Button>
                  <Button 
                    onClick={handleSaveClick} 
                    className="h-[31px] text-xs px-4 w-full sm:w-auto"
                    disabled={isSaving}
                  >
                    {isSaving ? 'SAVING...' : 'SAVE CHANGE'}
                  </Button>
                </>
              )}
            </div>

              {/* Security Action */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-5">
                <span className="font-medium text-gray-700 text-base">Security Action:</span>
                <Button variant="outline" onClick={handleChangePassword} className="h-[31px] text-xs w-full sm:w-auto">
                  CHANGE PASSWORD
                </Button>
              </div>
            </div>
          </div>

          {/* Danger delete account block */}
          <div className="mt-6">
            <div className="relative w-full py-3 sm:h-12 rounded-md border border-[#ff5722] px-4 flex flex-col sm:flex-row items-center justify-between">
              <div>
                <h2 className="font-medium text-[#ff5722] text-base leading-normal">
                  Delete This Account
                </h2>
                <p className="text-[#ff5722] text-[10px] leading-normal -mt-0.5">
                  This action is permanent and cannot be undone.
                </p>
              </div>
              <Button variant="danger" onClick={handleDeleteAccount} className="h-[31px] text-xs px-4 w-full sm:w-auto mt-3 sm:mt-0">
                DELETE
              </Button>
            </div>
          </div>

          <div className="mt-12 flex justify-center">
            <Button
              variant="ghost"
              onClick={handleExitSettings}
              className="h-[34px] w-full sm:w-[150px] text-base"
            >
              EXIT
            </Button>
          </div>
        </Card>
      </div>

      {/* Profile Update Modal */}
      <AuthModal
        isOpen={showModal}
        onClose={handleModalClose}
        type={modalContent.type}
        title={modalContent.title}
        message={modalContent.message}
      />

      {/* Change Password Modal */}
      <AuthModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        type="info"
        title="Change Password"
        message="You will be redirected to the Check Email page to request a reset link."
        primaryAction={{
          label: 'Continue',
          onClick: handleGoToChangePassword
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => setShowPasswordModal(false)
        }}
      />

      {/* Confirm Save Modal */}
      <AuthModal
        isOpen={showConfirmSave}
        onClose={() => setShowConfirmSave(false)}
        type="info"
        title="Save Changes?"
        message="Do you want to save these changes to your profile?"
        primaryAction={{
          label: 'Save',
          onClick: handleSaveChanges,
        }}
        secondaryAction={{
          label: 'Close',
          onClick: handleCancel,
        }}
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

      {/* Delete Account Confirm Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete This Account?"
        message="This action is permanent and cannot be undone. Are you sure you want to delete your account?"
        type="delete"
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </AuthLayout>
  )
}
