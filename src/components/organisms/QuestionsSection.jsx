import React from 'react'
import PropTypes from 'prop-types'
import QuestionBuilder from './QuestionBuilder.jsx'

const QuestionsSection = ({ page, onChange, baseIndex, isPublished, onRequireUnpublish, onMediaUploaded, onAddQuestion }) => {
  return (
    <div>
      <h3 className="text-base font-semibold text-gray-700 mb-3">Questions</h3>
      <QuestionBuilder
        page={page}
        onChange={onChange}
        baseIndex={baseIndex}
        isPublished={isPublished}
        onRequireUnpublish={onRequireUnpublish}
        onMediaUploaded={onMediaUploaded}
        onAddQuestion={onAddQuestion}
      />
    </div>
  )
}

QuestionsSection.propTypes = {
  page: PropTypes.shape({
    multiple: PropTypes.bool,
    questions: PropTypes.array,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  baseIndex: PropTypes.number.isRequired,
  isPublished: PropTypes.bool,
  onRequireUnpublish: PropTypes.func,
  onMediaUploaded: PropTypes.func,
  onAddQuestion: PropTypes.func,
}

export default QuestionsSection
