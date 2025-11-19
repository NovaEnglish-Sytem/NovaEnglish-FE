import React from 'react'
import { FaChevronDown } from 'react-icons/fa6'

export const RoleSelect = ({
  value = 'STUDENT',
  onChange = () => {},
  options,
  className = '',
  disabled = false,
  readOnly = false,
}) => {
  const defaultOptions = [
    { value: 'TUTOR', label: 'Tutor' },
    { value: 'STUDENT', label: 'Student' }
    //{ value: 'ADMIN', label: 'Admin' },
  ]
  const opts = Array.isArray(options) && options.length > 0 ? options : defaultOptions
  const current = opts.find((o) => o.value === value)?.label || value

  if (readOnly) {
    return <span className="text-gray-700">{current}</span>
  }

  return (
    <div className={['relative inline-flex', className].filter(Boolean).join(' ')}>
      <select
        className="appearance-none h-[30px] pl-3 pr-8 bg-white border border-gray-300 rounded text-gray-700 text-sm cursor-pointer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label="Role"
      >
        {opts.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <FaChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={12} />
    </div>
  )
}

export default RoleSelect
