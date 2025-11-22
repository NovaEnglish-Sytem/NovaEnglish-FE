import { useMemo, useState, useCallback } from 'react'

export default function useCreateQuestionsState(initialPages = [defaultInitialPage()], validatePage) {
  const [pages, setPages] = useState(initialPages)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)

  const updateCurrentPage = useCallback((patch) => {
    setPages(prev => {
      const next = [...prev]
      next[currentPageIndex] = { ...next[currentPageIndex], ...patch }
      return next
    })
  }, [currentPageIndex])

  const addPage = useCallback(() => {
    setPages(prev => [...prev, { ...defaultInitialPage() }])
    setCurrentPageIndex((i) => i + 1)
  }, [])

  // Insert a page after specific index and select it
  const addPageAfter = useCallback((index) => {
    setPages(prev => {
      const next = [...prev]
      next.splice(index + 1, 0, { ...defaultInitialPage() })
      return next
    })
    setCurrentPageIndex(index + 1)
  }, [])

  const deletePageAt = useCallback((index) => {
    setPages(prev => {
      const next = [...prev]
      next.splice(index, 1)
      return next
    })
    setCurrentPageIndex((i) => Math.max(0, Math.min(i, pages.length - 2)))
  }, [pages.length])

  const baseIndexForCurrent = useMemo(() => {
    let count = 0
    for (let i = 0; i < currentPageIndex; i++) {
      const page = pages[i]
      for (const q of page.questions || []) {
        if (q.type === 'SHORT') {
          const matches = (q.shortTemplate?.match(/\[([^\]]*)\]/g) || [])
          count += matches.length > 0 ? matches.length : 1
        } else if (q.type === 'MATCHING') {
          const matches = (q.matchingTemplate?.match(/\[([^\]]*)\]/g) || [])
          count += matches.length > 0 ? matches.length : 1
        } else {
          count += 1
        }
      }
    }
    return count
  }, [pages, currentPageIndex])

  const totalQuestions = useMemo(() => {
    let count = 0
    for (const page of pages) {
      for (const q of page.questions || []) {
        if (q.type === 'SHORT') {
          const matches = (q.shortTemplate?.match(/\[([^\]]*)\]/g) || [])
          count += matches.length > 0 ? matches.length : 1
        } else if (q.type === 'MATCHING') {
          const matches = (q.matchingTemplate?.match(/\[([^\]]*)\]/g) || [])
          count += matches.length > 0 ? matches.length : 1
        } else {
          count += 1
        }
      }
    }
    return count
  }, [pages])

  const validateAllPages = useCallback(() => {
    if (!validatePage) return { valid: true, errors: [] }
    const results = pages.map(p => validatePage(p))
    return { valid: results.every(r => r.valid), errors: results.map(r => r.errors) }
  }, [pages, validatePage])

  return {
    pages,
    setPages,
    currentPageIndex,
    setCurrentPageIndex,
    updateCurrentPage,
    addPage,
    addPageAfter,
    deletePageAt,
    baseIndexForCurrent,
    totalQuestions,
    validateAllPages,
  }
}

export function defaultInitialPage() {
  return {
    storyMedia: { imageFile: null, audioFile: null, imageUrl: '', audioUrl: '' },
    storyText: '',
    instructions: '',
    multiple: true,
    questions: [],
  }
}
