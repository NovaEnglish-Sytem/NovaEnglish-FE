import React, { useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import useDismissableOverlay from '../../hooks/useDismissableOverlay.js'

export const GenderSelect = ({
  id,
  label = 'Gender',
  value,
  onChange,
  onBlur,
  error = '',
  _required = false,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false)
  const [openedCycle, setOpenedCycle] = useState(false)
  const [selectedInCycle, setSelectedInCycle] = useState(false)
  const containerRef = useRef(null)

  useDismissableOverlay({ ref: containerRef, when: open, onClose: () => setOpen(false), options: { closeOnScroll: true } })

  const options = useMemo(() => ([
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
  ]), [])

  const selected = options.find(o => o.value === (value || '').toUpperCase()) || null

  const handleSelect = (opt) => {
    if (disabled) return
    setOpen(false)
    setSelectedInCycle(true)
    if (typeof onChange === 'function') onChange(opt.value)
  }

  useEffect(() => {
    if (open) {
      setOpenedCycle(true)
      setSelectedInCycle(false)
    } else {
      if (openedCycle && !selectedInCycle && (!value || String(value).trim() === '')) {
        if (typeof onBlur === 'function') onBlur()
      }
      setOpenedCycle(false)
      setSelectedInCycle(false)
    }
  }, [open, onBlur, value, openedCycle, selectedInCycle])

  const ringClass = disabled ? 'focus:ring-0' : (error ? 'focus:ring-red-500' : 'focus:ring-[#007a33]')
  const borderClass = disabled ? 'border-gray-400' : (error ? 'border-red-500' : 'border-gray-400')
  const bgClass = disabled ? 'bg-[#e7e7e7b2]' : ''
  

  return (
    <div className="w-full min-h-[100px] relative" ref={containerRef}>
      {label && (
        <label htmlFor={id} className="block mb-1 text-base font-normal text-gray-700">{label}</label>
      )}
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={() => { if (!disabled) setOpen(o => !o) }}
        className={[
          'w-full inline-flex items-center justify-between h-13 px-3 rounded-[5px] border transition-colors',
          borderClass,
          disabled ? 'cursor-not-allowed' : 'hover:bg-[#F5F5F5]',
          disabled ? 'focus:outline-none' : 'focus:outline-none focus:ring-2 focus:ring-offset-1',
          ringClass,
          bgClass,
        ].join(' ')}
      >
        <span className={[
          disabled ? 'text-gray-500' : (selected ? 'text-gray-900' : 'text-[#9CA3AF]'),
        ].join(' ')}>
          {selected ? selected.label : 'Select gender'}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" className={["w-4 h-4 ml-2", disabled ? 'text-gray-500' : 'text-gray-600'].join(' ')} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
        </svg>
      </button>

      {open && !disabled && (
        <div
          role="listbox"
          className="absolute z-50 top-19 w-full max-h-56 overflow-auto rounded-md border border-gray-200 bg-white shadow-[0_6px_16px_rgba(0,0,0,0.10)]"
        >
          <ul className="max-h-56 overflow-y-auto py-1">
            {options.map(opt => {
              const isSelected = selected && opt.value === selected.value
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt)}
                    className={[
                      'w-full flex items-center justify-between px-3 py-1.5 text-left text-sm',
                      isSelected ? 'bg-[#F0FDF4]' : 'hover:bg-[#F5F5F5]'
                    ].join(' ')}
                  >
                    <span className="text-sm text-gray-900">{opt.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {/* helper removed per design */}
    </div>
  )
}

GenderSelect.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  error: PropTypes.string,
  required: PropTypes.bool,
}

export default GenderSelect
