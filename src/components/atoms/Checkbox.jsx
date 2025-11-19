import React from 'react'

export const Checkbox = ({
  id,
  checked = false,
  onChange,
  label = null,
  className = '',
  inputClassName = '',
  labelClassName = '',
  variant = 'default',
  error = '',
  ...rest
}) => {
  if (variant === 'checklist') {
    // Checklist variant without green fill; show check icon when checked (no peer reliance)
    return (
      <div className='min-h-[45px]'>
        <label className={['inline-flex gap-2 cursor-pointer select-none', className].filter(Boolean).join(' ')}>
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className={['sr-only', inputClassName].filter(Boolean).join(' ')}
            {...rest}
          />
          <span
            aria-hidden="true"
            className={[
              'h-4 w-4 rounded-[3px] grid place-items-center border',
              checked ? 'border-gray-600' : 'border-gray-400',
            ].join(' ')}
          >
            <svg
              className={['w-3 h-3 pointer-events-none', checked ? 'opacity-100 text-gray-600' : 'opacity-0'].join(' ')}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-hidden={!checked}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          {label && (
            <span className={['text-sm', labelClassName].filter(Boolean).join(' ')}>
              {label}
            </span>
          )}
        </label>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }

  // Default variant (existing behavior)
  return (
    <label className={['inline-flex items-center gap-2 cursor-pointer', className].filter(Boolean).join(' ')}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className={[
          'h-[13px] w-[13px] border border-gray-600 rounded-sm appearance-none checked:bg-[#007a33] checked:border-[#007a33] focus:outline-none focus:ring-2 focus:ring-[#007a33]',
          inputClassName,
        ].filter(Boolean).join(' ')}
        {...rest}
      />
      {label && (
        <span className={['text-sm', labelClassName].filter(Boolean).join(' ')}>
          {label}
        </span>
      )}
    </label>
  )
}