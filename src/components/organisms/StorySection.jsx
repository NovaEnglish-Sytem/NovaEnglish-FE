import React from 'react'
import PropTypes from 'prop-types'
import { classes } from '../../config/theme/tokens.js'
import StoryEditor from '../molecules/StoryEditor.jsx'

const StorySection = ({ value, onChange, isVisible, onToggle, isPublished = false }) => {
  return (
    <div className="border border-gray-200 rounded-md">
      <div className="flex items-center justify-between px-3 py-2">
        <label htmlFor="story-text" className="text-base font-semibold text-gray-700">
          Story / Passage (optional)
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
          <StoryEditor
            value={value}
            onChange={onChange}
            className="story-editor"
            placeholder="Write a passage or story here..."
            minHeight={380}
            readOnly={isPublished}
          />
        </div>
      )}
    </div>
  )
}

StorySection.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  isVisible: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
  isPublished: PropTypes.bool,
}

export default StorySection
