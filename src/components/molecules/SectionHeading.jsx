import React from 'react'

export const SectionHeading = ({ children, className = '', textColor = 'text-[#4da32f]' }) => {
  return (
    <div className={['flex items-center gap-3 mt-6 mb-2', className].filter(Boolean).join(' ')}>
      <span className={['font-medium', textColor].filter(Boolean).join(' ')}>{children}</span>
    </div>
  )
}

export default SectionHeading