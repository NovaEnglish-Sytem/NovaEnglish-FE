import React from 'react'
import PropTypes from 'prop-types'

const QuizSettings = ({ quizDuration, setQuizDuration, isPublished, onRequireUnpublish }) => {
  return (
    <div className="border-t border-gray-200 pt-6">
      <h3 className="text-base font-semibold text-gray-700 mb-3">Quiz Settings</h3>
      <div className="flex items-center gap-3">
        <label htmlFor="quiz-duration" className="text-sm font-medium text-gray-700">
          Duration (minutes):
        </label>
        <input
          id="quiz-duration"
          type="number"
          min="0"
          max="180"
          value={quizDuration}
          readOnly={!!isPublished}
          onFocus={(e) => { if (isPublished) { try { e.target.blur() } catch (_) {} } }}
          onMouseDown={(e) => { if (isPublished) { e.preventDefault(); onRequireUnpublish && onRequireUnpublish() } }}
          onKeyDown={(e) => { if (isPublished) { e.preventDefault(); onRequireUnpublish && onRequireUnpublish() } }}
          onWheel={(e) => { if (isPublished) { e.preventDefault() } }}
          onChange={(e) => {
            if (isPublished) { onRequireUnpublish && onRequireUnpublish(); return }
            const val = parseInt(e.target.value)
            if (Number.isNaN(val)) {
              setQuizDuration(0)
            } else {
              setQuizDuration(Math.max(0, val))
            }
          }}
          className={[
            'w-24 h-10 px-3 rounded-[5px] border border-gray-300 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#007a33]',
            isPublished ? 'bg-gray-50 cursor-not-allowed' : ''
          ].join(' ')}
        />
        <span className="text-sm text-gray-500">Total time for entire quiz</span>
      </div>
      {(!Number.isFinite(quizDuration) || quizDuration <= 0) && (
        <div className="mt-2 text-sm text-red-600">Please set a duration greater than 0 before publishing.</div>
      )}
    </div>
  )
}

QuizSettings.propTypes = {
  quizDuration: PropTypes.number.isRequired,
  setQuizDuration: PropTypes.func.isRequired,
  isPublished: PropTypes.bool,
  onRequireUnpublish: PropTypes.func,
}

export default QuizSettings
