import React from 'react'
import PropTypes from 'prop-types'
import { classes } from '../../config/theme/tokens.js'
import { Input } from '../atoms/Input.jsx'
import MediaUploader from './MediaUploader.jsx'
import { parseInlineTemplate } from '../../utils/questionHelpers.js'

export default function ShortAnswerEditor({
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
    shortTemplate: '',
    media: { imageFile: null, audioFile: null, imageUrl: '', audioUrl: '' },
    ...value,
  }), [value])


  const handleShortTemplateChange = (e) => {
    onChange?.({ ...v, shortTemplate: e.target.value })
  }

  const set = (patch) => {
    onChange?.({ ...v, ...patch })
  }

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
      <div className="rounded-md border border-gray-200 p-3">
        <label htmlFor="short-template" className="block mb-1 text-base font-normal text-gray-700">
          Short Answer Text
        </label>
        
        {/* Editor Mode */}
        <div className="mb-3">
          <textarea
            id="short-template"
            value={v.shortTemplate}
            onChange={handleShortTemplateChange}
            placeholder="Type the question here"
            className={[
              'w-full min-h-[120px] rounded-[5px] p-3 outline-none border focus:border-transparent focus:ring-2 transition-all duration-200',
              errors?.shortTemplate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[#007a33]'
            ].join(' ')}
            aria-invalid={Boolean(errors?.shortTemplate)}
          />
          {errors?.shortTemplate && (
            <p className="mt-1 text-sm text-red-600">{errors.shortTemplate}</p>
          )}
          <div className="mt-2 text-xs text-gray-500">
            Tip: To define a correct answer, place it within square brackets.<br/>For instance: “What is the capital of France? [Paris]"
          </div>
        </div>

        {v.shortTemplate && parseInlineTemplate(v.shortTemplate, questionNumber).length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Preview:</div>
            <div className="rounded-[5px] border border-gray-200 bg-gray-50 p-3">
              <div className="flex flex-wrap items-center gap-1 text-sm text-gray-700 leading-relaxed">
                {parseInlineTemplate(v.shortTemplate, questionNumber).map((part, idx) => {
                  if (part.type === 'text') {
                    const raw = String(part.content || '')
                    const lines = raw.split(/\n/)
                    const nodes = []
                    lines.forEach((ln, li) => {
                      if (li > 0) {
                        nodes.push(<div key={`br-${idx}-${li}`} className="basis-full h-0" />)
                      }
                      if (ln) {
                        nodes.push(
                          <span key={`t-${idx}-${li}`} className="whitespace-pre-wrap">{ln}</span>
                        )
                      }
                    })
                    return nodes
                  }
                  return (
                    <span key={idx} className="inline-flex items-center gap-1">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white border border-gray-300 text-xs font-medium text-gray-600">
                        {part.number}
                      </span>
                      <input
                        type="text"
                        value={String(part.answer || '').toLowerCase()}
                        readOnly
                        className="inline-block w-32 h-7 px-2 rounded border border-gray-300 bg-white text-sm"
                        placeholder={`Answer ${part.number}`}
                      />
                    </span>
                  )
                })}
              </div>
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

ShortAnswerEditor.propTypes = {
  value: PropTypes.shape({
    shortTemplate: PropTypes.string,
    media: PropTypes.shape({
      imageFile: PropTypes.any,
      audioFile: PropTypes.any,
      imageUrl: PropTypes.string,
      audioUrl: PropTypes.string,
    })
  }),
  onChange: PropTypes.func.isRequired,
  errors: PropTypes.shape({
    shortTemplate: PropTypes.string,
  }),
  className: PropTypes.string,
  questionNumber: PropTypes.number,
  isPublished: PropTypes.bool,
  onRequireUnpublish: PropTypes.func,
}
