import React from 'react'
import PropTypes from 'prop-types'
import CountryCodeSelect from './CountryCodeSelect.jsx'

export const PhoneNumberInput = ({
  id,
  label = 'Phone Number',
  phoneValue,
  onPhoneChange,
  countryCode = 'ID',
  onCountryChange,
  countriesUrl,
  disabled = false,
  required = false,
  placeholder = '',
  className = '',
  inputClassName = '',
  labelClassName = '',
  onPhoneBlur,
  error = '',
  helperText = '',
}) => {
  const borderColor = error ? 'border-red-500 focus:ring-red-500' : 'border-gray-400 focus:ring-[#007a33]'
  const baseInput =
    'w-full h-12 rounded-[5px] px-3 outline-none border focus:border-transparent focus:ring-2 transition-all duration-200 ' + borderColor

  return (
    <div className={['w-full min-h-[105px]', className].filter(Boolean).join(' ')}>
      {label && (
        <label
          htmlFor={id}
          className={['block mb-2 text-base font-normal text-gray-700', labelClassName]
            .filter(Boolean)
            .join(' ')}
        >
          {label}
        </label>
      )}

      <div className="flex items-stretch gap-3 sm:flex-row flex-col">
        <CountryCodeSelect
          value={countryCode}
          onChange={onCountryChange}
          countriesUrl={countriesUrl}
          disabled={disabled}
          className={["shrink-0"].filter(Boolean).join(' ')}
          buttonClassName="h-12"
        />
        <input
          id={id}
          type="tel"
          value={phoneValue}
          onChange={(e) => onPhoneChange?.(e.target.value)}
          onBlur={onPhoneBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={[baseInput, inputClassName].filter(Boolean).join(' ')}
          aria-invalid={!!error}
          aria-describedby={helperText ? `${id}-helper` : undefined}
          inputMode="tel"
          autoComplete="tel"
        />
      </div>

      {helperText && !error && (
        <p id={`${id}-helper`} className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

PhoneNumberInput.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string,
  phoneValue: PropTypes.string.isRequired,
  onPhoneChange: PropTypes.func.isRequired,
  countryCode: PropTypes.string,
  onCountryChange: PropTypes.func,
  countriesUrl: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
  labelClassName: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  onPhoneBlur: PropTypes.func,
}

export default PhoneNumberInput