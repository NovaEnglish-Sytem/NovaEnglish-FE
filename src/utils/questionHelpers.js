export const parseShortAnswers = (template) => {
  if (typeof template !== 'string') return []
  const answers = []
  const regex = /\[([^\]]+)\]/g
  let match
  while ((match = regex.exec(template)) !== null) {
    answers.push(match[1])
  }
  return answers
}

export const parseInlineTemplate = (template, startNumber = 1) => {
  if (!template) return []
  const parts = []
  let lastIndex = 0
  const regex = /\[([^\]]*)\]/g
  let match
  let counter = startNumber

  while ((match = regex.exec(template)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: template.substring(lastIndex, match.index) })
    }
    parts.push({ type: 'input', number: counter++, answer: match[1] })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < template.length) {
    parts.push({ type: 'text', content: template.substring(lastIndex) })
  }

  return parts
}

export const calculateQuestionNumber = (questions, currentIndex, baseIndex = 0) => {
  let questionNum = baseIndex + 1
  for (let i = 0; i < currentIndex; i++) {
    const prevQuestion = questions[i]
    if (prevQuestion.type === 'SHORT') {
      const matches = (prevQuestion.shortTemplate?.match(/\[([^\]]*)\]/g) || [])
      questionNum += matches.length > 0 ? matches.length : 1
    } else {
      questionNum += 1
    }
  }
  return questionNum
}

export const getQuestionNumbers = (question, startNum) => {
  if (question.type === 'SHORT') {
    const matches = (question.shortTemplate?.match(/\[([^\]]*)\]/g) || [])
    if (matches.length > 0) {
      return Array.from({ length: matches.length }, (_, i) => startNum + i)
    }
  }
  return [startNum]
}

export const generateUniqueId = () => {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}
