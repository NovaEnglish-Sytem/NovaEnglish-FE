import React, { useState } from 'react'
import AudioPlayerMinimal from '../molecules/AudioPlayerMinimal.jsx'
import PageMedia from '../molecules/PageMedia.jsx'
import PropTypes from 'prop-types'
import { calculateQuestionNumber, parseInlineTemplate } from '../../utils/questionHelpers.js'
import ImageModal from '../molecules/ImageModal.jsx'

const PreviewBlock = ({ data, baseIndex = 0, currentPageIndex = 0, previewAnswers, _setPreviewAnswers }) => {
  const [imageModal, setImageModal] = useState({ isOpen: false, src: '', alt: '' })

  const handleImageClick = (src, alt) => {
    setImageModal({ isOpen: true, src, alt })
  }

  const closeImageModal = () => {
    setImageModal({ isOpen: false, src: '', alt: '' })
  }

  return (
    <>
      <ImageModal 
        isOpen={imageModal.isOpen} 
        onClose={closeImageModal} 
        imageSrc={imageModal.src} 
        imageAlt={imageModal.alt} 
      />
      <div className="space-y-4 sm:space-y-6">
        {data.storyMedia && (
          <PageMedia
            pageId={`tutor-preview`}
            media={[
              ...(data.storyMedia?.imageFile || data.storyMedia?.imageUrl ? [{ type: 'IMAGE', url: data.storyMedia.imageUrl, file: data.storyMedia.imageFile }] : []),
              ...(data.storyMedia?.audioFile || data.storyMedia?.audioUrl ? [{ type: 'AUDIO', url: data.storyMedia.audioUrl, file: data.storyMedia.audioFile }] : []),
            ]}
            audioCounts={{}}
            onCommitAudio={() => { /* unlimited for tutor */ }}
            onImageClick={(src, alt) => handleImageClick(src, alt || 'Story')}
            resolveSrc={(m) => m.file ? URL.createObjectURL(m.file) : m.url}
            maxPlays={null}
            audioKeyPrefix="TUTOR"
          />
        )}

        {data.storyText && (
          <div className="rounded-md border border-gray-200 p-3 sm:p-4 bg-white">
            <div className="editor-content text-sm sm:text-base text-gray-700" dangerouslySetInnerHTML={{ __html: data.storyText }} />
          </div>
        )}

        {data.instructions && (
          <div className="rounded-md border border-gray-200 p-3 sm:p-4 bg-gray-100">
            <div className="editor-content text-sm sm:text-base text-gray-800" dangerouslySetInnerHTML={{ __html: data.instructions }} />
          </div>
        )}

        <div className="space-y-4">
        {(data.questions || []).map((q, idx) => {
          const questionNum = calculateQuestionNumber(data.questions, idx, baseIndex)
          const questionKey = `page-${currentPageIndex}-q-${idx}`

          return (
            <div key={q.id || idx} className="rounded-md border border-gray-200 p-3 sm:p-4 bg-white">
              {(q.type === 'MCQ' || q.type === 'TFNG') && (
                <div className="text-sm sm:text-base font-semibold text-gray-700 mb-3">Question {questionNum}</div>
              )}

              {q.type === 'MCQ' && (
                <div className="space-y-3">
                  <div className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap">{q.text}</div>
                  <div className="space-y-2">
                    {[0,1,2,3].map((i) => {
                      const isSelected = previewAnswers[questionKey] === i
                      return (
                        <label key={i} className={["flex items-center gap-2 text-sm sm:text-base p-2 rounded", isSelected ? "bg-green-50 border border-green-200" : "border border-transparent"].join(' ')}>
                          <input type="radio" name={`preview-mcq-${questionKey}`} checked={isSelected} disabled className="w-4 h-4 accent-[#007a33]" />
                          <span className={isSelected ? "text-gray-900 font-medium" : "text-gray-700"}>
                            {q.options?.[i] || ''}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                  {(q.media?.imageFile || q.media?.imageUrl || q.media?.audioFile || q.media?.audioUrl) && (
                    <div className="flex flex-col gap-3 mt-3">
                      {(q.media?.imageFile || q.media?.imageUrl) && (
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleImageClick(
                              q.media.imageFile ? URL.createObjectURL(q.media.imageFile) : q.media.imageUrl,
                              `Question ${idx + 1}`
                            )}
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                          >
                            <img 
                              src={q.media.imageFile ? URL.createObjectURL(q.media.imageFile) : q.media.imageUrl} 
                              alt={`Question ${idx + 1}`} 
                              className="h-40 sm:h-48 w-auto object-contain rounded border border-gray-200" 
                            />
                          </button>
                        </div>
                      )}
                      {(q.media?.audioFile || q.media?.audioUrl) && (
                        <div className="w-full max-w-sm mx-auto">
                          <AudioPlayerMinimal
                            src={q.media.audioFile ? URL.createObjectURL(q.media.audioFile) : q.media.audioUrl}
                            maxPlays={null}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {q.type === 'TFNG' && (
                <div className="space-y-3">
                  <div className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap">{q.text}</div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    {[
                      { key: 'T', label: 'True' },
                      { key: 'F', label: 'False' },
                      { key: 'NG', label: 'Not Given' }
                    ].map(({ key, label }) => {
                      const isSelected = previewAnswers[questionKey] === key
                      return (
                        <label key={key} className={["inline-flex items-center gap-2 text-sm sm:text-base p-2 rounded flex-1 sm:flex-initial", isSelected ? "bg-green-50 border border-green-200" : "border border-transparent"].join(' ')}>
                          <input type="radio" name={`preview-tfng-${questionKey}`} checked={isSelected} disabled className="w-4 h-4 accent-[#007a33]" />
                          <span className={isSelected ? "text-gray-900 font-medium" : "text-gray-700"}>{label}</span>
                        </label>
                      )
                    })}
                  </div>
                  {(q.media?.imageFile || q.media?.imageUrl || q.media?.audioFile || q.media?.audioUrl) && (
                    <div className="flex flex-col gap-3 mt-3">
                      {(q.media?.imageFile || q.media?.imageUrl) && (
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleImageClick(
                              q.media.imageFile ? URL.createObjectURL(q.media.imageFile) : q.media.imageUrl,
                              `Question ${idx + 1}`
                            )}
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                          >
                            <img 
                              src={q.media.imageFile ? URL.createObjectURL(q.media.imageFile) : q.media.imageUrl} 
                              alt={`Question ${idx + 1}`} 
                              className="h-32 w-auto object-contain rounded border border-gray-200" 
                            />
                          </button>
                        </div>
                      )}
                      {(q.media?.audioFile || q.media?.audioUrl) && (
                        <div className="w-full max-w-sm mx-auto">
                          <AudioPlayerMinimal
                            src={q.media.audioFile ? URL.createObjectURL(q.media.audioFile) : q.media.audioUrl}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {q.type === 'SHORT' && (() => {
                const parts = parseInlineTemplate(q.shortTemplate, questionNum)

                return (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-1 text-sm sm:text-base text-gray-700 leading-relaxed">
                      {parts.map((part, i2) => (
                        part.type === 'text' ? (
                          <span key={i2} className="whitespace-pre-wrap">{part.content}</span>
                        ) : (
                          <span key={i2} className="inline-flex items-center gap-1">
                            <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-50 border border-green-300 text-xs font-medium text-green-700">{part.number}</span>
                            <input type="text" value={part.answer || ''} readOnly className="inline-block w-24 sm:w-32 h-7 sm:h-8 px-2 rounded border-2 border-green-300 bg-green-50 text-sm sm:text-base font-medium text-gray-800" title={`Correct answer: ${part.answer}`} />
                          </span>
                        )
                      ))}
                    </div>
                    {(q.media?.imageFile || q.media?.imageUrl || q.media?.audioFile || q.media?.audioUrl) && (
                      <div className="flex flex-col gap-3 mt-3">
                        {(q.media?.imageFile || q.media?.imageUrl) && (
                          <div className="flex justify-center">
                            <button
                              onClick={() => handleImageClick(
                                q.media.imageFile ? URL.createObjectURL(q.media.imageFile) : q.media.imageUrl,
                                `Question ${baseIndex + idx + 1}`
                              )}
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              <img 
                                src={q.media.imageFile ? URL.createObjectURL(q.media.imageFile) : q.media.imageUrl} 
                                alt={`Question ${baseIndex + idx + 1}`} 
                                className="h-40 sm:h-48 w-auto object-contain rounded border border-gray-200" 
                              />
                            </button>
                          </div>
                        )}
                        {(q.media?.audioFile || q.media?.audioUrl) && (
                          <div className="w-full max-w-sm mx-auto">
                            <AudioPlayerMinimal
                              src={q.media.audioFile ? URL.createObjectURL(q.media.audioFile) : q.media.audioUrl}
                              maxPlays={null}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          )
        })}
        </div>
      </div>
    </>
  )
}

PreviewBlock.propTypes = {
  data: PropTypes.object.isRequired,
  baseIndex: PropTypes.number,
  currentPageIndex: PropTypes.number,
  previewAnswers: PropTypes.object.isRequired,
  setPreviewAnswers: PropTypes.func.isRequired,
}

export default PreviewBlock
