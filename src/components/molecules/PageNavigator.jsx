import React from 'react'
import PropTypes from 'prop-types'
import { HiX, HiPlus } from 'react-icons/hi'
import { classes } from '../../config/theme/tokens.js'

const PageNavigator = ({ pages, currentIndex, onAddAfter, onDeletePageAt, onSelectPage, canDelete }) => {
  const canDeleteAny = canDelete && (pages.length > 1)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {pages.map((_, i) => (
          <div key={i} className="relative inline-flex items-center">
            <button
              type="button"
              onClick={() => onSelectPage(i)}
              className={[
                classes.button.base,
                i === currentIndex ? classes.button.primary : classes.button.outline,
                'h-9 px-3 text-sm pr-6 text-center justify-center'
              ].join(' ')}
            >
              Page {i + 1}
            </button>
            {/* Delete (X) icon - smaller red chip with larger X icon */}
            <button
              type="button"
              onClick={() => onDeletePageAt(i)}
              className={[
                'absolute -right-1 -top-1 inline-flex items-center justify-center rounded-full border shadow-sm ring-2 ring-white',
                'w-[14px] h-[14px]',
                canDeleteAny
                  ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700'
                  : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
              ].join(' ')}
              aria-label={`Delete Page ${i + 1}`}
              disabled={!canDeleteAny}
            >
              <HiX className="w-[10px] h-[10px]" />
            </button>
          </div>
        ))}
        {/* Add Page - always rendered at the end (right side) of the chip list */}
        <button
          type="button"
          onClick={() => onAddAfter(currentIndex)}
          className={[classes.button.base, classes.button.outline, 'h-9 px-3 text-sm ml-2 flex items-center gap-1'].join(' ')}
        >
          <HiPlus className="w-4 h-4" />
          Add Page
        </button>
      </div>
    </div>
  )
}

PageNavigator.propTypes = {
  pages: PropTypes.array.isRequired,
  currentIndex: PropTypes.number.isRequired,
  onAddAfter: PropTypes.func.isRequired,      // (index:number) => void
  onDeletePageAt: PropTypes.func.isRequired,  // (index:number) => void
  onSelectPage: PropTypes.func.isRequired,
  canDelete: PropTypes.bool,
}

export default PageNavigator
