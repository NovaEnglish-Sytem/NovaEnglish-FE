import React from 'react'
import PageMedia from '../molecules/PageMedia.jsx'

const QuestionDisplay = React.memo(function QuestionDisplay({
  pageData,
  answers,
  onChange,
  isListening,
  audioCounts,
  onCommitAudio,
  onImageClick,
  questionNumberOffset = 0,
  QuestionCardComponent,
}) {
  if (!pageData) return null
  const { id: pageId, storyPassage, instructions, questions, pageMedia = [] } = pageData

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageMedia
        pageId={pageId}
        media={pageMedia}
        audioCounts={audioCounts}
        onCommitAudio={onCommitAudio}
        onImageClick={onImageClick}
      />

      {storyPassage && (
        <div className="rounded-md border border-gray-200 p-3 sm:p-4 bg-white">
          <div className="editor-content text-sm sm:text-base text-gray-700" dangerouslySetInnerHTML={{ __html: storyPassage }} />
        </div>
      )}

      {instructions && (
        <div className="rounded-md border border-gray-200 p-3 sm:p-4 bg-gray-100">
          <div className="editor-content text-sm sm:text-base text-gray-800" dangerouslySetInnerHTML={{ __html: instructions }} />
        </div>
      )}

      <div className="space-y-4">
        {(() => {
          const meta = []
          let counter = Number(questionNumberOffset) + 1
          for (const q of questions) {
            const type = String(q.type)
            let blanks = 1
            if (type === 'SHORT_ANSWER') {
              const tpl = String(q.shortTemplate || '')
              const matches = tpl.match(/\[[^\]]*\]/g)
              blanks = Math.max(1, (matches ? matches.length : 0))
            }
            const start = counter
            const label = blanks > 1 ? `${counter}-${counter + blanks - 1}` : String(counter)
            meta.push({ id: q.id, label, start })
            counter += blanks
          }
          const QC = QuestionCardComponent
          return questions.map((q, idx) => (
            <QC
              key={q.id}
              q={q}
              questionLabel={meta[idx].label}
              blankNumberStart={meta[idx].start}
              value={answers[q.id]?.value}
              onChange={(val) => onChange(q.id, q.type, val)}
              isListening={isListening}
              audioCount={audioCounts[q.id] || 0}
              onCommitAudio={onCommitAudio}
              onImageClick={onImageClick}
            />
          ))
        })()}
      </div>
    </div>
  )
})

export default QuestionDisplay
