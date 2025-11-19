import React, { Suspense } from 'react'
import ShortAnswerInline from './ShortAnswerInline.jsx'
import { classes } from '../../config/theme/tokens.js'

const AudioPlayerMinimal = React.lazy(() => import('./AudioPlayerMinimal.jsx'))

const StudentQuestionCard = React.memo(function StudentQuestionCard({
  q,
  questionLabel,
  blankNumberStart,
  value,
  onChange,
  isListening,
  audioCount,
  onCommitAudio,
  onImageClick,
}) {
  const safeQ = q || {}
  const normType = React.useMemo(() => {
    const t = String(safeQ?.type || '')
    if (t === 'MCQ') return 'MULTIPLE_CHOICE'
    if (t === 'TFNG') return 'TRUE_FALSE_NOT_GIVEN'
    if (t === 'SHORT') return 'SHORT_ANSWER'
    return t
  }, [safeQ?.type])

  // Derive MCQ options from either q.choices (objects) or q.options (strings)
  const mcqOptions = React.useMemo(() => {
    // Preferred: structured choices from student API
    if (Array.isArray(safeQ?.choices) && safeQ.choices.length > 0) {
      return safeQ.choices.map((c, i) => ({
        key: c.value ?? c.key ?? i,
        labelHtml: c.labelHtml ?? c.html ?? null,
        label: c.label ?? c.text ?? ''
      }))
    }
    // Preview/editor: options array of strings
    if (Array.isArray(safeQ?.options) && safeQ.options.length > 0) {
      // If options are objects, try common fields
      if (typeof safeQ.options[0] === 'object') {
        return safeQ.options.map((o, i) => ({
          key: o.value ?? o.key ?? i,
          labelHtml: o.labelHtml ?? o.html ?? null,
          label: o.label ?? o.text ?? o.option ?? o.value ?? ''
        }))
      }
      return safeQ.options.map((text, i) => ({ key: String(i), labelHtml: null, label: String(text ?? '') }))
    }
    // Some payloads might provide an object map: { A: 'Jakarta', B: '...' }
    if (safeQ?.options && typeof safeQ.options === 'object' && !Array.isArray(safeQ.options)) {
      const entries = Object.entries(safeQ.options)
      if (entries.length > 0) {
        return entries.map(([k, v]) => ({ key: k, labelHtml: typeof v === 'string' ? v : String(v ?? '') }))
      }
    }
    // Sometimes provided as optionsHtml
    if (Array.isArray(safeQ?.optionsHtml) && safeQ.optionsHtml.length > 0) {
      return safeQ.optionsHtml.map((html, i) => ({ key: i, labelHtml: String(html ?? '') }))
    }
    // Fallback: optionA..optionD
    const letters = ['A','B','C','D']
    const fromLetters = letters
      .map((L, i) => ({ key: i, labelHtml: safeQ?.[`option${L}`] }))
      .filter(o => o.labelHtml != null)
    if (fromLetters.length > 0) return fromLetters
    return []
  }, [safeQ])

  // Normalize per-question media: support both image and audio
  const imageUrl = React.useMemo(() => {
    if (safeQ?.mediaType === 'IMAGE' && safeQ?.mediaUrl) return safeQ.mediaUrl
    if (safeQ?.media?.imageUrl) return safeQ.media.imageUrl
    return null
  }, [safeQ])
  const audioUrl = React.useMemo(() => {
    if (safeQ?.mediaType === 'AUDIO' && safeQ?.mediaUrl) return safeQ.mediaUrl
    if (safeQ?.media?.audioUrl) return safeQ.media.audioUrl
    return null
  }, [safeQ])

  if (!q) return null

  return (
    <div className="rounded-md border border-gray-200 p-3 sm:p-4 bg-white">
      {normType !== 'SHORT_ANSWER' && (
        <div className="text-sm sm:text-base font-semibold text-gray-700 mb-3">Question {questionLabel}</div>
      )}

      {normType !== 'SHORT_ANSWER' && (
        q.promptHtml ? (
          <div className="text-sm sm:text-base text-gray-700 mb-3 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: q.promptHtml }} />
        ) : (q.text ? (
          <div className="text-sm sm:text-base text-gray-700 mb-3 whitespace-pre-wrap">{q.text}</div>
        ) : null)
      )}

      {isListening && audioUrl && (
        <div className="mb-4 w-full max-w-sm mx-auto">
          <Suspense fallback={<div className="h-10" />}>
            <AudioPlayerMinimal
              src={audioUrl}
              maxPlays={2}
              playedCount={audioCount || 0}
              onCommitPlay={() => onCommitAudio?.(q.id)}
              releaseOnPause={false}
            />
          </Suspense>
        </div>
      )}

      {normType === 'MULTIPLE_CHOICE' && mcqOptions.length > 0 && (
        <div className="space-y-2">
          {mcqOptions.map((c, idx) => {
            const isSelected = String(value || '') === String(c.key)
            const strip = (html) => String(html || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
            let plain = c.label ?? c.labelText ?? c.text ?? c.option ?? c.value ?? strip(c.labelHtml)
            if (!plain || String(plain).trim() === '') plain = String(c.key)
            return (
              <label 
                key={idx} 
                className={[
                  'flex items-center gap-2 p-2 rounded cursor-pointer w-full text-sm sm:text-base',
                  isSelected ? 'bg-[#effaf3]' : 'hover:bg-gray-50'
                ].join(' ')}
              >
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  value={String(c.key)}
                  checked={isSelected}
                  onChange={(e) => onChange?.(e.target.value)}
                  className={["w-4 h-4", classes.accentControl, classes.focusBrand].join(' ')}
                />
                {c.labelHtml && c.labelHtml.trim() ? (
                  <div className={isSelected ? 'text-gray-900 font-medium' : 'text-gray-700'} dangerouslySetInnerHTML={{ __html: c.labelHtml }} />
                ) : (
                  <span className={isSelected ? 'text-gray-900 font-medium' : 'text-gray-700'}>
                    {String(plain ?? '')}
                  </span>
                )}
              </label>
            )}
          )}
        </div>
      )}

      {normType === 'TRUE_FALSE_NOT_GIVEN' && (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {[
            { key: 'T', label: 'True', legacy: ['T', 'TRUE'] },
            { key: 'F', label: 'False', legacy: ['F', 'FALSE'] },
            { key: 'NG', label: 'Not Given', legacy: ['NG', 'NOT_GIVEN'] },
          ].map(({ key, label, legacy }) => {
            const v = String(value ?? '').toUpperCase()
            const isSelected = legacy.includes(v)
            return (
              <label
                key={key}
                className={[
                  'inline-flex items-center gap-2 text-sm sm:text-base p-2 rounded flex-1 sm:flex-initial',
                  isSelected ? 'bg-green-50 border border-green-200' : 'border border-transparent hover:bg-gray-50'
                ].join(' ')}
              >
                <input
                  type="radio"
                  name={`tfng-${q.id}`}
                  checked={isSelected}
                  onChange={() => onChange?.(key)}
                  className={["w-4 h-4", classes.accentControl, classes.focusBrand].join(' ')}
                />
                <span className={isSelected ? 'text-gray-900 font-medium' : 'text-gray-700'}>{label}</span>
              </label>
            )
          })}
        </div>
      )}

      {normType === 'SHORT_ANSWER' && (() => {
        const saVals = Array.isArray(value) ? value : (value == null ? [] : [String(value)])
        const handleSAChange = (idx, v) => {
          const next = [...saVals]
          next[idx] = v
          onChange?.(next)
        }
        const htmlToText = (h) => String(h || '').replace(/<[^>]*>/g, '')
        const tpl = q.shortTemplate
          || q.shortTemplateHtml
          || (typeof q.text === 'string' && /\[.*\]/.test(q.text) ? q.text : '')
          || (typeof q.promptHtml === 'string' && /\[.*\]/.test(htmlToText(q.promptHtml)) ? htmlToText(q.promptHtml) : '')
        return (
          <div className="overflow-x-auto">
            <ShortAnswerInline
              template={tpl}
              values={saVals}
              onChange={handleSAChange}
              numberStart={blankNumberStart}
            />
          </div>
        )
      })()}

      {(imageUrl || (audioUrl && !isListening)) && (
        <div className="mt-3 flex flex-col gap-3">
          {imageUrl && (
            <div className="flex justify-center">
              <button type="button" onClick={() => onImageClick?.(imageUrl, `Question ${questionLabel}`)}>
                <img
                  src={imageUrl}
                  alt={`Question ${questionLabel}`}
                  className="h-40 sm:h-48 w-auto object-contain rounded border border-gray-200"
                />
              </button>
            </div>
          )}
          {audioUrl && !isListening && (
            <div className="w-full max-w-sm mx-auto">
              <Suspense fallback={<div className="h-10" />}>
                <AudioPlayerMinimal
                  src={audioUrl}
                  maxPlays={2}
                  playedCount={audioCount || 0}
                  onCommitPlay={() => onCommitAudio?.(q.id)}
                  releaseOnPause={false}
                />
              </Suspense>
            </div>
          )}
        </div>
      )}

    </div>
  )
})

export default StudentQuestionCard
