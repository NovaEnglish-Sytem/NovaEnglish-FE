import React from 'react'

export const Card = ({ className = '', padding = true, children, ...rest }) => {
  return (
    <div
      className={[
        'bg-white rounded-[10px] shadow-[4px_6px_4px_#e0e0e040] border-0',
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      <div className={padding ? 'p-6 md:p-8' : ''}>
        {children}
      </div>
    </div>
  )
}
