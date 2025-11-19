import { parsePhoneNumberFromString } from 'libphonenumber-js/min'

const trim = (v) => String(v ?? '').trim()
const digitsOnly = (v) => String(v ?? '').replace(/\D/g, '')

export const toTitleCase = (str) => {
  if (!str) return ''
  return String(str)
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export const sanitizePhone = (v) => digitsOnly(v)

// Full Name: required, 2–50 chars, letters/space/hyphen/apostrophe, not all spaces
export const validateFullName = (value) => {
  const v = trim(value)
  if (!v) return { valid: false, message: 'Full name is required.' }
  if (v.length < 2) return { valid: false, message: 'Full name must be at least 2 characters.' }
  if (v.length > 50) return { valid: false, message: 'Full name must be at most 50 characters.' }
  const re = /^[A-Za-z' -]+$/
  if (!re.test(v)) return { valid: false, message: 'Full name may contain letters, spaces, apostrophes, and hyphens only.' }
  if (!/[A-Za-z]/.test(v)) return { valid: false, message: 'Full name must contain letters.' }
  return { valid: true, value: v }
}

// Email: required, RFC-like simple pattern, max 254
export const validateEmail = (value) => {
  const v = value.trim()
  if (!v) return { valid: false, message: 'Email is required.' }
  if (v.length > 254) return { valid: false, message: 'Email too long.' }

  const regex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/
  if (!regex.test(v)) return { valid: false, message: 'Invalid email format.' }

  const domain = v.split('@')[1].toLowerCase()
  const disposable = new Set([
    'mailinator.com', '10minutemail.com', 'tempmail.com', 'yopmail.com'
  ])
  if (disposable.has(domain)) return { valid: false, message: 'Disposable email not allowed.' }

  return { valid: true, value: v.toLowerCase() }
}

// Password: required, 8–128, include upper, lower, number, symbol
export const validatePassword = (value) => {
  const v = String(value ?? '')
  if (!v) return { valid: false, message: 'Password is required.' }
  if (v.length < 8) return { valid: false, message: 'Password must be at least 8 characters.' }
  if (v.length > 128) return { valid: false, message: 'Password must be at most 128 characters.' }
  if (!/[A-Z]/.test(v)) return { valid: false, message: 'Password must include at least one uppercase letter.' }
  if (!/[a-z]/.test(v)) return { valid: false, message: 'Password must include at least one lowercase letter.' }
  if (!/[0-9]/.test(v)) return { valid: false, message: 'Password must include at least one number.' }
  if (!/[^A-Za-z0-9]/.test(v)) return { valid: false, message: 'Password must include at least one symbol.' }
  return { valid: true, value: v }
}

export const validateConfirmPassword = (password, confirmPassword) => {
  const p = String(password ?? '')
  const c = String(confirmPassword ?? '')
  if (!c) return { valid: false, message: 'Please confirm your password.' }
  if (p !== c) return { valid: false, message: 'Passwords do not match.' }
  return { valid: true, value: c }
}

// Phone: required, valid for selected ISO2 country
export const validatePhone = (nationalNumber, iso2CountryCode) => {
  const raw = String(nationalNumber ?? '')
  const sanitized = sanitizePhone(raw)
  if (!sanitized) {
    return { valid: false, message: 'Phone number is required.' }
  }
  try {
    const phone = parsePhoneNumberFromString(sanitized, String(iso2CountryCode || '').toUpperCase())
    if (!phone || !phone.isValid()) {
      return { valid: false, message: 'Invalid phone number for the selected country.' }
    }
    return { valid: true, value: { e164: phone.number, national: phone.formatNational() } }
  } catch {
    return { valid: false, message: 'Invalid phone number for the selected country.' }
  }
}

// E.164 formatter for submit
export const formatPhoneE164 = (nationalNumber, iso2CountryCode) => {
  try {
    const phone = parsePhoneNumberFromString(sanitizePhone(nationalNumber), String(iso2CountryCode || '').toUpperCase())
    if (phone && phone.isValid()) return phone.number
  } catch {}
  return ''
}

export default {
  sanitizePhone,
  validateFullName,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validatePhone,
  formatPhoneE164,
  toTitleCase,
}
