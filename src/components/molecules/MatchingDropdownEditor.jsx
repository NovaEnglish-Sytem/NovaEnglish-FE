import React from 'react'
import PropTypes from 'prop-types'
import MatchingDropdownInline from './MatchingDropdownInline.jsx'
import { classes } from '../../config/theme/tokens.js'
import MediaUploader from './MediaUploader.jsx'

export default function MatchingDropdownEditor({
  value,
  onChange,
  errors = {},
  className = '',
  questionNumber,
  isPublished = false,
  onRequireUnpublish,
  onMediaUploaded,
  isMediaVisible: controlledMediaVisible,
  onToggleMedia,
}) {
  const v = React.useMemo(() => ({
    matchingTemplate: '',
    media: { imageFile: null, audioFile: null, imageUrl: '', audioUrl: '' },
    ...value,
  }), [value])

  const handleTemplateChange = (e) => {
    onChange?.({ ...v, matchingTemplate: e.target.value })
  }

  const set = (patch) => {
    onChange?.({ ...v, ...patch })
  }

  // Derive answers and dropdown options directly from text inside [ ]
  const { answers, options } = React.useMemo(() => {
    const tpl = String(v.matchingTemplate || '')
    const regex = /\[([^\]]+)\]/g
    const rawAnswers = []
    const opts = []
    let m
    while ((m = regex.exec(tpl)) !== null) {
      const ans = String(m[1] || '').trim()
      rawAnswers.push(ans)
      if (ans && !opts.includes(ans)) opts.push(ans)
    }
    return { answers: rawAnswers, options: opts }
  }, [v.matchingTemplate])

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
      <div className="rounded-md border border-gray-200 p-3 space-y-4">
        <div>
          <label htmlFor="matching-template" className="block mb-1 text-base font-normal text-gray-700">
            Matching Dropdown Text
          </label>
          <textarea
            id="matching-template"
            value={v.matchingTemplate}
            onChange={handleTemplateChange}
            placeholder="Type question here"
            className={[
              'w-full min-h-[120px] rounded-[5px] p-3 outline-none border focus:border-transparent focus:ring-2 transition-all duration-200',
              errors?.matchingTemplate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[#007a33]'
            ].join(' ')}
            aria-invalid={Boolean(errors?.matchingTemplate)}
          />
          {errors?.matchingTemplate && (
            <p className="mt-1 text-sm text-red-600">{errors.matchingTemplate}</p>
          )}
          <div className="mt-2 text-xs text-gray-500">
            Tip: Write each statement and wrap the correct matching answer in square brackets. For example: <code>walking around the town centre [entertainment]</code>.<br />
            Every value inside <code>[ ]</code> will automatically become a dropdown option.
          </div>
        </div>

        {v.matchingTemplate && options.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Preview:</div>
            <div className="rounded-[5px] border border-gray-200 bg-gray-50 p-3">
              <MatchingDropdownInline
                template={v.matchingTemplate}
                options={options}
                values={answers}
                onChange={() => {}}
                numberStart={questionNumber || 0}
                readonly
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 border border-gray-200 rounded-md">
        <div className="flex items-center justify-between px-3 py-2">
          <label className="text-sm font-medium text-gray-700">Attach media to this question (optional)</label>
          <button
            type="button"
            onClick={() => {
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

MatchingDropdownEditor.propTypes = {
  value: PropTypes.shape({
    matchingTemplate: PropTypes.string,
    media: PropTypes.shape({
      imageFile: PropTypes.any,
      audioFile: PropTypes.any,
      imageUrl: PropTypes.string,
      audioUrl: PropTypes.string,
    })
  }),
  onChange: PropTypes.func.isRequired,
  errors: PropTypes.shape({
    matchingTemplate: PropTypes.string,
  }),
  className: PropTypes.string,
  questionNumber: PropTypes.number,
  isPublished: PropTypes.bool,
  onRequireUnpublish: PropTypes.func,
  onMediaUploaded: PropTypes.func,
  isMediaVisible: PropTypes.bool,
  onToggleMedia: PropTypes.func,
}
