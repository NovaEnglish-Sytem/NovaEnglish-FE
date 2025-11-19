import React from 'react'
import PropTypes from 'prop-types'
import { classes } from '../../config/theme/tokens.js'
import { Input } from '../atoms/Input.jsx'
import MediaUploader from './MediaUploader.jsx'

export default function TFNGEditor({
  value,
  onChange,
  errors = {},
  className = '',
  isPublished = false,
  onRequireUnpublish,
  onMediaUploaded,
  isMediaVisible: controlledMediaVisible,
  onToggleMedia,
}) {
  const v = React.useMemo(() => ({
    text: '',
    correctTFNG: null,
    media: { imageFile: null, audioFile: null, imageUrl: '', audioUrl: '' },
    ...value,
  }), [value])

  // Generate unique radio name based on question ID
  const radioName = React.useMemo(() => `tfng-correct-${v.id || Math.random()}`, [v.id])

  const set = (patch) => {
    onChange?.({ ...v, ...patch })
  }

  // Show warning if no correct answer selected and question text is filled
  const showCorrectWarning = React.useMemo(() => {
    const hasQuestionText = v.text && v.text.trim()
    return hasQuestionText && !v.correctTFNG && !errors?.correctTFNG
  }, [v.text, v.correctTFNG, errors?.correctTFNG])

  // Media visibility: default hidden, auto-show if media exists
  const hasMedia = React.useMemo(() => {
    const m = v.media || {}
    return Boolean(m.imageFile || m.audioFile || m.imageUrl || m.audioUrl)
  }, [v.media, v.media?.imageFile, v.media?.audioFile, v.media?.imageUrl, v.media?.audioUrl])
  const [forceShowMedia, setForceShowMedia] = React.useState(false)
  const isMediaVisible = (typeof controlledMediaVisible === 'boolean')
    ? controlledMediaVisible
    : (hasMedia || forceShowMedia)

  return (
    <div className={['w-full', className].filter(Boolean).join(' ')}>
      <Input
        id="tfng-question-text"
        label="Question Text"
        value={v.text}
        onChange={(e) => set({ text: e.target.value })}
        placeholder="Type the question here"
        error={errors.text}
        className="min-h-0"
      />

      <fieldset className="mt-3">
        <legend className="sr-only">Correct Answer</legend>
        <div className="flex flex-col sm:flex-row gap-3">
          {[
            { key: 'T', label: 'True' },
            { key: 'F', label: 'False' },
            { key: 'NG', label: 'Not Given' },
          ].map(({ key, label }) => (
            <label key={key} className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={radioName}
                value={key}
                checked={v.correctTFNG === key}
                onChange={() => set({ correctTFNG: key })}
                className="w-4 h-4 accent-[#007a33]"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
        {(errors?.correctTFNG || showCorrectWarning) && (
          <p className="text-sm text-red-600 mt-1">
            {errors?.correctTFNG || 'Please select the correct answer'}
          </p>
        )}
      </fieldset>

      <div className="mt-4 border border-gray-200 rounded-md">
        <div className="flex items-center justify-between px-3 py-2">
          <label className="text-sm font-medium text-gray-700">Attach media to this question (optional)</label>
          <button
            type="button"
            onClick={async () => {
              if (isPublished && !hasMedia) { onRequireUnpublish?.(); return }
              // Prevent hiding when media is present
              if (isMediaVisible && hasMedia) { return }
              if (typeof onToggleMedia === 'function') {
                onToggleMedia()
              } else {
                setForceShowMedia((s) => !s)
              }
            }}
            className={[classes.button.base, classes.button.ghost, 'h-8 px-3 text-xs'].join(' ')}
          >
            {isMediaVisible ? 'Hide' : 'Show'}
          </button>
        </div>
        {isMediaVisible && (
          <div className="px-3 pb-3">
            <MediaUploader
              value={v.media || { imageFile: null, audioFile: null, imageUrl: '', audioUrl: '' }}
              onChange={(media) => set({ media })}
              allowImage
              allowAudio
              label=""
              isPublished={isPublished}
              onRequireUnpublish={onRequireUnpublish}
              scope="item"
              targetId={v?.id}
              onMediaUploaded={onMediaUploaded}
            />
          </div>
        )}
      </div>
    </div>
  )
}

TFNGEditor.propTypes = {
  value: PropTypes.shape({
    text: PropTypes.string,
    correctTFNG: PropTypes.oneOf(['T','F','NG']),
    media: PropTypes.shape({
      imageFile: PropTypes.any,
      audioFile: PropTypes.any,
      imageUrl: PropTypes.string,
      audioUrl: PropTypes.string,
    })
  }),
  onChange: PropTypes.func.isRequired,
  errors: PropTypes.shape({
    text: PropTypes.string,
    correctTFNG: PropTypes.string,
  }),
  className: PropTypes.string,
  isPublished: PropTypes.bool,
  onRequireUnpublish: PropTypes.func,
}
