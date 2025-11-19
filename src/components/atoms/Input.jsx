import React from 'react'

export const Input = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  error = '',
  helperText = '',
  rightAdornment = null,
  className = '',
  inputClassName = '',
  labelClassName = '',
  ...rest
}) => {
  const borderColor = error ? 'border-red-500 focus:ring-red-500' : ' border-gray-400 focus:ring-[#007a33]'
  const labelColor = 'text-gray-700'
  const baseInput =
    'w-full h-12 rounded-[5px] px-3 pr-11 outline-none border focus:border-transparent focus:ring-2 transition-all duration-200 ' + borderColor

  return (
    <div className={['w-full min-h-[100px]', className].filter(Boolean).join(' ')}>
      {label && (
        <label
          htmlFor={id}
          className={['block mb-1 text-base font-normal', labelColor, labelClassName]
            .filter(Boolean)
            .join(' ')}
        >
          {label}
        </label>
      )}

      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={[baseInput, inputClassName].filter(Boolean).join(' ')}
          aria-invalid={!!error}
          aria-describedby={helperText ? `${id}-helper` : undefined}
          {...rest}
        />
        {rightAdornment && (
          <div className="absolute inset-y-0 right-2 flex items-center">
            {rightAdornment}
          </div>
        )}
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

export default Input;