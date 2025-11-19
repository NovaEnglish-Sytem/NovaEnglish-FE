import React, { useState } from 'react'
import { Input } from '../atoms/Input.jsx'
import { HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2'

export const PasswordField = ({
  id = 'password',
  label = 'Password',
  value,
  onChange,
  placeholder = '',
  error = '',
  helperText = '',
  className = '',
  initiallyVisible = false,
  inputProps = {},
}) => {
  const [show, setShow] = useState(initiallyVisible)

  return (
    <div className={['min-h-[100px]', className].filter(Boolean).join(' ')}>
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        label={label}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        error={error}
        helperText={helperText}
        rightAdornment={
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="p-0.5 rounded border-0 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 active:outline-none"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? (
              <HiOutlineEyeSlash className="w-6 h-6" aria-hidden="true" />
            ) : (
              <HiOutlineEye className="w-6 h-6" aria-hidden="true" />
            )}
          </button>
        }
        {...inputProps}
      />
    </div>
  )
}
