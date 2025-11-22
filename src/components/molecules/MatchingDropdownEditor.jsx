import React from 'react'
import PropTypes from 'prop-types'
import MatchingDropdownInline from './MatchingDropdownInline.jsx'

export default function MatchingDropdownEditor({
  value,
  onChange,
  errors = {},
  className = '',
  questionNumber,
}) {
  const v = React.useMemo(() => ({
    matchingTemplate: '',
    ...value,
  }), [value])

  const handleTemplateChange = (e) => {
    onChange?.({ ...v, matchingTemplate: e.target.value })
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
            placeholder={"11 walking around the town centre [entertainment]\n12 helping at concerts [publicity]"}
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
            Tip: Wrap each correct answer in square brackets. For example: <code>11 walking around the town centre [entertainment]</code>.<br />
            All values inside <code>[ ]</code> will automatically become the dropdown options.
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
    </div>
  )
}

MatchingDropdownEditor.propTypes = {
  value: PropTypes.shape({
    matchingTemplate: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
  errors: PropTypes.shape({
    matchingTemplate: PropTypes.string,
  }),
  className: PropTypes.string,
  questionNumber: PropTypes.number,
}
