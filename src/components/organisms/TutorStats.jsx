import React from 'react'
import { classes } from '../../config/theme/tokens.js'

export const TutorStats = ({ items = [], className = '' }) => {
  return (
    <div className={['grid grid-cols-1 md:grid-cols-3 gap-6', className].filter(Boolean).join(' ')}>
      {items.map((it) => (
        <div
          key={it.title}
          className={[classes.surfaceCard, 'px-6 py-8'].join(' ')}
        >
          <div className="text-gray-500 text-base font-medium text-center">{it.title}</div>
          <div className={['mt-2 text-[32px] font-semibold text-center', classes.textSuccess].join(' ')}>{it.value}</div>
          {it.subtitle ? (
            <div className="mt-1 text-xs text-gray-400 text-center">{it.subtitle}</div>
          ) : null}
        </div>
      ))}
    </div>
  )
}

export default TutorStats
