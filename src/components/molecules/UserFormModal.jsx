import React, { useState } from 'react'
import { Modal } from '../atoms/Modal.jsx'
import { Button } from '../atoms/Button.jsx'
import { Input } from '../atoms/Input.jsx'
import { PasswordField } from './PasswordField.jsx'
import { PhoneNumberInput } from './PhoneNumberInput.jsx'
import DatePickerField from '../atoms/DatePickerField.jsx'
import GenderSelect from './GenderSelect.jsx'
import RoleSelect from './RoleSelect.jsx'
import { validateFullName, validateEmail, validatePassword, validatePhone, toTitleCase } from '../../utils/validators.js'
import ConfirmDialog from './ConfirmDialog.jsx'
import { AuthModal } from './AuthModal.jsx'

const UserFormModal = ({
  isOpen,
  onClose,
  title,
  mode = 'create',
  form,
  setForm,
  errors,
  setErrors,
  country,
  setCountry,
  onSubmit,
  submitLabel = 'SAVE',
  saving = false,
}) => {
  const [showConfirm, setShowConfirm] = useState(false)
  const [showMsg, setShowMsg] = useState(false)
  const [msg, setMsg] = useState({ type: 'info', title: '', message: '' })
  const [_lastOk, setLastOk] = useState(null)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [validationMessage, setValidationMessage] = useState('')

  const validateAll = () => {
    const errs = {}
    // email (always required)
    const em = validateEmail(form.email)
    if (!em.valid) errs.email = em.message

    // full name
    const fn = validateFullName(form.fullName)
    if (!fn.valid) errs.fullName = fn.message

    // phone
    if (!form.phoneNumber) {
      errs.phoneNumber = 'Phone number is required'
    } else {
      const ph = validatePhone(form.phoneNumber, country.code)
      if (!ph.valid) errs.phoneNumber = ph.message
    }

    // place of birth
    {
      const t = String(form.placeOfBirth || '').trim()
      if (!t) errs.placeOfBirth = 'Place of Birth is required.'
      else if (t.length < 3) errs.placeOfBirth = 'Place of Birth must be at least 3 characters.'
    }

    // date of birth
    if (!form.dateOfBirth) {
      errs.dateOfBirth = 'Date of Birth is required.'
    } else {
      const dob = new Date(form.dateOfBirth)
      const min = new Date(); min.setFullYear(min.getFullYear() - 5)
      if (dob > min) errs.dateOfBirth = 'Minimum age is 5 years.'
    }

    // gender
    if (!form.gender) {
      errs.gender = 'Please select gender.'
    }

    // password rules differ by mode
    if (mode === 'create') {
      const pw = validatePassword(form.password)
      if (!pw.valid) errs.password = pw.message
      if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password'
      else if (form.confirmPassword !== form.password) errs.confirmPassword = 'Passwords do not match'
    } else {
      if (form.password) {
        const pw = validatePassword(form.password)
        if (!pw.valid) errs.password = pw.message
        if (!form.confirmPassword) errs.confirmPassword = 'Please confirm the new password'
        else if (form.confirmPassword !== form.password) errs.confirmPassword = 'Passwords do not match'
      }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handlePrimary = () => {
    if (!validateAll()) {
      // Show validation warning modal
      setValidationMessage('Some fields are incomplete or invalid. Please check all required fields and try again.')
      setShowValidationModal(true)
      return
    }
    setShowConfirm(true)
  }

  const handleConfirm = async () => {
    try {
      const res = await onSubmit()
      if (res && typeof res === 'object') {
        const ok = !!res.ok
        setLastOk(ok)
        const type = ok ? 'success' : 'error'
        const title = ok ? (res.title || 'Success') : (mode === 'create' ? 'Create Failed' : 'Save Failed')
        const message = ok
          ? (res.message || (mode === 'create' ? 'User created successfully.' : 'Changes saved successfully.'))
          : (res.message || 'Failed to save. Please try again.')
        setMsg({ type, title, message })
        setShowMsg(true)
      }
    } catch (error) {
      // Catch any uncaught errors to prevent error boundary
      setLastOk(false)
      setMsg({
        type: 'error',
        title: mode === 'create' ? 'Create Failed' : 'Save Failed',
        message: error?.message || 'An unexpected error occurred. Please try again.'
      })
      setShowMsg(true)
    } finally {
      setShowConfirm(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="w-full"
      maxWidthClass="max-w-2xl"
      lockScroll={false}
      closeOnBackdrop={false}
    >
      <div className="p-6 flex flex-col max-h-[90vh]">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-2xl leading-none"
        >
          ×
        </button>
        <h2 className="text-lg font-semibold mb-4 text-center pr-8">{title}</h2>
        <div className="space-y-4 flex-1 min-h-0 overflow-y-auto pl-2 pr-5">
          <Input
            id={`${mode}FullName`}
            label="Full Name"
            value={form.fullName}
            onChange={(e) => {
              setForm((p) => ({ ...p, fullName: toTitleCase(e.target.value) }))
              if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }))
            }}
            onBlur={() => {
              const fn = validateFullName(form.fullName)
              setErrors((prev) => ({ ...prev, fullName: fn.valid ? '' : fn.message }))
            }}
            error={errors.fullName}
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id={`${mode}PlaceOfBirth`}
              label="Place of Birth"
              value={form.placeOfBirth}
              onChange={(e) => {
                const v = toTitleCase(e.target.value)
                setForm((p) => ({ ...p, placeOfBirth: v }))
                const t = String(v || '').trim()
                setErrors((prev) => ({ ...prev, placeOfBirth: !t ? 'Place of Birth is required.' : (t.length < 3 ? 'Place of Birth must be at least 3 characters.' : '') }))
              }}
              onBlur={() => {
                const t = String(form.placeOfBirth || '').trim()
                setErrors((prev) => ({ ...prev, placeOfBirth: !t ? 'Place of Birth is required.' : (t.length < 3 ? 'Place of Birth must be at least 3 characters.' : '') }))
              }}
              error={errors.placeOfBirth}
              required
            />
            <DatePickerField
              id={`${mode}DateOfBirth`}
              label="Date of Birth"
              value={form.dateOfBirth}
              onChange={(v) => {
                setForm((p) => ({ ...p, dateOfBirth: v }))
                if (v) {
                  const dob = new Date(v)
                  const min = new Date(); min.setFullYear(min.getFullYear() - 5)
                  setErrors((prev) => ({ ...prev, dateOfBirth: dob > min ? 'Minimum age is 5 years.' : '' }))
                } else {
                  setErrors((prev) => ({ ...prev, dateOfBirth: 'Date of Birth is required.' }))
                }
              }}
              onBlur={() => {
                const v = form.dateOfBirth
                if (!v) setErrors((prev) => ({ ...prev, dateOfBirth: 'Date of Birth is required.' }))
              }}
              error={errors.dateOfBirth}
              helperText={errors.dateOfBirth || ''}
              required
            />
          </div>
          <GenderSelect
            id={`${mode}Gender`}
            value={form.gender}
            onChange={(val) => {
              setForm((p) => ({ ...p, gender: val }))
              setErrors((prev) => ({ ...prev, gender: '' }))
            }}
            onBlur={() => {
              const g = String(form.gender || '').toUpperCase()
              setErrors((prev) => ({ ...prev, gender: !g || !['MALE', 'FEMALE'].includes(g) ? 'Please select gender.' : '' }))
            }}
            error={errors.gender}
            required
          />
          <Input
            id={`${mode}Email`}
            label="Email"
            value={form.email}
            onChange={(e) => {
              setForm((p) => ({ ...p, email: e.target.value }))
              if (errors.email) setErrors((prev) => ({ ...prev, email: '' }))
            }}
            onBlur={() => {
              const em = validateEmail(form.email)
              setErrors((prev) => ({ ...prev, email: em.valid ? '' : em.message }))
            }}
            error={errors.email}
            required
            disabled={mode === 'edit' && !!form.id}
            inputClassName={mode === 'edit' && form.id ? 'bg-[#e7e7e7b2] text-gray-500 cursor-not-allowed' : ''}
          />
          <PhoneNumberInput
            id={`${mode}Phone`}
            label="Phone Number"
            phoneValue={form.phoneNumber}
            onPhoneChange={(val) => setForm((p) => ({ ...p, phoneNumber: val }))}
            countryCode={country.code}
            onCountryChange={setCountry}
            error={errors.phoneNumber}
            onPhoneBlur={() => {
              if (!form.phoneNumber) {
                setErrors((prev) => ({ ...prev, phoneNumber: 'Phone number is required' }))
              } else {
                const ph = validatePhone(form.phoneNumber, country.code)
                setErrors((prev) => ({ ...prev, phoneNumber: ph.valid ? '' : ph.message }))
              }
            }}
          />
          <div>
            <label className="block mb-2 text-base font-normal text-gray-700">Role</label>
            <RoleSelect value={form.role} onChange={(val) => setForm((p) => ({ ...p, role: val }))} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Mark as verified account</span>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, isEmailVerified: !p.isEmailVerified }))}
              className={[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors border border-gray-300',
                form.isEmailVerified ? 'bg-[#007a33]' : 'bg-gray-200',
              ].join(' ')}
              aria-pressed={!!form.isEmailVerified}
              aria-label="Toggle verified"
            >
              <span
                className={[
                  'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                  form.isEmailVerified ? 'translate-x-5' : 'translate-x-1',
                ].join(' ')}
              />
            </button>
          </div>
          <PasswordField
            id={`${mode}Password`}
            label={mode === 'edit' ? 'New Password' : 'Password'}
            value={form.password}
            onChange={(e) => {
              setForm((p) => ({ ...p, password: e.target.value }))
              const val = e.target.value
              if (errors.password) setErrors((prev) => ({ ...prev, password: '' }))
              setErrors((prev) => ({
                ...prev,
                confirmPassword: form.confirmPassword
                  ? (form.confirmPassword === val ? '' : 'Passwords do not match')
                  : (prev.confirmPassword || '')
              }))
            }}
            inputProps={{ onBlur: () => {
              if (mode === 'edit' && !form.password) {
                setErrors((prev) => ({ ...prev, password: '' }))
              } else {
                const pw = validatePassword(form.password)
                setErrors((prev) => ({ ...prev, password: pw.valid ? '' : pw.message }))
              }
            }}}
            error={errors.password}
          />
          <PasswordField
            id={`${mode}ConfirmPassword`}
            label={mode === 'edit' ? 'Confirm New Password' : 'Confirm Password'}
            value={form.confirmPassword}
            onChange={(e) => {
              const val = e.target.value
              setForm((p) => ({ ...p, confirmPassword: val }))
              setErrors((prev) => ({
                ...prev,
                confirmPassword: (mode === 'edit' && !form.password)
                  ? (val ? '' : 'Please confirm the new password')
                  : (val ? (val === form.password ? '' : 'Passwords do not match') : (mode === 'create' ? 'Please confirm your password' : 'Please confirm the new password'))
              }))
            }}
            inputProps={{ onBlur: () => {
              setErrors((prev) => ({
                ...prev,
                confirmPassword: (mode === 'edit' && !form.password)
                  ? (form.confirmPassword ? '' : 'Please confirm the new password')
                  : (form.confirmPassword
                    ? (form.confirmPassword === form.password ? '' : 'Passwords do not match')
                    : (mode === 'create' ? 'Please confirm your password' : 'Please confirm the new password')),
              }))
            }}}
            error={errors.confirmPassword}
            required={mode === 'create'}
          />
        </div>
        <div className="mt-6 flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handlePrimary} disabled={saving}>{submitLabel}</Button>
        </div>
      </div>

      {/* Confirm before save */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        title={mode === 'create' ? 'Confirm Create' : 'Confirm Save'}
        message={mode === 'create' ? 'Save this new user?' : 'Save changes to this user?'}
        type="save"
        isLoading={saving}
      />

      {/* Feedback modal */}
      <AuthModal
        isOpen={showMsg}
        onClose={() => {
          setShowMsg(false)
          onClose()
        }}
        type={msg.type}
        title={msg.title}
        message={msg.message}
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
    </Modal>
  )
}

export default UserFormModal
