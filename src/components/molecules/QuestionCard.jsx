import React from 'react'
import PropTypes from 'prop-types'
import { HiChevronUp, HiChevronDown, HiTrash } from 'react-icons/hi'
import { classes } from '../../config/theme/tokens.js'

export default function QuestionCard({
  number,
  type,
  onMoveUp,
  onMoveDown,
  onDelete,
  defaultOpen = true,
  children,
  className = '',
  questionNumbers, // Array of question numbers for this card
}) {
  const [open, setOpen] = React.useState(defaultOpen)

  const typeLabel = {
    MCQ: 'Multiple Choice',
    TFNG: 'True / False / Not Given',
    SHORT: 'Short Answer',
    MATCHING: 'Matching Dropdown',
  }[type] || type

  return (
    <div className={['rounded-[12px] border border-[#ececec] shadow-[4px_4px_2px_#0000000d] bg-white', className].filter(Boolean).join(' ')}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#f0f0f0]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100"
            aria-label={open ? 'Collapse question' : 'Expand question'}
          >
            {open ? <HiChevronUp className="w-5 h-5 text-gray-600" /> : <HiChevronDown className="w-5 h-5 text-gray-600" />}
          </button>
          <div className="flex flex-col">
            <div className="text-sm font-semibold text-gray-700">
              {questionNumbers && questionNumbers.length > 1 
                ? (questionNumbers.length > 3 
                    ? `Question ${questionNumbers.slice(0, 3).join(', ')}...`
                    : `Question ${questionNumbers.join(', ')}`)
                : `Question ${number}`
              }
            </div>
            <div className="text-xs text-gray-500">{typeLabel}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMoveUp}
            className={[classes.button.base, classes.button.ghost, 'h-8 px-2'].join(' ')}
            aria-label="Move up"
            title="Move up"
          >
            <HiChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            className={[classes.button.base, classes.button.ghost, 'h-8 px-2'].join(' ')}
            aria-label="Move down"
            title="Move down"
          >
            <HiChevronDown className="w-4 h-4" />
          </button>
          {/* Duplicate removed */}
          <button
            type="button"
            onClick={onDelete}
            className={[classes.button.base, classes.button.danger, 'h-8 px-3 text-sm'].join(' ')}
            aria-label="Delete"
            title="Delete"
          >
            <HiTrash className="w-4 h-4" />
          </button>
        </div>
      </div>

      {open && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  )
}

QuestionCard.propTypes = {
  number: PropTypes.number.isRequired,
  type: PropTypes.oneOf(['MCQ','TFNG','SHORT','MATCHING']).isRequired,
  onMoveUp: PropTypes.func,
  onMoveDown: PropTypes.func,
  onDelete: PropTypes.func,
  defaultOpen: PropTypes.bool,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  questionNumbers: PropTypes.arrayOf(PropTypes.number),
}
