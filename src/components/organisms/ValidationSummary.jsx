import React from 'react'
import PropTypes from 'prop-types'

const ValidationSummary = ({ page, validatePage }) => {
  const res = validatePage(page)
  if (res.valid || !res.errors?.questions?.some((e) => Object.keys(e || {}).length > 0)) return null
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-3">
      <div className="text-sm font-medium text-red-700">Validation Errors (Current Page):</div>
      <ul className="list-disc pl-5 text-sm text-red-700 mt-1">
        {res.errors.questions.map((err, idx) => {
          const messages = []
          const e = err || {}

          // MCQ options: show a single concise message if any option error exists
          if (Array.isArray(e.options) && e.options.some(Boolean)) {
            messages.push('Fill in all answer options.')
          }

          // Other string messages (text, correctTFNG, shortTemplate, matchingTemplate, etc.)
          Object.entries(e).forEach(([key, value]) => {
            if (key === 'options') return
            if (typeof value === 'string' && value.trim()) {
              messages.push(value.trim())
            }
          })

          if (!messages.length) return null
          return (
            <li key={idx}>
              Question {idx + 1}: {messages.join(' ')}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

ValidationSummary.propTypes = {
  page: PropTypes.object.isRequired,
  validatePage: PropTypes.func.isRequired,
}

export default ValidationSummary
