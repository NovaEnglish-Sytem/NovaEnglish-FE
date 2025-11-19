import React from 'react'
import { classes } from '../../config/theme/tokens.js'

export const TopNav = ({ items = [], className = '' }) => {
  return (
    <nav className={['flex gap-6', className].filter(Boolean).join(' ')}>
      {items.map((item, idx) => (
        <button
          key={item.label + idx}
          onClick={item.onClick}
          aria-current={item.active ? 'page' : undefined}
          className={[
            'w-[120px] h-[41px] flex items-center justify-center text-white text-base font-medium [text-shadow:2px_2px_4px_#00000040] rounded',
            item.isActive ? classes.topNavActive : 'hover:bg-[#497049] transform transition-transform duration-90 active:scale-95',
          ].filter(Boolean).join(' ')}
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}
