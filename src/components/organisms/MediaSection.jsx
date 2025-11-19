import React from 'react'
import PropTypes from 'prop-types'
import { classes } from '../../config/theme/tokens.js'
import MediaUploader from '../molecules/MediaUploader.jsx'

const MediaSection = ({ value, onChange, isVisible, onToggle, isPublished = false, onRequireUnpublish, targetId, onMediaUploaded }) => {
  const hasMedia = Boolean(value?.imageFile || value?.audioFile || value?.imageUrl || value?.audioUrl)
  return (
    <div className="border border-gray-200 rounded-md">
      <div className="flex items-center justify-between px-3 py-2">
        <label className="text-base font-semibold text-gray-700">
          Attach media to this page (optional)
        </label>
        <button
          type="button"
          onClick={() => { if (isVisible && hasMedia) return; onToggle() }}
          className={[classes.button.base, classes.button.ghost, 'h-8 px-3 text-xs'].join(' ')}
        >
          {isVisible ? 'Hide' : 'Show'}
        </button>
      </div>
      {isVisible && (
        <div className="px-3 pb-3">
          <MediaUploader
            value={value}
            onChange={onChange}
            allowImage
            allowAudio
            label=""
            isPublished={isPublished}
            onRequireUnpublish={onRequireUnpublish}
            scope="page"
            targetId={targetId}
            onMediaUploaded={onMediaUploaded}
          />
        </div>
      )}
    </div>
  )
}

MediaSection.propTypes = {
  value: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  isVisible: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
  isPublished: PropTypes.bool,
  onRequireUnpublish: PropTypes.func,
  targetId: PropTypes.string,
  onMediaUploaded: PropTypes.func,
}

export default MediaSection
