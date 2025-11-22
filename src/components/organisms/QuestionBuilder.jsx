import React from 'react'
import PropTypes from 'prop-types'
import { classes } from '../../config/theme/tokens.js'
import QuestionCard from '../molecules/QuestionCard.jsx'
import MultipleChoiceEditor from '../molecules/MultipleChoiceEditor.jsx'
import TFNGEditor from '../molecules/TFNGEditor.jsx'
import ShortAnswerEditor from '../molecules/ShortAnswerEditor.jsx'
import MatchingDropdownEditor from '../molecules/MatchingDropdownEditor.jsx'
import { Checkbox } from '../atoms/Checkbox.jsx'
import { ConfirmDialog } from '../molecules/ConfirmDialog.jsx'
import { parseShortAnswers, generateUniqueId, calculateQuestionNumber, getQuestionNumbers } from '../../utils/questionHelpers.js'

export const validateQuestion = (q) => {
  const errs = {}
  if (q.type === 'MCQ') {
    if (!q.text || !q.text.trim()) errs.text = 'Please enter the question text'
    const opts = q.options || []
    const optErrs = [0,1,2,3].map((i) => {
      const v = (opts[i] ?? '').trim()
      return v ? null : 'Required'
    })
    if (optErrs.some(Boolean)) errs.options = optErrs
    if (q.correctIndex === null || q.correctIndex === undefined) errs.correctIndex = 'Please select the correct answer'
  } else if (q.type === 'TFNG') {
    if (!q.text || !q.text.trim()) errs.text = 'Please enter the question text'
    if (!q.correctTFNG) errs.correctTFNG = 'Please select the correct answer'
  } else if (q.type === 'SHORT') {
    const tpl = q.shortTemplate || ''
    const answers = parseShortAnswers(tpl)
    // Check for empty brackets
    const hasEmptyBrackets = /\[\s*\]/.test(tpl)
    
    if (!tpl.trim()) {
      errs.shortTemplate = 'Please enter the text with [answers]'
    } else if (hasEmptyBrackets) {
      errs.shortTemplate = 'Empty brackets [] detected. Please add answers inside the brackets, e.g., [answer]'
    } else if (answers.length === 0) {
      errs.shortTemplate = 'Please include at least one [answer] using square brackets'
    }
  } else if (q.type === 'MATCHING') {
    const tpl = q.matchingTemplate || ''
    const hasEmptyBrackets = /\[\s*\]/.test(tpl)
    const hasAnyBracket = /\[[^\]]+\]/.test(tpl)

    if (!tpl.trim()) {
      errs.matchingTemplate = 'Please enter the text with [answers]'
    } else if (hasEmptyBrackets) {
      errs.matchingTemplate = 'Empty brackets [] detected. Please add answers inside the brackets, e.g., [answer]'
    } else if (!hasAnyBracket) {
      errs.matchingTemplate = 'Please include at least one [answer] using square brackets'
    }
  }
  return errs
}

export const validatePage = (page) => {
  const errors = { questions: [] }
  let valid = true
  for (const q of page.questions || []) {
    const err = validateQuestion(q)
    errors.questions.push(err)
    if (Object.keys(err).length > 0) valid = false
  }
  return { valid, errors }
}

export default function QuestionBuilder({
  page,
  onChange,
  className = '',
  baseIndex = 0,
  isPublished = false,
  onRequireUnpublish,
  onMediaUploaded,
  onAddQuestion,
}) {
  const p = React.useMemo(() => ({
    multiple: false,
    questions: [],
    ...page,
  }), [page])

  const [localErrors, setLocalErrors] = React.useState([])
  const listRef = React.useRef(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)
  const [pendingDeleteIndex, setPendingDeleteIndex] = React.useState(null)

  React.useEffect(() => {
    // keep localErrors length in sync with questions
    setLocalErrors((prev) => {
      const copy = Array.isArray(prev) ? [...prev] : []
      copy.length = p.questions.length
      return copy
    })
  }, [p.questions.length])

  const setPage = (patch) => {
    onChange?.({ ...p, ...patch })
  }

  const setQuestion = (index, patch) => {
    const qs = [...(p.questions || [])]
    qs[index] = { ...qs[index], ...patch }
    setPage({ questions: qs })
  }

  const addQuestionOfType = async (type) => {
    if (!p.multiple && (p.questions?.length || 0) >= 1) return
    try {
      let pageId = p.id || null
      let itemId = null
      if (typeof onAddQuestion === 'function') {
        const ids = await onAddQuestion(type)
        pageId = ids?.pageId || pageId
        itemId = ids?.itemId || null
      }
      const base = { id: itemId || generateUniqueId(), type, media: { imageFile: null, audioFile: null, imageUrl: '', audioUrl: '' } }
      let q
      if (type === 'MCQ') {
        q = { ...base, text: '', options: ['', '', '', ''], correctIndex: null }
      } else if (type === 'TFNG') {
        q = { ...base, text: '', correctTFNG: null }
      } else {
        q = { ...base, shortTemplate: '' }
      }
      const nextQs = [...(p.questions || []), q]
      setPage({ id: pageId || p.id, questions: nextQs })
      requestAnimationFrame(() => {
        try {
          const el = listRef?.current?.lastElementChild
          if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        } catch (_) {}
      })
    } catch (_) {
      const base = { id: generateUniqueId(), type, media: { imageFile: null, audioFile: null, imageUrl: '', audioUrl: '' } }
      const q = type === 'MCQ' ? { ...base, text: '', options: ['', '', '', ''], correctIndex: null }
        : (type === 'TFNG' ? { ...base, text: '', correctTFNG: null } : { ...base, shortTemplate: '' })
      setPage({ questions: [...(p.questions || []), q] })
    }
  }

  const deleteQuestion = (index) => {
    const qs = [...(p.questions || [])]
    qs.splice(index, 1)
    setPage({ questions: qs })
  }

  const moveUp = (index) => {
    if (index <= 0) return
    const qs = [...(p.questions || [])]
    const tmp = qs[index - 1]
    qs[index - 1] = qs[index]
    qs[index] = tmp
    setPage({ questions: qs })
  }

  const moveDown = (index) => {
    const qs = [...(p.questions || [])]
    if (index >= qs.length - 1) return
    const tmp = qs[index + 1]
    qs[index + 1] = qs[index]
    qs[index] = tmp
    setPage({ questions: qs })
  }

  const [newType, setNewType] = React.useState('MCQ')

  const [mediaOpenById, setMediaOpenById] = React.useState({})
  const idsKey = React.useMemo(() => (p.questions || []).map(q => q.id || '').join(','), [p.questions])
  React.useEffect(() => {
    setMediaOpenById((prev) => {
      const next = { ...prev }
      ;(p.questions || []).forEach(q => { if (next[q.id] === undefined) next[q.id] = false })
      return next
    })
  }, [idsKey])
  const toggleMediaOpen = (qid) => {
    setMediaOpenById((prev) => ({ ...prev, [qid]: !prev[qid] }))
  }

  const runValidation = (index) => {
    const q = p.questions[index]
    const err = validateQuestion(q)
    setLocalErrors((prev) => {
      const next = [...prev]
      next[index] = err
      return next
    })
  }

  return (
    <div className={['w-full', className].filter(Boolean).join(' ')}>
      {/* Grouping Control */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Checkbox
          id="page-multiple"
          checked={!!p.multiple}
          onChange={(e) => setPage({ multiple: e.target.checked })}
          label="This page contains multiple questions"
        />
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            className="h-10 px-3 rounded-[5px] border border-gray-300 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#007a33] w-full sm:w-auto min-w-[200px]"
            aria-label="Select Question Type"
          >
            <option value="MCQ">Multiple Choice</option>
            <option value="TFNG">True / False / Not Given</option>
            <option value="SHORT">Short Answer</option>
            <option value="MATCHING">Matching Dropdown</option>
          </select>
          <button
            type="button"
            disabled={!p.multiple && (p.questions?.length || 0) >= 1}
            onClick={() => addQuestionOfType(newType)}
            className={[
              classes.button.base,
              classes.button.outline,
              'h-10 px-3 whitespace-nowrap',
              (!p.multiple && (p.questions?.length || 0) >= 1) ? 'opacity-50 cursor-not-allowed' : ''
            ].join(' ')}
          >
            + Add Question
          </button>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setPendingDeleteIndex(null) }}
        onConfirm={() => {
          if (pendingDeleteIndex !== null) {
            deleteQuestion(pendingDeleteIndex)
          }
          setShowDeleteConfirm(false)
          setPendingDeleteIndex(null)
        }}
        type="delete"
        title="Delete Question?"
        message="Are you sure you want to delete this question? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>

      {/* Question Blocks */}
      <div ref={listRef} className="mt-4 space-y-4">
        {(p.questions || []).map((q, i) => {
          const currentNum = calculateQuestionNumber(p.questions, i, baseIndex)
          const questionNums = getQuestionNumbers(q, currentNum)

          return (
          <QuestionCard
            key={q.id || i}
            number={currentNum}
            type={q.type}
            onMoveUp={() => moveUp(i)}
            onMoveDown={() => moveDown(i)}
            onDelete={() => { setPendingDeleteIndex(i); setShowDeleteConfirm(true) }}
            questionNumbers={questionNums}
            defaultOpen
          >
            {q.type === 'MCQ' && (
              <div onBlur={() => runValidation(i)}>
                <MultipleChoiceEditor
                  value={q}
                  onChange={(vv) => setQuestion(i, vv)}
                  errors={localErrors[i] || {}}
                  isPublished={isPublished}
                  onRequireUnpublish={onRequireUnpublish}
                  onMediaUploaded={onMediaUploaded}
                  isMediaVisible={Boolean(q?.media?.imageFile || q?.media?.audioFile || q?.media?.imageUrl || q?.media?.audioUrl || mediaOpenById[q.id])}
                  onToggleMedia={() => toggleMediaOpen(q.id)}
                />
              </div>
            )}
            {q.type === 'MATCHING' && (
              <div onBlur={() => runValidation(i)}>
                <MatchingDropdownEditor
                  value={q}
                  onChange={(vv) => setQuestion(i, vv)}
                  errors={localErrors[i] || {}}
                  questionNumber={currentNum}
                />
              </div>
            )}
            {q.type === 'TFNG' && (
              <div onBlur={() => runValidation(i)}>
                <TFNGEditor
                  value={q}
                  onChange={(vv) => setQuestion(i, vv)}
                  errors={localErrors[i] || {}}
                  isPublished={isPublished}
                  onRequireUnpublish={onRequireUnpublish}
                  onMediaUploaded={onMediaUploaded}
                  isMediaVisible={Boolean(q?.media?.imageFile || q?.media?.audioFile || q?.media?.imageUrl || q?.media?.audioUrl || mediaOpenById[q.id])}
                  onToggleMedia={() => toggleMediaOpen(q.id)}
                />
              </div>
            )}
            {q.type === 'SHORT' && (
              <div onBlur={() => runValidation(i)}>
                <ShortAnswerEditor
                  value={q}
                  onChange={(vv) => setQuestion(i, vv)}
                  errors={localErrors[i] || {}}
                  questionNumber={currentNum}
                  isPublished={isPublished}
                  onRequireUnpublish={onRequireUnpublish}
                  onMediaUploaded={onMediaUploaded}
                  isMediaVisible={Boolean(q?.media?.imageFile || q?.media?.audioFile || q?.media?.imageUrl || q?.media?.audioUrl || mediaOpenById[q.id])}
                  onToggleMedia={() => toggleMediaOpen(q.id)}
                />
              </div>
            )}
          </QuestionCard>
          )
        })}
      </div>
    </div>
  )
}

QuestionBuilder.propTypes = {
  page: PropTypes.shape({
    multiple: PropTypes.bool,
    questions: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      type: PropTypes.oneOf(['MCQ','TFNG','SHORT','MATCHING']).isRequired,
    }))
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  onAddQuestion: PropTypes.func,
}
