import React from 'react'
import PropTypes from 'prop-types'
import { classes } from '../../config/theme/tokens.js'
import { Input } from '../atoms/Input.jsx'
import MediaUploader from './MediaUploader.jsx'

export default function MultipleChoiceEditor({
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
    options: ['', '', '', ''],
    correctIndex: null,
    media: { imageFile: null, audioFile: null, imageUrl: '', audioUrl: '' },
    ...value,
  }), [value])

  // Generate unique radio name based on question ID
  const radioName = React.useMemo(() => `mcq-correct-${v.id || Math.random()}`, [v.id])

  const set = (patch) => {
    onChange?.({ ...v, ...patch })
  }

  const setOption = (idx, text) => {
    const options = [...(v.options || ['', '', '', ''])]
    options[idx] = text
    set({ options })
  }

  const setCorrect = (idx) => {
    set({ correctIndex: idx })
  }

  // Show warning if no correct answer selected and options are filled
  const showCorrectWarning = React.useMemo(() => {
    const hasFilledOptions = v.options?.some(opt => opt && opt.trim())
    return hasFilledOptions && v.correctIndex === null && !errors?.correctIndex
  }, [v.options, v.correctIndex, errors?.correctIndex])

  // Media visibility: default hidden, auto-show if media exists
  const hasMedia = React.useMemo(() => {
    const m = v.media || {}
    return Boolean(m.imageFile || m.audioFile || m.imageUrl || m.audioUrl)
  }, [v.media])
  const [forceShowMedia, setForceShowMedia] = React.useState(false)
  const isMediaVisible = (typeof controlledMediaVisible === 'boolean')
    ? controlledMediaVisible
    : (hasMedia || forceShowMedia)

  return (
    <div className={['w-full', className].filter(Boolean).join(' ')}>
      <Input
        id="mcq-question-text"
        label="Question Text"
        value={v.text}
        onChange={(e) => set({ text: e.target.value })}
        placeholder="Type the question here"
        error={errors.text}
        className="min-h-0"
      />

      <div className="mt-2 grid grid-cols-1 gap-3">
        {[0,1,2,3].map((i) => (
          <div key={i} className={[
            'flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-3 rounded-md border',
            errors?.options && errors.options[i] ? 'border-red-500' : 'border-gray-200'
          ].join(' ')}>
            <div className="flex items-center gap-2 w-full">
              <input
                type="radio"
                name={radioName}
                checked={v.correctIndex === i}
                onChange={() => setCorrect(i)}
                className="w-4 h-4 flex-shrink-0 accent-[#007a33]"
                aria-label={`Mark option ${i + 1} as correct`}
              />
              <input
                type="text"
                value={(v.options && v.options[i]) || ''}
                onChange={(e) => setOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                className={[
                  'flex-1 h-11 rounded-[5px] px-3 outline-none border focus:border-transparent focus:ring-2 transition-all duration-200',
                  errors?.options && errors.options[i] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[#007a33]'
                ].join(' ')}
                aria-invalid={Boolean(errors?.options && errors.options[i])}
              />
            </div>
          </div>
        ))}
        {(errors?.correctIndex || showCorrectWarning) && (
          <p className="text-sm text-red-600">
            {errors?.correctIndex || 'Please select the correct answer by clicking a radio button'}
          </p>
        )}
      </div>

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

MultipleChoiceEditor.propTypes = {
  value: PropTypes.shape({
    text: PropTypes.string,
    options: PropTypes.arrayOf(PropTypes.string),
    correctIndex: PropTypes.number,
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
    options: PropTypes.arrayOf(PropTypes.string),
    correctIndex: PropTypes.string,
  }),
  className: PropTypes.string,
  isPublished: PropTypes.bool,
  onRequireUnpublish: PropTypes.func,
}
