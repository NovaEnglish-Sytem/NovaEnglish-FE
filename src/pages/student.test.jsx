import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react'
import ShortAnswerInline from '../components/molecules/ShortAnswerInline.jsx'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { testApi } from '../lib/api.js'
// Lazy-load heavy components
const AudioPlayerMinimal = React.lazy(() => import('../components/molecules/AudioPlayerMinimal.jsx'))
import { classes } from '../config/theme/tokens.js'
const ImageModal = React.lazy(() => import('../components/molecules/ImageModal.jsx'))
import ConfirmDialog from '../components/molecules/ConfirmDialog.jsx'
import PageMedia from '../components/molecules/PageMedia.jsx'
import QuestionDisplay from '../components/organisms/QuestionDisplay.jsx'
import StudentQuestionCard from '../components/molecules/StudentQuestionCard.jsx'
import { ROUTES } from '../config/routes.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import LoadingState from '../components/organisms/LoadingState.jsx'
import { TestStorage } from '../utils/testStorage.js'
import { useRouteGuard, isValidUUID } from '../hooks/useRouteGuard.js'
import { TEST_CONFIG } from '../config/testConfig.js'
import { TEST_MESSAGES } from '../config/messages.js'
import { useCountdownModal } from '../hooks/useCountdownModal.js'
import { useTimer } from '../hooks/useTimer.js'
import { useAutosave } from '../hooks/useAutosave.js'

const formatMMSS = (secs) => {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export const StudentTestPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { attemptId } = useParams()
  useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [redirecting, setRedirecting] = useState(false)
  const topRef = useRef(null)
  const submittingRef = useRef(false)
  const dirtyRef = useRef(false) // Track if answers changed since last DB sync
  const saveTimeoutRef = useRef(null) // Debounce localStorage writes
  const lastAnswersHashRef = useRef('') // Prevent duplicate saves
  const attemptFinalizedRef = useRef(false) // Track if attempt is finalized (submitted/expired)
  // StrictMode guard: skip unmount cleanup if unmounted immediately after mount (dev double-invoke)
  const skipCleanupRef = useRef(true)
  // Reload guard: if page is reloading, do not cleanup attempt
  const reloadingRef = useRef(false)
  
  // SECURITY: Validate attemptId format with smart redirect
  useRouteGuard({
    paramName: 'attemptId',
    paramValue: attemptId,
    validator: isValidUUID,
    errorMessage: 'Invalid test attempt ID',
    saveValid: true,  // Save valid attemptId to session
    routeTemplate: ROUTES.studentTest  // Redirect to last valid test URL
  })
  
  // Test mode and metadata
  const [mode, setMode] = useState('single')
  const [categoryIds, setCategoryIds] = useState([])
  const [completedCategoryIds, setCompletedCategoryIds] = useState([])
  const [recordId, setRecordId] = useState(null)
  const [preparedCategories, setPreparedCategories] = useState([])
  const [categoryNames, setCategoryNames] = useState({})
  
  // Current test state
  const [categoryName, setCategoryName] = useState('')
  // Timer: managed by useTimer; onExpired => show expired modal
  const { remainingSeconds, setRemaining: setRemainingSeconds } = useTimer(null, () => {
    if (!submittingRef.current) {
      stopAllAudio()
      expiredModal.start()
    }
  })
  const [totalPages, setTotalPages] = useState(0)
  const [allPages, setAllPages] = useState([])  // Store all pages
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [totalQuestionsInTest, setTotalQuestionsInTest] = useState(0)
  const [answers, setAnswers] = useState({})
  const [audioCounts, setAudioCounts] = useState({})
  const [sessionToken, setSessionToken] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [saving, setSaving] = useState(false)
  const syncIntervalRef = useRef(null)
  // removed unused: lastSyncRef
  const [imageModal, setImageModal] = useState({ open: false, src: '', alt: '' })

  useEffect(() => {
    if (!topRef.current) return
    try {
      topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch {}
  }, [currentPageIndex])

  // Countdown modals (draft + expired)
  const draftModal = useCountdownModal(TEST_CONFIG.MODAL.COUNTDOWN_START, () => handleConfirmDraft())
  const expiredModal = useCountdownModal(TEST_CONFIG.MODAL.COUNTDOWN_START, () => handleConfirmExpired())

  // Stop all playing audio elements in the page
  const stopAllAudio = () => {
    try {
      const nodes = document.querySelectorAll('audio')
      nodes.forEach((a) => {
        try { a.pause() } catch {}
        try { a.currentTime = 0 } catch {}
      })
    } catch {}
  }

  // Store attemptId in ref for event handlers
  const attemptIdRef = useRef(attemptId)
  attemptIdRef.current = attemptId

  // SPA unmount cleanup: if user navigates away before finishing (not expired/submitted), delete attempt and temps
  useEffect(() => {
    // After small delay, allow cleanup (prevents StrictMode dev double-unmount)
    const guardTimer = setTimeout(() => { skipCleanupRef.current = false }, 1500)
    return () => {
      clearTimeout(guardTimer)
      if (skipCleanupRef.current) return
      if (reloadingRef.current) return
      if (!attemptFinalizedRef.current && attemptIdRef.current) {
        try { testApi.cleanupAttempt(attemptIdRef.current) } catch (_) {}
        try { TestStorage.clearLocal(attemptIdRef.current) } catch (_) {}
      }
    }
    // No dependency array - only run cleanup on component unmount, not on attemptId changes
  }, [])

  // beforeunload/visibilitychange: DO NOT cleanup on reload – preserve attempt/session
  useEffect(() => {
    const handleBeforeUnload = () => { reloadingRef.current = true }
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        reloadingRef.current = true
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
    // No dependency array - register once, use ref for current attemptId
  }, [])

  // Load session token from storage (localStorage restore handled by fetchTestData from database)
  useEffect(() => {
    const storedToken = TestStorage.getSessionToken(attemptId)
    if (storedToken) {
      setSessionToken(storedToken)
    }
  }, [attemptId])

  // Guard: check package status (PUBLISHED/DRAFT)
  const ensurePublishedOrAbort = async () => {
    const res = await testApi.checkPackageStatus(attemptId)
    if (res?.ok) {
      const status = String(res?.data?.status || '').toUpperCase()
      if (status === 'DRAFT') {
        // Begin abort flow with modal and countdown
        stopAllAudio()
        setLoading(false)
        draftModal.start()
        return false
      }
      return true
    }
    // Non-OK responses: handle known cases without showing draft modal
    const code = String(res?.data?.code || res?.data?.error || '').toUpperCase()
    if (res?.status === 409 && code === 'PACKAGE_DRAFT') {
      // Explicit draft signal from backend
      stopAllAudio()
      setLoading(false)
      draftModal.start()
      return false
    }
    if (res?.status === 404) {
      // Attempt not found (likely cleaned up after package draft/unpublish or session loss)
      // Route through draft modal so user always sees the warning and countdown before leaving.
      // Do NOT clear TestStorage here so we can still restore meta for Test Overview; cleanup is handled in handleConfirmDraft.
      attemptFinalizedRef.current = true
      stopAllAudio()
      setLoading(false)
      draftModal.start()
      return false
    }
    if (res?.status === 403) {
      const reason = String(res?.data?.reason || '').toLowerCase()
      if (reason === 'session_not_found' || reason === 'session_expired' || reason === 'invalid_token') {
        // Session is no longer valid – treat same as draft/cleanup: show modal and wait for confirmation.
        // Do NOT clear TestStorage here so we can still restore meta for Test Overview; cleanup is handled in handleConfirmDraft.
        attemptFinalizedRef.current = true
        stopAllAudio()
        setLoading(false)
        draftModal.start()
        return false
      }
    }
    // Other errors: do not block actions with draft modal, but also do not navigate automatically
    return true
  }

  // Cleanup attempt then redirect based on mode
  const handleConfirmDraft = async () => {
    attemptFinalizedRef.current = true
    try { await testApi.cleanupAttempt(attemptId) } catch (_) {}
    sessionStorage.removeItem('last_valid_attemptId')
    // Reconstruct meta from current state OR stored meta to decide where to go next.
    let effectiveMode = mode
    let effectiveCategoryIds = categoryIds || []
    let effectiveCompleted = completedCategoryIds || []
    let effectiveRecordId = recordId
    let effectivePrepared = preparedCategories || []
    let effectiveCategoryNames = categoryNames || {}
    let currentCategoryId = location.state?.currentCategoryId || null

    try {
      const storedMeta = TestStorage.getLocal(attemptId) || {}
      if (!effectiveCategoryIds.length && Array.isArray(storedMeta.categoryIds)) {
        effectiveCategoryIds = storedMeta.categoryIds
      }
      if (!effectiveCompleted.length && Array.isArray(storedMeta.completedCategoryIds)) {
        effectiveCompleted = storedMeta.completedCategoryIds
      }
      if (!effectiveRecordId && storedMeta.recordId) {
        effectiveRecordId = storedMeta.recordId
      }
      if (!effectivePrepared.length && Array.isArray(storedMeta.preparedCategories)) {
        effectivePrepared = storedMeta.preparedCategories
      }
      if (!Object.keys(effectiveCategoryNames).length && storedMeta.categoryNames) {
        effectiveCategoryNames = storedMeta.categoryNames
      }
      if (!currentCategoryId) {
        currentCategoryId = storedMeta.currentCategoryId || null
      }
      if (!effectiveMode || effectiveMode === 'single') {
        const storedMode = storedMeta.mode || (Array.isArray(effectiveCategoryIds) && effectiveCategoryIds.length > 1 ? 'multiple' : 'single')
        effectiveMode = storedMode
      }
    } catch (_) {}

    if (effectiveMode === 'multiple') {
      // Remove the just-unpublished/current category from prepared list so it becomes unavailable in overview
      if (currentCategoryId && Array.isArray(effectivePrepared)) {
        effectivePrepared = effectivePrepared.filter(pc => pc.categoryId !== currentCategoryId)
      }

      // Persist checkpoint so TestOverview can restore after reload
      try {
        const checkpoint = {
          mode: 'multiple',
          categoryIds: effectiveCategoryIds,
          completedCategoryIds: effectiveCompleted,
          checkpoint: true,
          recordId: effectiveRecordId,
          preparedCategories: effectivePrepared,
          categoryNames: effectiveCategoryNames,
          packageChanged: true,
        }
        sessionStorage.setItem('test_overview_checkpoint', JSON.stringify(checkpoint))
      } catch (_) {}

      // Redirect to overview using reconstructed meta
      navigate(ROUTES.studentTestOverview, {
        replace: true,
        state: {
          mode: 'multiple',
          categoryIds: effectiveCategoryIds,
          completedCategoryIds: effectiveCompleted,
          checkpoint: true,
          recordId: effectiveRecordId,
          preparedCategories: effectivePrepared,
          categoryNames: effectiveCategoryNames,
          packageChanged: true,
        }
      })
    } else {
      // Single-category flow: go back to dashboard
      navigate(ROUTES.studentDashboard, { replace: true })
    }
  }

  // OPTIMIZED: Merged meta persistence - single source of truth with memoization
  // Priority: navigation state > current state > stored (no overwrites)
  const metaPayload = useMemo(() => {
    const nav = location.state || {}
    const stored = TestStorage.getLocal(attemptId) || {}
    
    // Normalize arrays/objects with length checks to avoid overwriting stored meta with empty values
    const navCategoryIds = Array.isArray(nav.categoryIds) && nav.categoryIds.length > 0 ? nav.categoryIds : null
    const stateCategoryIds = Array.isArray(categoryIds) && categoryIds.length > 0 ? categoryIds : null
    const storedCategoryIds = Array.isArray(stored.categoryIds) ? stored.categoryIds : []

    const navCompleted = Array.isArray(nav.completedCategoryIds) ? nav.completedCategoryIds : null
    const stateCompleted = Array.isArray(completedCategoryIds) ? completedCategoryIds : null
    const storedCompleted = Array.isArray(stored.completedCategoryIds) ? stored.completedCategoryIds : []

    const navPrepared = Array.isArray(nav.preparedCategories) && nav.preparedCategories.length > 0 ? nav.preparedCategories : null
    const statePrepared = Array.isArray(preparedCategories) && preparedCategories.length > 0 ? preparedCategories : null
    const storedPrepared = Array.isArray(stored.preparedCategories) ? stored.preparedCategories : []

    const navNames = nav.categoryNames && Object.keys(nav.categoryNames).length > 0 ? nav.categoryNames : null
    const stateNames = categoryNames && Object.keys(categoryNames).length > 0 ? categoryNames : null
    const storedNames = stored.categoryNames || {}

    // Build payload with robust fallback chain
    const payload = {
      categoryIds: navCategoryIds || stateCategoryIds || storedCategoryIds,
      completedCategoryIds: navCompleted || stateCompleted || storedCompleted,
      recordId: nav.recordId || recordId || stored.recordId || null,
      preparedCategories: navPrepared || statePrepared || storedPrepared,
      categoryNames: navNames || stateNames || storedNames,
      currentCategoryId: nav.currentCategoryId || stored.currentCategoryId || null
    }
    
    // Determine mode
    const navMode = typeof nav.mode === 'string' ? nav.mode.toLowerCase() : null
    if (navMode === 'multiple' || mode === 'multiple' || payload.categoryIds.length > 1) {
      payload.mode = 'multiple'
    } else {
      payload.mode = 'single'
    }
    
    return payload
  }, [location.state, categoryIds, completedCategoryIds, recordId, preparedCategories, categoryNames, mode, attemptId])

  useEffect(() => {
    // Only save if has meaningful data (avoid empty writes)
    if (metaPayload.categoryIds.length > 0 || metaPayload.recordId) {
      TestStorage.saveLocal(attemptId, metaPayload)
    }
  }, [metaPayload, attemptId])

  // On mount/reload: perform a status check early (after attemptId/session loaded)
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!attemptId) return
      const ok = await ensurePublishedOrAbort()
      if (!ok || cancelled) return
    }
    run()
    return () => { cancelled = true }
  }, [attemptId])

  // Mark dirty on answers change; actual save handled by useAutosave
  useEffect(() => {
    if (Object.keys(answers).length === 0) return
    dirtyRef.current = true
  }, [answers, audioCounts, currentPageIndex])

  // Page index persistence is now handled in the debounced save above
  
  // Autosave: debounced local + periodic DB sync
  useAutosave({
    attemptId,
    answers,
    audioCounts,
    currentPageIndex,
    meta: { categoryIds, completedCategoryIds, recordId, preparedCategories, categoryNames, mode },
    sessionToken,
    onSessionInvalid: () => { attemptFinalizedRef.current = true },
    onDraftDetected: () => { attemptFinalizedRef.current = true; stopAllAudio(); setLoading(false); draftModal.start() },
  })

  // Timer ticking handled by useTimer; setRemainingSeconds is called when API provides remaining time
  
  // Handle timer expiration - auto submit and navigate
  const handleTimerExpired = async () => {
    // Before doing auto-submit, ensure the package is still published.
    // If it has been unpublished/drafted, this will trigger the standard draftModal
    // flow and we should NOT proceed with auto-submit.
    const ok = await ensurePublishedOrAbort()
    if (!ok) return

    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    stopAllAudio()
    attemptFinalizedRef.current = true
    
    try {
      const storedMetaEarly = TestStorage.getLocal(attemptId) || {}
      
      // Submit test (backend will cleanup)
      const answersArray = Object.entries(answers).map(([itemId, answerData]) => ({
        itemId,
        type: answerData.type,
        value: answerData.value
      }))
      
      // FINAL SYNC: best-effort save to temporary storage before submit
      try {
        await testApi.saveAnswers(attemptId, { answers: answersArray }, sessionToken)
      } catch (_) {}

      const submitRes = await testApi.submit(attemptId, { answers: answersArray }, sessionToken)
      if (!submitRes?.ok) {
        if (submitRes?.status === 403) {
          const reason = String(submitRes?.data?.reason || '').toLowerCase()
          if (reason === 'session_not_found' || reason === 'session_expired' || reason === 'invalid_token') {
            attemptFinalizedRef.current = true
          }
        }
        // If package turned draft at timeout submit, show modal then cleanup/redirect
        if (submitRes?.status === 409) {
          const code = String(submitRes?.data?.code || submitRes?.data?.error || '').toUpperCase()
          if (code === 'PACKAGE_DRAFT') {
            stopAllAudio(); setLoading(false); draftModal.start()
            return
          }
        }
        // Don't throw, continue with navigation
      }
      
      try { TestStorage.clearLocal(attemptId) } catch (_) {}
      const effectiveCategoryIds = (Array.isArray(categoryIds) && categoryIds.length > 0) ? categoryIds : (storedMetaEarly.categoryIds || [])
      const baseCompleted = Array.isArray(completedCategoryIds) ? completedCategoryIds : (storedMetaEarly.completedCategoryIds || [])
      const basePrepared = (Array.isArray(preparedCategories) && preparedCategories.length > 0) ? preparedCategories : (storedMetaEarly.preparedCategories || [])
      const currentCategoryId = location.state?.currentCategoryId || storedMetaEarly.currentCategoryId
      const newCompleted = currentCategoryId ? [...baseCompleted, currentCategoryId] : baseCompleted
      const remainingPrepared = basePrepared.filter(pc => !newCompleted.includes(pc.categoryId))

      // Build overview checkpoint when needed
      const shouldGoOverview = effectiveCategoryIds.length > 1 && remainingPrepared.length > 0
      
      // CRITICAL FIX: Save checkpoint to sessionStorage BEFORE clearing localStorage
      if (shouldGoOverview) {
        try {
          const checkpoint = {
            mode: 'multiple',
            categoryIds: effectiveCategoryIds,
            completedCategoryIds: newCompleted,
            checkpoint: true,
            recordId,
            preparedCategories: remainingPrepared,
            categoryNames: { ...categoryNames, ...(currentCategoryId ? { [currentCategoryId]: categoryName } : {}) }
          }
          sessionStorage.setItem('test_overview_checkpoint', JSON.stringify(checkpoint))
        } catch {}
      }

      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current)
      
      TestStorage.clearLocal(attemptId)
      sessionStorage.removeItem('last_valid_attemptId')

      if (!shouldGoOverview) {
        // All done or single mode
        const id = submitRes?.data?.attempt?.id || attemptId
        navigate(ROUTES.studentResult.replace(':attemptId', encodeURIComponent(id)), { replace: true })
      } else {
        navigate(ROUTES.studentTestOverview, {
          replace: true,
          state: {
            mode: 'multiple',
            categoryIds: effectiveCategoryIds,
            completedCategoryIds: newCompleted,
            checkpoint: true,
            recordId,
            preparedCategories: remainingPrepared,
            categoryNames: { ...categoryNames, ...(currentCategoryId ? { [currentCategoryId]: categoryName } : {}) }
          }
        })
      }
    } catch (e) {
      navigate(ROUTES.dashboardStudent, { replace: true })
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  // Expiration handled by useTimer onExpired callback

  // Confirm handler for expired modal
  const handleConfirmExpired = async () => {
    await handleTimerExpired()
  }

  // Prevent back navigation (improved)
  useEffect(() => {
    let blockCount = 0
    
    const handlePopState = () => {
      blockCount++
      // Push state multiple times to make it harder to go back
      for (let i = 0; i < 3; i++) {
        window.history.pushState(null, '', window.location.href)
      }
      
      // Only show alert every 3rd attempt to reduce annoyance
      if (blockCount % 3 === 0) {
        alert(TEST_MESSAGES.BACK_DISABLED)
      }
    }
    
    // Initialize history state
    window.history.pushState(null, '', window.location.href)
    window.addEventListener('popstate', handlePopState)
    
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])
  
  // HYBRID AUTO-SAVE: Beacon save on page unload + passive recovery on visibility
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (Object.keys(answers).length === 0 && Object.keys(audioCounts).length === 0) return
      
      // Flush debounced save immediately
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        TestStorage.saveLocal(attemptId, { answers, audioCounts, currentPageIndex })
      }
      
      const answersArray = Object.entries(answers).map(([itemId, answerData]) => ({
        itemId,
        type: answerData.type,
        value: answerData.value
      }))
      
      testApi.beaconSave(attemptId, { answers: answersArray, audioCounts, currentPageIndex })
    }
    
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        // User leaving tab - beacon save
        if (Object.keys(answers).length > 0 || Object.keys(audioCounts).length > 0) {
          const answersArray = Object.entries(answers).map(([itemId, answerData]) => ({
            itemId,
            type: answerData.type,
            value: answerData.value
          }))
          testApi.beaconSave(attemptId, { answers: answersArray, audioCounts, currentPageIndex })
        }
      } else if (document.visibilityState === 'visible') {
        // User returning - passive recovery: trigger immediate sync if dirty
        if (dirtyRef.current && sessionToken && Object.keys(answers).length > 0) {
          try {
            const answersArray = Object.entries(answers).map(([itemId, answerData]) => ({
              itemId,
              type: answerData.type,
              value: answerData.value
            }))
            const res = await testApi.saveAnswers(attemptId, {
              answers: answersArray,
              audioCounts,
              currentPageIndex,
              meta: {
                categoryIds,
                completedCategoryIds,
                recordId,
                preparedCategories,
                categoryNames,
                mode
              }
            }, sessionToken)
            if (!res?.ok && res?.status === 403) {
              const reason = String(res?.data?.reason || '').toLowerCase()
              if (reason === 'session_not_found' || reason === 'session_expired' || reason === 'invalid_token') {
                attemptFinalizedRef.current = true
                return
              }
            }
            // If package turned to draft during visibility save, show modal then cleanup and redirect
            if (!res?.ok && res?.status === 409) {
              const code = String(res?.data?.code || res?.data?.error || '').toUpperCase()
              if (code === 'PACKAGE_DRAFT') {
                attemptFinalizedRef.current = true
                stopAllAudio()
                setLoading(false)
                draftModal.start()
                return
              }
            }
          } catch (e) {
            // Silent fail - sync will retry later
          }
        }
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [attemptId, answers, audioCounts, currentPageIndex, sessionToken])

  const setAnswer = useCallback((itemId, type, value) => {
    setAnswers(prev => ({ ...prev, [itemId]: { type, value } }))
  }, [])
  
  const incAudio = useCallback((itemId) => {
    setAudioCounts(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }))
  }, [])

  // Get current page data from allPages array
  const currentPageData = useMemo(() => {
    return allPages[currentPageIndex] || null
  }, [allPages, currentPageIndex])

  // Build map of expected blank counts per item (SHORT_ANSWER & MATCHING_DROPDOWN count blanks in template)
  const expectedBlankCounts = useMemo(() => {
    const map = {}
    try {
      for (const page of allPages || []) {
        for (const q of page?.questions || []) {
          if (!q || !q.id) continue
          if (q.type === 'SHORT_ANSWER') {
            const matches = String(q.shortTemplate || '').match(/\[[^\]]*\]/g) || []
            map[q.id] = Math.max(1, matches.length)
          } else if (q.type === 'MATCHING_DROPDOWN') {
            const matches = String(q.matchingTemplate || '').match(/\[[^\]]*\]/g) || []
            map[q.id] = Math.max(1, matches.length)
          } else {
            map[q.id] = 1
          }
        }
      }
    } catch {}
    return map
  }, [allPages])

  const progressPct = useMemo(() => {
    if (!totalQuestionsInTest) return 0
    let answeredCount = 0
    
    for (const [itemId, ans] of Object.entries(answers || {})) {
      if (!ans) continue
      
      if (ans.type === 'SHORT_ANSWER' || ans.type === 'MATCHING_DROPDOWN') {
        // Count filled blanks (non-empty after trim)
        const vals = Array.isArray(ans.value)
          ? ans.value
          : (ans.value == null ? [] : [String(ans.value)])
        const filled = vals.map(v => String(v ?? '').trim()).filter(v => v.length > 0).length
        const need = expectedBlankCounts[itemId] || Math.max(1, filled)
        answeredCount += Math.min(filled, need)
      } else {
        // MCQ/TFNG: +1 if answered
        const v = String(ans.value ?? '').trim()
        if (v.length > 0) answeredCount += 1
      }
    }
    
    return Math.min(100, Math.round((answeredCount / totalQuestionsInTest) * 100))
  }, [answers, expectedBlankCounts, totalQuestionsInTest])

  const isListening = useMemo(() => categoryName.toLowerCase().includes('listen'), [categoryName])
  
  // Calculate global question number offset from previous pages (per-blank for SHORT_ANSWER & MATCHING_DROPDOWN)
  const questionNumberOffset = useMemo(() => {
    if (!allPages || currentPageIndex === 0) return 0
    let offset = 0
    for (let i = 0; i < currentPageIndex; i++) {
      const qs = allPages[i]?.questions || []
      for (const q of qs) {
        const t = String(q.type)
        if (t === 'SHORT_ANSWER') {
          const tpl = String(q.shortTemplate || '')
          const matches = tpl.match(/\[[^\]]*\]/g)
          offset += Math.max(1, (matches ? matches.length : 0))
        } else if (t === 'MATCHING_DROPDOWN') {
          const tpl = String(q.matchingTemplate || '')
          const matches = tpl.match(/\[[^\]]*\]/g)
          offset += Math.max(1, (matches ? matches.length : 0))
        } else {
          offset += 1
        }
      }
    }
    return offset
  }, [allPages, currentPageIndex])
  
  const allPageQuestionsAnswered = useMemo(() => {
    if (!currentPageData?.questions) return false
    return currentPageData.questions.every(q => {
      const answer = answers[q.id]
      if (!answer) return false
      if (q.type === 'SHORT_ANSWER' || q.type === 'MATCHING_DROPDOWN') {
        const tpl = q.type === 'SHORT_ANSWER'
          ? String(q.shortTemplate || '')
          : String(q.matchingTemplate || '')
        const blanks = (tpl.match(/\[[^\]]*\]/g) || []).length || 1
        const arr = Array.isArray(answer.value)
          ? answer.value
          : (answer.value == null ? [] : [String(answer.value)])
        // All blanks must be filled (non-empty after trim)
        for (let i = 0; i < blanks; i++) {
          const v = String(arr[i] || '').trim()
          if (!v) return false
        }
        return true
      }
      const val = String(answer.value || '').trim()
      return val.length > 0
    })
  }, [currentPageData, answers])
  
  const isLastPage = useMemo(() => {
    return currentPageIndex >= totalPages - 1
  }, [currentPageIndex, totalPages])

  const fetchTestData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get stored session token
      const storedToken = TestStorage.getSessionToken(attemptId)
      const res = await testApi.get(attemptId, storedToken)
      
      // Check if API call failed
      if (!res.ok) {
        const errorData = res.data
        const errorStatus = res.status
        // Draft guard: if backend signals package turned to draft, trigger abort flow
        const code = String(errorData?.code || errorData?.error || '').toUpperCase()
        const msg = String(errorData?.message || '')
        if (errorStatus === 409 && (code === 'PACKAGE_DRAFT' || /package is in draft/i.test(msg))) {
          await ensurePublishedOrAbort()
          return
        }
        
        // Handle explicit wrong_attempt: redirect to currently active attempt
        if (errorData?.reason === 'wrong_attempt' && errorData?.activeAttemptId) {
          setRedirecting(true)
          navigate(ROUTES.studentTest.replace(':attemptId', errorData.activeAttemptId), { replace: true })
          return
        }

        // SECURITY: If test already completed, redirect to dashboard (no modal needed)
        if (errorData?.message?.includes('already completed') || errorData?.message?.includes('Cannot access completed')) {
          setRedirecting(true)
          navigate(ROUTES.studentDashboard, { replace: true })
          return
        }

        // For session_expired, session_not_found, generic 403/404: show draft modal first, let its confirm handler manage cleanup + navigation
        const reason = String(errorData?.reason || '').toLowerCase()
        const isSessionLost = reason === 'session_expired' || reason === 'session_not_found'
        const isGenericForbidden = errorStatus === 403
        const isNotFound = errorStatus === 404

        if (isSessionLost || isGenericForbidden || isNotFound) {
          // Do NOT clear TestStorage here so we can still restore meta (mode/categoryIds/etc) when coming
          // from a multiple-category flow; cleanup will be handled centrally in handleConfirmDraft.
          attemptFinalizedRef.current = true
          stopAllAudio()
          setLoading(false)
          draftModal.start()
          return
        }

        // Fallback: unexpected error – also route through draft modal for consistent UX
        attemptFinalizedRef.current = true
        stopAllAudio()
        setLoading(false)
        draftModal.start()
        return
      }
      
      const data = res?.data
      
      // Store session token from response
      if (data?.sessionToken) {
        setSessionToken(data.sessionToken)
        TestStorage.saveSessionToken(attemptId, data.sessionToken)
      }
      
      // IMPROVED: Restore meta with database fallback for cross-browser support
      const localMeta = TestStorage.getLocal(attemptId) || {}
      const nav = location.state || {}
      const dbMeta = data?.testMeta || {} // Backend should return saved meta
      
      // Priority: navigation state > localStorage > database > empty
      const nextCategoryIds = Array.isArray(nav.categoryIds) && nav.categoryIds.length > 0
        ? nav.categoryIds
        : (Array.isArray(localMeta.categoryIds) && localMeta.categoryIds.length > 0
          ? localMeta.categoryIds
          : (Array.isArray(dbMeta.categoryIds) ? dbMeta.categoryIds : []))
      
      const nextCompleted = Array.isArray(nav.completedCategoryIds)
        ? nav.completedCategoryIds
        : (Array.isArray(localMeta.completedCategoryIds)
          ? localMeta.completedCategoryIds
          : (Array.isArray(dbMeta.completedCategoryIds) ? dbMeta.completedCategoryIds : []))
      
      const nextRecordId = nav.recordId ?? localMeta.recordId ?? dbMeta.recordId ?? null
      
      const nextPrepared = Array.isArray(nav.preparedCategories) && nav.preparedCategories.length > 0
        ? nav.preparedCategories
        : (Array.isArray(localMeta.preparedCategories) && localMeta.preparedCategories.length > 0
          ? localMeta.preparedCategories
          : (Array.isArray(dbMeta.preparedCategories) ? dbMeta.preparedCategories : []))
      
      const nextCategoryNames = nav.categoryNames || localMeta.categoryNames || dbMeta.categoryNames || {}
      const nextMode = nav.mode || localMeta.mode || dbMeta.mode || (nextCategoryIds.length > 1 ? 'multiple' : 'single')
      
      // CRITICAL: Restore currentCategoryId with proper fallback chain
      // Priority: navigation > localStorage > database > current attempt's category
      const nextCurrentCategoryId = nav.currentCategoryId 
        || localMeta.currentCategoryId 
        || dbMeta.currentCategoryId 
        || data?.category?.id  // ✅ Fallback to current attempt's category
        || null
      
      if (nextCategoryIds.length > 0) {
        setCategoryIds(nextCategoryIds)
        setMode(nextMode)
      }
      if (nextCompleted) setCompletedCategoryIds(nextCompleted)
      if (nextRecordId) setRecordId(nextRecordId)
      if (nextPrepared.length > 0) setPreparedCategories(nextPrepared)
      if (Object.keys(nextCategoryNames).length > 0) setCategoryNames(nextCategoryNames)
      
      setCategoryName(data?.category?.name || '')
      
      // Set remaining time from API response
      const remaining = data?.remainingSeconds ?? null
      if (remaining !== null) {
        setRemainingSeconds(remaining)
        
        // CHECK: If already expired when loaded (0 seconds or negative)
        if (remaining <= 0) {
          // Don't show modal yet, let useEffect handle it
          // This prevents double trigger
        }
      }
      
      setTotalPages(data?.totalPages || 0)
      setAllPages(data?.pages || [])  // Store all pages
      setTotalQuestionsInTest(data?.totalQuestions || 0)
      
      // RESTORE FROM DATABASE (priority for device switching / reconnect)
      // This allows student to resume from last saved page even on different device
      const dbAnswers = data?.savedAnswers || {}
      const dbAudioCounts = data?.savedAudioCounts || {}
      const dbPageIndex = data?.savedPageIndex ?? null
      
      // Restore answers from database if exists
      if (Object.keys(dbAnswers).length > 0) {
        setAnswers(dbAnswers)
      }
      
      // Restore audio counts from database if exists
      if (Object.keys(dbAudioCounts).length > 0) {
        setAudioCounts(dbAudioCounts)
      }
      
      // IMPROVED: Restore page index with forward-only policy (prevent backward navigation on refresh)
      // 1) localStorage (same device immediate refresh)
      // 2) Database (last synced for device switching)
      // 3) Use the HIGHER value to prevent going backward on refresh
      const localData = TestStorage.getLocal(attemptId)
      let localPageIndex = 0
      if (localData?.currentPageIndex !== undefined && localData.currentPageIndex !== null) {
        localPageIndex = Number(localData.currentPageIndex) || 0
      }
      
      const dbPageIndexSafe = (dbPageIndex !== null && dbPageIndex >= 0) ? dbPageIndex : 0
      
      // Use the HIGHER index (forward-only policy)
      let restoredPageIndex = Math.max(localPageIndex, dbPageIndexSafe)
      
      // Clamp within [0, totalPages - 1]
      const maxIdx = Math.max(0, (data?.totalPages || 0) - 1)
      restoredPageIndex = Math.min(Math.max(0, restoredPageIndex), maxIdx)
      
      setCurrentPageIndex(restoredPageIndex)

      // Persist meta for refresh resilience
      TestStorage.saveLocal(attemptId, {
        categoryIds: nextCategoryIds,
        completedCategoryIds: nextCompleted,
        recordId: nextRecordId,
        preparedCategories: nextPrepared,
        categoryNames: nextCategoryNames,
        mode: nextMode,
        currentCategoryId: nextCurrentCategoryId  // ✅ Use derived value with fallbacks
      })
      
    } catch (e) {
      // Catch unexpected exceptions (network errors, JSON parse errors, etc.)
      setRedirecting(true)
      navigate(ROUTES.studentDashboard, { replace: true })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTestData()
    return () => {}
  }, [attemptId])

  // NOTE: Timer countdown is handled in the "Timer countdown - Auto-submit when expired" useEffect above
  // This old timer tick has been removed to prevent duplicate logic and reference errors

  const openImageModal = (src, alt = '') => setImageModal({ open: true, src, alt })
  const closeImageModal = () => setImageModal({ open: false, src: '', alt: '' })

  // Fallback redirect for unexpected errors (should never trigger)
  useEffect(() => {
    if (error && !currentPageData && !loading && !redirecting) {
      setRedirecting(true)
      const timer = setTimeout(() => {
        navigate(ROUTES.studentDashboard, { replace: true })
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [error, currentPageData, loading, redirecting, navigate])

  // Redirecting state - prevent rendering test UI during redirect
  // IMPORTANT: If draft modal is active, show it regardless of loading/redirecting state
  

  if (redirecting) {
    return (
      <div className="min-h-screen bg-neutral-100">
        <LoadingState message="Redirecting..." fullPage />
      </div>
    )
  }

  if (loading && !currentPageData) {
    return (
      <div className="min-h-screen bg-neutral-100">
        <LoadingState message="Loading test..." fullPage />
      </div>
    )
  }

  // Error state - should never reach here due to catch-all redirects
  if (error && !currentPageData) {
    return (
      <div className="min-h-screen bg-neutral-100">
        <LoadingState message="Redirecting to dashboard..." fullPage />
      </div>
    )
  }

  const gotoNext = async () => {
    if (saving) return
    setSaving(true)
    // Guard: block when package is in DRAFT
    const ok = await ensurePublishedOrAbort()
    if (!ok) { setSaving(false); return }
    // Always validate session on Next. Use saveAnswers to validate token even if no changes.
    const answersArray = Object.entries(answers).map(([itemId, answerData]) => ({
      itemId,
      type: answerData.type,
      value: answerData.value
    }))
    const res = await testApi.saveAnswers(attemptId, {
      answers: answersArray, // can be empty; backend still validates token & merges metadata
      audioCounts,
      currentPageIndex,
      meta: {
        categoryIds,
        completedCategoryIds,
        recordId,
        preparedCategories,
        categoryNames,
        mode
      }
    }, sessionToken)

    if (!res.ok) {
      // Draft guard on response
      const draftCode = String(res?.data?.code || res?.data?.error || '').toUpperCase()
      const draftMsg = String(res?.data?.message || '')
      if (res.status === 409 && (draftCode === 'PACKAGE_DRAFT' || /package is in draft/i.test(draftMsg))) {
        await ensurePublishedOrAbort()
        return
      }
      const authCode = res?.data?.code || res?.data?.error
      const authMsg = String(res?.data?.message || '')
      const isInvalid = res.status === 401 || res.status === 403 || String(authCode).toUpperCase() === 'SESSION_INVALIDATED' || /Invalid session token/i.test(authMsg)
      if (isInvalid) {
        // Don't logout during navigation - just mark finalized to prevent cleanup race condition
        attemptFinalizedRef.current = true
        // Continue to next page instead of logout to avoid disrupting test flow
      }
      // For other errors, continue to next page to avoid blocking
    } else {
      dirtyRef.current = false
      lastAnswersHashRef.current = JSON.stringify({ answers, audioCounts, currentPageIndex })
    }
    // Move to next page
    setCurrentPageIndex(prev => prev + 1)
    setSaving(false)
  }

  const handleSubmit = async () => {
    // Guard: block when package is in DRAFT
    const ok = await ensurePublishedOrAbort()
    if (!ok) return
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    
    try {
      // Read stored meta early (before any clear) for refresh-safe checkpoint
      const storedMetaEarly = TestStorage.getLocal(attemptId) || {}
      // Prepare answers array from localStorage
      const answersArray = Object.entries(answers).map(([itemId, answerData]) => ({
        itemId,
        type: answerData.type,
        value: answerData.value
      }))
      
      if (answersArray.length === 0) {
        setError('Please answer at least one question')
        submittingRef.current = false
        return
      }
      
      // Force sync to database before submit
      if (sessionToken && Object.keys(answers).length > 0) {
        try {
          const res = await testApi.saveAnswers(attemptId, {
            answers: answersArray,
            audioCounts,
            currentPageIndex,
            meta: {
              categoryIds,
              completedCategoryIds,
              recordId,
              preparedCategories,
              categoryNames,
              mode
            }
          }, sessionToken)
          if (!res.ok) {
            // Draft guard on response
            const code = String(res?.data?.code || res?.data?.error || '').toUpperCase()
            const msg = String(res?.data?.message || '')
            if (res.status === 409 && (code === 'PACKAGE_DRAFT' || /package is in draft/i.test(msg))) {
              await ensurePublishedOrAbort()
              submittingRef.current = false
              return
            }
            if (res.status === 403) {
              const reason = String(res?.data?.reason || '').toLowerCase()
              if (reason === 'session_not_found' || reason === 'session_expired' || reason === 'invalid_token') {
                attemptFinalizedRef.current = true
              }
            }
            setError(res?.data?.message || 'Failed to submit test')
            submittingRef.current = false
            return
          }
        } catch (e) {
          // Failed final sync - continue with submit
        }
      }
      
      // Submit test with answers from localStorage
      const result = await testApi.submit(attemptId, { answers: answersArray }, sessionToken)
      if (!result.ok) {
        // Draft guard on submit response
        const code = String(result?.data?.code || result?.data?.error || '').toUpperCase()
        const msg = String(result?.data?.message || '')
        if (result.status === 409 && (code === 'PACKAGE_DRAFT' || /package is in draft/i.test(msg))) {
          await ensurePublishedOrAbort()
          submittingRef.current = false
          return
        }
        setError(result?.data?.message || 'Failed to submit test')
        submittingRef.current = false
        return
      }
      // Mark as finalized to prevent SPA-unmount cleanup from deleting completed attempt
      attemptFinalizedRef.current = true
      // Stop any running timers before navigation
      // autosave timers are managed inside useAutosave; nothing to clear here
      stopAllAudio()

      // Navigate based on effective mode/meta
      const effectiveCategoryIds = (Array.isArray(categoryIds) && categoryIds.length > 0) ? categoryIds : (storedMetaEarly.categoryIds || [])
      const currentCategoryId = result?.data?.categoryId || location.state?.currentCategoryId || storedMetaEarly.currentCategoryId
      const baseCompleted = Array.isArray(completedCategoryIds) ? completedCategoryIds : (storedMetaEarly.completedCategoryIds || [])
      const basePrepared = (Array.isArray(preparedCategories) && preparedCategories.length > 0) ? preparedCategories : (storedMetaEarly.preparedCategories || [])
      const newCompleted = currentCategoryId ? [...baseCompleted, currentCategoryId] : baseCompleted
      const remainingPrepared = basePrepared.filter(pc => !newCompleted.includes(pc.categoryId))
      
      const shouldGoOverview = effectiveCategoryIds.length > 1 && remainingPrepared.length > 0
      
      // CRITICAL FIX: Save checkpoint BEFORE clearing localStorage
      if (shouldGoOverview) {
        try {
          const checkpoint = {
            mode: 'multiple',
            categoryIds: effectiveCategoryIds,
            completedCategoryIds: newCompleted,
            checkpoint: true,
            recordId,
            preparedCategories: remainingPrepared,
            categoryNames: { ...categoryNames, ...(currentCategoryId ? { [currentCategoryId]: categoryName } : {}) }
          }
          sessionStorage.setItem('test_overview_checkpoint', JSON.stringify(checkpoint))
        } catch {}
      }
      
      // Clear localStorage and session AFTER checkpoint saved
      TestStorage.clearLocal(attemptId)
      sessionStorage.removeItem('last_valid_attemptId')

      if (!shouldGoOverview) {
        const id = result?.data?.attempt?.id || attemptId
        navigate(ROUTES.studentResult.replace(':attemptId', encodeURIComponent(id)), { replace: true })
      } else {
        navigate(ROUTES.studentTestOverview, {
          replace: true,
          state: {
            mode: 'multiple',
            categoryIds: effectiveCategoryIds,
            completedCategoryIds: newCompleted,
            checkpoint: true,
            recordId,
            preparedCategories: remainingPrepared,
            categoryNames: { ...categoryNames, ...(currentCategoryId ? { [currentCategoryId]: categoryName } : {}) }
          }
        })
      }
    } catch (e) {
      setError(e?.message || 'Failed to submit test')
      submittingRef.current = false
    }
  }

  return (
    <div className="min-h-screen bg-neutral-100" ref={topRef}>
      <div className="max-w-[1200px] mx-auto px-4 py-6">
        {/* Header - One Line: Category | Progress Bar + % | Timer | Sync Status */}
        <header className="mb-6">
          {/* Category progress indicator removed as per spec */}
          
          <div className="flex items-center gap-4">
            <div className="text-lg font-semibold text-gray-700 whitespace-nowrap min-w-[150px]">
              {categoryName || 'Test'}
            </div>
            
            <div className="flex-1 flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#76c043] transition-all duration-300" 
                  style={{ width: `${progressPct}%` }} 
                />
              </div>
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap min-w-[45px] text-right">
                {progressPct}%
              </span>
            </div>
            
            
            <div className={["text-xl font-semibold whitespace-nowrap min-w-[80px] text-right",
              (typeof remainingSeconds === 'number' && remainingSeconds <= 59) ? 'text-red-600' : 'text-gray-700'
            ].join(' ')}>
              {formatMMSS(remainingSeconds || 0)}
            </div>
          </div>
        </header>

        {/* Content */}
        <main>
          {loading ? (
            <div className="text-center text-gray-500 py-12">Loading questions…</div>
          ) : error ? (
            <div className={[classes.whiteCard, 'p-6 text-center text-red-600'].join(' ')}>
              <p>{error}</p>
              <button 
                onClick={() => fetchTestData()} 
                className={[classes.button.base, classes.button.outline, 'mt-4'].join(' ')}
              >
                Retry
              </button>
            </div>
          ) : (
            <QuestionDisplay
              pageData={currentPageData}
              answers={answers}
              onChange={setAnswer}
              isListening={isListening}
              audioCounts={audioCounts}
              onCommitAudio={incAudio}
              onImageClick={openImageModal}
              questionNumberOffset={questionNumberOffset}
              QuestionCardComponent={StudentQuestionCard}
            />
          )}
        </main>

        <footer className="mt-8 flex items-center justify-end">
          <div className="flex gap-3">
            {isLastPage ? (
              <button
                type="button"
                className={[
                  classes.button.base,
                  allPageQuestionsAnswered && !submitting ? classes.button.primary : 'bg-gray-300 cursor-not-allowed',
                  'px-6 py-2'
                ].join(' ')}
                onClick={handleSubmit}
                disabled={!allPageQuestionsAnswered || submitting || saving}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            ) : (
              <button
                type="button"
                className={[
                  classes.button.base,
                  allPageQuestionsAnswered && !saving ? classes.button.primary : 'bg-gray-300 cursor-not-allowed',
                  'px-6 py-2'
                ].join(' ')}
                onClick={gotoNext}
                disabled={!allPageQuestionsAnswered || saving || submitting}
              >
                {saving ? 'Saving...' : 'Next'}
              </button>
            )}
          </div>
        </footer>
      </div>

      {submitting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 backdrop-blur-sm">
          <LoadingState message="Please wait..." fullPage={false} minHeight="min-h-[0]" />
        </div>
      )}

      <ConfirmDialog
        isOpen={expiredModal.isOpen}
        onClose={expiredModal.confirm}
        onConfirm={expiredModal.confirm}
        type="warning"
        title={TEST_MESSAGES.EXPIRED_TITLE}
        message={`${TEST_MESSAGES.EXPIRED_MESSAGE}\n\nAuto closing in ${(expiredModal.countdown ?? TEST_CONFIG.MODAL.COUNTDOWN_START)}s…`}
        confirmText={TEST_MESSAGES.ACTION_OK}
        cancelText=""
      />

      <ConfirmDialog
        isOpen={draftModal.isOpen}
        onClose={draftModal.confirm}
        onConfirm={draftModal.confirm}
        type="warning"
        title={TEST_MESSAGES.DRAFT_TITLE}
        message={`${TEST_MESSAGES.DRAFT_MESSAGE}\n\nAuto closing in ${(draftModal.countdown ?? TEST_CONFIG.MODAL.COUNTDOWN_START)}s…`}
        confirmText={TEST_MESSAGES.ACTION_OK}
        cancelText=""
      />

      {/* Image Preview Modal */}
      <Suspense fallback={null}>
        <ImageModal
          isOpen={imageModal.open}
          onClose={closeImageModal}
          imageSrc={imageModal.src}
          imageAlt={imageModal.alt}
        />
      </Suspense>
    </div>
  )
}

export default StudentTestPage
