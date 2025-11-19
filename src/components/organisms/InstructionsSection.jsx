import React from 'react'
import PropTypes from 'prop-types'
import { classes } from '../../config/theme/tokens.js'
import InstructionEditor from '../molecules/InstructionEditor.jsx'

const InstructionsSection = ({ value, onChange, isVisible, onToggle, isPublished = false }) => {
  return (
    <div className="border border-gray-200 rounded-md">
      <div className="flex items-center justify-between px-3 py-2">
        <label htmlFor="instructions" className="text-base font-semibold text-gray-700">
          Instructions (optional)
        </label>
        <button
          type="button"
          onClick={onToggle}
          className={[classes.button.base, classes.button.ghost, 'h-8 px-3 text-xs'].join(' ')}
        >
          {isVisible ? 'Hide' : 'Show'}
        </button>
      </div>
      {isVisible && (
        <div className="px-3 pb-3">
          <InstructionEditor
            value={value}
            onChange={onChange}
            className="instruction-editor"
            placeholder="Tulis instruksi singkat di sini..."
            minHeight={150}
            readOnly={isPublished}
          />
        </div>
      )}
    </div>
  )
}

InstructionsSection.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  isVisible: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
  isPublished: PropTypes.bool,
}

export default InstructionsSection
