import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { HiArrowLeft } from 'react-icons/hi'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import SurfaceCard from '../components/molecules/SurfaceCard.jsx'
import { classes } from '../config/theme/tokens.js'
import { buildTutorSidebar } from '../config/nav/tutor.js'
import { ROUTES } from '../config/routes.js'
import TutorHeaderRight from '../components/organisms/TutorHeaderRight.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { validatePage } from '../components/organisms/QuestionBuilder.jsx'
import { ConfirmDialog } from '../components/molecules/ConfirmDialog.jsx'
import api, { questionsApi, packagesApi } from '../lib/api.js'
import { ensurePageId, ensureItemId } from '../services/autosaveService.js'
import PackageNameBar from '../components/molecules/PackageNameBar.jsx'
import PageNavigator from '../components/molecules/PageNavigator.jsx'
import MediaSection from '../components/organisms/MediaSection.jsx'
import StorySection from '../components/organisms/StorySection.jsx'
import InstructionsSection from '../components/organisms/InstructionsSection.jsx'
import ValidationSummary from '../components/organisms/ValidationSummary.jsx'
import QuizSettings from '../components/organisms/QuizSettings.jsx'
import ActionsFooter from '../components/organisms/ActionsFooter.jsx'
import usePackageInfo from '../hooks/usePackageInfo.js'
import useCreateQuestionsState, { defaultInitialPage } from '../hooks/useCreateQuestionsState.js'
import QuestionsSection from '../components/organisms/QuestionsSection.jsx'
import PreviewBlock from '../components/organisms/PreviewBlock.jsx'
import LoadingState from '../components/organisms/LoadingState.jsx'

export const TutorCreateQuestions = () => {
  const navigate = useNavigate()
  const _location = useLocation()
  const { id: packageId } = useParams()
  const { user, logout } = useAuth()
  
  const handleLogout = async () => {
    try { await logout() } catch (_) {}
    navigate(ROUTES.login, { replace: true })
  }

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showLogoutConfirmStep2, setShowLogoutConfirmStep2] = useState(false)
  const handleLogoutClick = () => {
    if (hasUnsavedChanges) {
      setShowLogoutConfirm(true)
      return
    }
    setShowLogoutConfirmStep2(true)
  }

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState(null)
  const [showNavigationConfirm, setShowNavigationConfirm] = useState(false)

  const handleNavigationWithCheck = useCallback((path) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(path)
      setShowNavigationConfirm(true)
    } else {
      navigate(path)
    }
  }, [hasUnsavedChanges, navigate])

  const confirmNavigation = useCallback(() => {
    setShowNavigationConfirm(false)
    if (pendingNavigation) {
      setHasUnsavedChanges(false)
      navigate(pendingNavigation)
      setPendingNavigation(null)
    }
  }, [pendingNavigation, navigate])

  const cancelNavigation = useCallback(() => {
    setShowNavigationConfirm(false)
    setPendingNavigation(null)
  }, [])

  const navigationItems = buildTutorSidebar('MANAGE QUESTIONS', {
    'DASHBOARD': () => handleNavigationWithCheck(ROUTES.tutorDashboard),
    'STUDENT PROGRESS': () => handleNavigationWithCheck(ROUTES.tutorStudentProgress),
    'MANAGE QUESTIONS': () => handleNavigationWithCheck(ROUTES.tutorManageQuestions),
    'MANAGE FEEDBACK' : () => handleNavigationWithCheck(ROUTES.tutorManageFeedback),
    'MANAGE USERS': () => handleNavigationWithCheck(ROUTES.adminManageUsers),
    'ACCOUNT SETTINGS': () => handleNavigationWithCheck(ROUTES.accountSettings),
  }, user?.role)

  const {
    pages,
    setPages,
    currentPageIndex,
    setCurrentPageIndex,
    updateCurrentPage,
    deletePageAt,
    baseIndexForCurrent,
    totalQuestions,
  } = useCreateQuestionsState(undefined, validatePage)
  const [quizDuration, setQuizDuration] = useState(0)
  const setQuizDurationWithFlag = useCallback((val) => {
    setQuizDuration(val)
    setHasUnsavedChanges(true)
    setSaveStatus('saving')
  }, [])
  const [testPaperId, setTestPaperId] = useState(null)

  const [activeTab, setActiveTab] = useState('create')
  const [isPublishing, setIsPublishing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [saveStatus, setSaveStatus] = useState('idle')
  const [lastSavedAt, setLastSavedAt] = useState(null)
  const autoSaveAbortRef = useRef(null)
  const debounceTimerRef = useRef(null)
  const lastSavedContentRef = useRef(null)
  const lastSavedTextSnapshotRef = useRef(null)
  const lastSavedDurationRef = useRef(0)
  const lastSavedFullSnapshotRef = useRef(null)
  const pendingTextSaveRef = useRef(false)
  const isServerMergingRef = useRef(false)
  const lastAutoSaveAtRef = useRef(0)
  const rateLimitTimerRef = useRef(null)

  const AUTOSAVE_DEBOUNCE_MS = 4500
  const AUTOSAVE_MIN_GAP_MS = 5000
  
  useEffect(() => {
    return () => {
      try { if (autoSaveAbortRef.current) autoSaveAbortRef.current.abort() } catch (_) {}
      try { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current) } catch (_) {}
      try { if (rateLimitTimerRef.current) clearTimeout(rateLimitTimerRef.current) } catch (_) {}
      pendingTextSaveRef.current = false
    }
  }, [])
  
  const localDraftKey = React.useMemo(() => `qe_draft_${packageId || 'new'}`, [packageId])
  const [showDeletePackageConfirm, setShowDeletePackageConfirm] = useState(false)
  const [showPublishedWarning, setShowPublishedWarning] = useState(false)
  const {
    packageTitle,
    categoryName: packageCategoryName,
    isPublished,
    publish: publishPackage,
    unpublish: unpublishPackage,
    deleting: isDeletingPackage,
  } = usePackageInfo(packageId)
  
  const [showDeletePageConfirm, setShowDeletePageConfirm] = useState(false)
  const [deletePageIndex, setDeletePageIndex] = useState(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [showSaveError, setShowSaveError] = useState(false)
  const [showPublishSuccess, setShowPublishSuccess] = useState(false)
  const [showPublishError, setShowPublishError] = useState(false)
  const [showConfirmPublish, setShowConfirmPublish] = useState(false)
  const [showConfirmUnpublish, setShowConfirmUnpublish] = useState(false)

  const [previewAnswers, setPreviewAnswers] = useState({})
  
  const [forceShowMedia, setForceShowMedia] = useState(false)
  const [forceShowStory, setForceShowStory] = useState(false)
  const [forceShowInstructions, setForceShowInstructions] = useState(false)

  const [showUnpublishGuard, setShowUnpublishGuard] = useState(false)

  const currentPage = pages[currentPageIndex] || { storyMedia: {}, storyText: '', instructions: '', multiple: true, questions: [] }

  const handleAddQuestionPlaceholder = useCallback(async (type) => {
    let pageId = currentPage?.id || null
    if (!pageId) {
      const created = await ensurePageId(packageId, currentPage)
      pageId = created.id
    }
    const item = await ensureItemId(pageId, type)
    return { pageId, itemId: item.id }
  }, [currentPage, packageId])

  const quizSettingsRef = useRef(null)
  const questionsTopRef = useRef(null)

  const showMediaSection = useMemo(() => {
    return !!(currentPage.storyMedia?.imageFile || currentPage.storyMedia?.audioFile || 
              currentPage.storyMedia?.imageUrl || currentPage.storyMedia?.audioUrl)
  }, [currentPage.storyMedia])
  
  const showStorySection = useMemo(() => {
    return !!(currentPage.storyText && currentPage.storyText.trim())
  }, [currentPage.storyText])
  
  const showInstructionsSection = useMemo(() => {
    return !!(currentPage.instructions && currentPage.instructions.trim())
  }, [currentPage.instructions])

  const isMediaVisible = showMediaSection || forceShowMedia
  const isStoryVisible = showStorySection || forceShowStory
  const isInstructionsVisible = showInstructionsSection || forceShowInstructions

  const autosaveBadgeText = useMemo(() => {
    if (saveStatus === 'saving') return 'Saving…'
    if (saveStatus === 'saved' && lastSavedAt) {
      try {
        const d = new Date(lastSavedAt)
        const h = String(d.getHours()).padStart(2, '0')
        const m = String(d.getMinutes()).padStart(2, '0')
        const s = String(d.getSeconds()).padStart(2, '0')
        return `Saved at ${h}:${m}:${s}`
      } catch {
        return 'Saved'
      }
    }
    if (saveStatus === 'offline') return 'Offline – autosave paused'
    if (saveStatus === 'error') return 'Autosave failed'
    return ''
  }, [saveStatus, lastSavedAt])

  useEffect(() => {
    if (activeTab === 'preview') {
      // Pre-populate preview answers with correct answers from questions
      const answers = {}
      currentPage.questions?.forEach((q, idx) => {
        const questionKey = `page-${currentPageIndex}-q-${idx}`
        if (q.type === 'MCQ' && q.correctIndex !== null && q.correctIndex !== undefined) {
          answers[questionKey] = q.correctIndex
        } else if (q.type === 'TFNG' && q.correctTFNG) {
          answers[questionKey] = q.correctTFNG
        }
      })
      setPreviewAnswers(answers)
    }
  }, [activeTab, currentPageIndex, currentPage.questions])

  const [isInitialLoading, setIsInitialLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await api.get(`/api/questions/draft${packageId ? `?packageId=${encodeURIComponent(packageId)}` : ''}`)
        const d = res?.data?.draft
        if (mounted && d) {
          setTestPaperId(d.id || null)
          const loadedPages = (Array.isArray(d.pages) && d.pages.length) ? d.pages : [
            { storyMedia: { imageFile: null, audioFile: null, imageUrl: '', audioUrl: '' }, storyText: '', instructions: '', multiple: true, questions: [] }
          ]
          setPages(loadedPages)
          const dur = Number.isFinite(Number(d.quizDuration)) ? Number(d.quizDuration) : 0
          setQuizDuration(dur)
          lastSavedDurationRef.current = dur
          const hasAnyQuestions = loadedPages.some(p => (p?.questions?.length || 0) > 0)
          const isMeaningfullySaved = hasAnyQuestions || dur > 0
          setHasUnsavedChanges(!isMeaningfullySaved)
          try {
            lastSavedContentRef.current = buildContentSnapshot(loadedPages)
            lastSavedTextSnapshotRef.current = buildTextSnapshot(loadedPages)
            lastSavedFullSnapshotRef.current = { pages: buildContentSnapshot(loadedPages), quizDuration: dur }
          } catch (_) {}
        }
      } catch (_) { /* ignore */ }
      finally { if (mounted) setIsInitialLoading(false) }
    })()
    return () => { mounted = false }
  }, [packageId])

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const originalUpdateCurrentPage = updateCurrentPage
  const updateCurrentPageWithFlag = (patch) => {
    if (isPublished) { setShowUnpublishGuard(true); return }
    originalUpdateCurrentPage(patch)
    setHasUnsavedChanges(true)
    setSaveStatus('saving')
  }

  const handleAskDeletePage = (index) => {
    if (isPublished) { setShowUnpublishGuard(true); return }
    if (pages.length <= 1) return
    setDeletePageIndex(index)
    setShowDeletePageConfirm(true)
  }

  const confirmDeletePage = () => {
    const idx = (deletePageIndex !== null) ? deletePageIndex : currentPageIndex
    deletePageAt(idx)
    setShowDeletePageConfirm(false)
    setDeletePageIndex(null)
    setHasUnsavedChanges(true)
    setSaveStatus('saving')
  }

  const handleCancelClick = () => {
    if (hasUnsavedChanges) {
      setShowCancelConfirm(true)
    } else {
      navigate(-1)
    }
  }

  const confirmCancel = () => {
    setShowCancelConfirm(false)
    setHasUnsavedChanges(false)
    navigate(-1)
  }

  const handleBackClick = () => {
    if (hasUnsavedChanges) {
      setShowCancelConfirm(true)
    } else {
      navigate(-1)
    }
  }

  const doSaveDraft = async () => {
    setIsSaving(true)
    try {
      const sanitizedPages = sanitizePagesForPersist(pages)
      const payload = {
        pages: sanitizedPages,
        quizDuration,
        totalQuestions,
        currentPageIndex,
        meta: { testPaperId, packageId },
        contentHash: computeContentHash(sanitizedPages),
      }
      const res = await questionsApi.saveDraft(payload)
      setTestPaperId(res?.data?.id || testPaperId)
      // NOTE: we intentionally do NOT overwrite local pages with res.data.draft.pages here
      // to avoid clearing fields (e.g., matchingTemplate) due to server normalization.
      setHasUnsavedChanges(false)
      setSaveStatus('saved')
      setLastSavedAt(new Date())
      lastSavedDurationRef.current = quizDuration
      const contentSnap = buildContentSnapshot(pages)
      lastSavedContentRef.current = contentSnap
      try { lastSavedTextSnapshotRef.current = buildTextSnapshot(pages) } catch (_) {}
      try { lastSavedFullSnapshotRef.current = { pages: buildContentSnapshot(pages), quizDuration } } catch (_) {}
      try { localStorage.removeItem(localDraftKey) } catch (_) {}
      setShowSaveSuccess(true)
    } catch (_) {
      try {
        const draft = { pages, quizDuration, totalQuestions, currentPageIndex, meta: { testPaperId, packageId }, _ts: Date.now() }
        localStorage.setItem(localDraftKey, JSON.stringify(draft))
      } catch (_) {}
      setShowSaveError(true)
    } finally {
      setIsSaving(false)
    }
  }

  const buildContentSnapshot = (pagesArr) => {
    return (pagesArr || []).map(p => ({
      storyText: p.storyText,
      instructions: p.instructions,
      storyMediaUrls: {
        imageUrl: p.storyMedia?.imageUrl || '',
        audioUrl: p.storyMedia?.audioUrl || '',
      },
      questions: (p.questions || []).map(q => ({
        type: q.type,
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
        correctTFNG: q.correctTFNG,
        shortTemplate: q.shortTemplate,
        matchingTemplate: q.matchingTemplate,
        mediaUrls: {
          imageUrl: q.media?.imageUrl || '',
          audioUrl: q.media?.audioUrl || '',
        },
      }))
    }))
  }

  const buildTextSnapshot = (pagesArr) => {
    return (pagesArr || []).map(p => ({
      storyText: p.storyText,
      instructions: p.instructions,
      questions: (p.questions || []).map(q => ({
        type: q.type,
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
        correctTFNG: q.correctTFNG,
        shortTemplate: q.shortTemplate,
        matchingTemplate: q.matchingTemplate,
      }))
    }))
  }

  const textSaved = useMemo(() => {
    try {
      return JSON.stringify(buildTextSnapshot(pages)) === JSON.stringify(lastSavedTextSnapshotRef.current || null)
    } catch (_) {
      return false
    }
  }, [pages])

  const durationSaved = useMemo(() => {
    try {
      return Number(quizDuration) === Number(lastSavedDurationRef.current || 0)
    } catch (_) {
      return false
    }
  }, [quizDuration])

  const mediaSaved = useMemo(() => {
    try {
      const cur = (pages || []).map(p => ({
        storyMediaUrls: {
          imageUrl: p.storyMedia?.imageUrl || '',
          audioUrl: p.storyMedia?.audioUrl || '',
        },
        questions: (p.questions || []).map(q => ({
          imageUrl: q.media?.imageUrl || '',
          audioUrl: q.media?.audioUrl || '',
        })),
      }))
      const last = (lastSavedContentRef.current || []).map(p => ({
        storyMediaUrls: {
          imageUrl: p?.storyMediaUrls?.imageUrl || '',
          audioUrl: p?.storyMediaUrls?.audioUrl || '',
        },
        questions: (p.questions || []).map(q => ({
          imageUrl: q?.mediaUrls?.imageUrl || '',
          audioUrl: q?.mediaUrls?.audioUrl || '',
        })),
      }))
      return JSON.stringify(cur) === JSON.stringify(last)
    } catch (_) {
      return false
    }
  }, [pages])

  useEffect(() => {
    if (textSaved && mediaSaved && durationSaved) {
      setSaveStatus('saved')
      setHasUnsavedChanges(false)
    } else if (hasUnsavedChanges) {
      setSaveStatus('saving')
    }
  }, [textSaved, mediaSaved, durationSaved, hasUnsavedChanges])

  // Helper: Compute a stable hash string for the current content snapshot
  const computeContentHash = (pagesArr) => {
    try {
      const json = JSON.stringify({ pages: buildContentSnapshot(pagesArr), quizDuration })
      let hash = 5381
      for (let i = 0; i < json.length; i++) {
        hash = ((hash << 5) + hash) ^ json.charCodeAt(i)
      }
      // Convert to unsigned 32-bit and hex
      return (hash >>> 0).toString(16)
    } catch (_) {
      return String(Date.now())
    }
  }

  // Helper: sanitize pages for persistence (never include local File objects)
  const sanitizePagesForPersist = (pagesArr) => {
    return (pagesArr || []).map((p) => ({
      ...p,
      storyMedia: {
        imageFile: null,
        audioFile: null,
        imageUrl: p?.storyMedia?.imageUrl || '',
        audioUrl: p?.storyMedia?.audioUrl || '',
      },
      questions: (p?.questions || []).map((q) => ({
        ...q,
        media: {
          imageFile: null,
          audioFile: null,
          imageUrl: q?.media?.imageUrl || '',
          audioUrl: q?.media?.audioUrl || '',
        },
      })),
    }))
  }

  const doAutoSave = async (immediate = false) => {
    if (!hasUnsavedChanges && !immediate) return
    try {
      if (!immediate) {
        const currentText = JSON.stringify(buildTextSnapshot(pages))
        const lastText = JSON.stringify(lastSavedTextSnapshotRef.current || null)
        const durationUnchanged = Number(quizDuration) === Number(lastSavedDurationRef.current || 0)
        if (currentText === lastText && durationUnchanged) {
          return
        }
      }
    } catch (_) {}
    // If a save is in progress and this is a text-triggered autosave, queue it to run after
    if (!immediate && (isSaving || isAutoSaving)) {
      pendingTextSaveRef.current = true
      return
    }
    if (isSaving || isAutoSaving) return
    // Global rate limit: ensure at least 5s gap between autosaves
    const nowTs = Date.now()
    const elapsed = nowTs - (lastAutoSaveAtRef.current || 0)
    if (!immediate && elapsed < AUTOSAVE_MIN_GAP_MS) {
      const waitMs = AUTOSAVE_MIN_GAP_MS - elapsed
      if (rateLimitTimerRef.current) clearTimeout(rateLimitTimerRef.current)
      rateLimitTimerRef.current = setTimeout(() => { doAutoSave(false) }, waitMs)
      return
    }
    
    // Smart autosave: skip if nothing has changed compared to last saved snapshot (media-aware)
    if (!immediate) {
      const currentFull = { pages: buildContentSnapshot(pages), quizDuration }
      const lastFull = lastSavedFullSnapshotRef.current
      if (lastFull && JSON.stringify(currentFull) === JSON.stringify(lastFull)) {
        return
      }
    }
    if (!isOnline) {
      setSaveStatus('offline')
      try {
        const draft = { pages, quizDuration, totalQuestions, currentPageIndex, meta: { testPaperId, packageId }, _ts: Date.now() }
        localStorage.setItem(localDraftKey, JSON.stringify(draft))
      } catch (_) {}
      return
    }
    if (autoSaveAbortRef.current) {
      try { autoSaveAbortRef.current.abort() } catch (_) {}
    }
    autoSaveAbortRef.current = new AbortController()
    setIsAutoSaving(true)
    // mark start time for rate limiting
    lastAutoSaveAtRef.current = Date.now()
    try {
      const sanitizedPages = sanitizePagesForPersist(pages)
      const contentHash = computeContentHash(sanitizedPages)
      const payload = {
        pages: sanitizedPages,
        quizDuration,
        totalQuestions,
        currentPageIndex,
        meta: { testPaperId, packageId },
        contentHash,
      }
      const res = await questionsApi.saveDraft(payload)
      setTestPaperId(res?.data?.id || testPaperId)
      // NOTE: intentionally not merging res.data.draft.pages back into local state here
      // to avoid overwriting in-progress edits (especially matchingTemplate).
      setHasUnsavedChanges(false)
      setSaveStatus('saved')
      setLastSavedAt(new Date())
      // Save snapshots from local pages to avoid normalization mismatch with server response
      try {
        lastSavedContentRef.current = buildContentSnapshot(pages)
        lastSavedTextSnapshotRef.current = buildTextSnapshot(pages)
        lastSavedDurationRef.current = quizDuration
        lastSavedFullSnapshotRef.current = { pages: buildContentSnapshot(pages), quizDuration }
      } catch (_) {}
      try { localStorage.removeItem(localDraftKey) } catch (_) {}
    } catch (_) {
      if (!isOnline) setSaveStatus('offline'); else setSaveStatus('error')
      try {
        const draft = { pages, quizDuration, totalQuestions, currentPageIndex, meta: { testPaperId, packageId }, _ts: Date.now() }
        localStorage.setItem(localDraftKey, JSON.stringify(draft))
      } catch (_) {}
    } finally {
      setIsAutoSaving(false)
      // If a text save was requested during an ongoing save, run a normal (debounced-type) save now
      if (pendingTextSaveRef.current) {
        pendingTextSaveRef.current = false
        setTimeout(() => { doAutoSave(false) }, 1000) // coalescing window to batch rapid edits
      }
    }
  }

  // No immediate save on media upload; media changes debounce together with text

  // (Removed autosave modal countdown)

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true)
      let hasLocal = false
      try { hasLocal = !!localStorage.getItem(localDraftKey) } catch (_) {}
      try {
        const lastText = JSON.stringify(lastSavedTextSnapshotRef.current || null)
        const curText = JSON.stringify(buildTextSnapshot(pages))
        if ((hasUnsavedChanges || hasLocal) && curText !== lastText) {
          doAutoSave()
        }
      } catch (_) {}
    }
    const onOffline = () => { setIsOnline(false); setSaveStatus('offline') }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [hasUnsavedChanges, localDraftKey, pages])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(localDraftKey)
      if (raw) {
        // keep storage clean if too old
        const { _ts } = JSON.parse(raw)
        const maxAge = 7 * 24 * 60 * 60 * 1000
        if (!_ts || Date.now() - _ts > maxAge) {
          localStorage.removeItem(localDraftKey)
        }
      }
    } catch (_) {}
  }, [localDraftKey])

  // Removed: immediate autosave path for media; handled by the debounced text/media autosave now

  // Debounced autosave for text changes (4.5 seconds)
  // Compute a key based on text-only snapshot to ignore media changes in debounce
  const textSnapshotString = useMemo(() => {
    try { return JSON.stringify(buildTextSnapshot(pages)) } catch (_) { return String(Date.now()) }
  }, [pages])
  const contentKey = useMemo(() => {
    try {
      return JSON.stringify({
        pages: JSON.parse(textSnapshotString),
        quizDuration,
      })
    } catch (_) {
      return String(Date.now())
    }
  }, [textSnapshotString, quizDuration])

  useEffect(() => {
    if (!hasUnsavedChanges) return () => {}
    if (!isOnline) return () => {}
    // Skip debounce if pages update is from server merge (not user edit)
    if (isServerMergingRef.current) return () => {}
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return () => {}
    // Skip scheduling if only media changed (text snapshot unchanged)
    try {
      const currentText = JSON.stringify(buildTextSnapshot(pages))
      const lastText = JSON.stringify(lastSavedTextSnapshotRef.current || null)
      const durationUnchanged = Number(quizDuration) === Number(lastSavedDurationRef.current || 0)
      if (currentText === lastText && durationUnchanged) return () => {}
    } catch (_) {}
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => { doAutoSave(false) }, AUTOSAVE_DEBOUNCE_MS)
    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current) }
  }, [contentKey, hasUnsavedChanges, isOnline])

  // Removed duplicate 5-minute interval (keep single safety timer elsewhere)

  useEffect(() => {
    const handler = () => {
      const hidden = typeof document !== 'undefined' ? document.visibilityState === 'hidden' : false
      if (hidden && hasUnsavedChanges && !isSaving && !isAutoSaving && isOnline) {
        // Avoid autosave on media-only changes during visibility change
        try {
          const currentText = JSON.stringify(buildTextSnapshot(pages))
          const lastText = JSON.stringify(lastSavedTextSnapshotRef.current || null)
          if (currentText === lastText) return
        } catch (_) {}
        doAutoSave()
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [hasUnsavedChanges, isSaving, isAutoSaving, isOnline])

  // Removed second duplicate 5-minute interval

  // Ensure IDs exist before media upload: if there are selected media Files and the owning entity has no ID yet,
  // run an immediate autosave to let the server assign IDs. This enables upload to proceed without manual reload.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        for (let pIndex = 0; pIndex < (pages || []).length; pIndex++) {
          const p = pages[pIndex]
          // Ensure page ID if it has local media Files
          const pageHasPendingMedia = ((p?.storyMedia?.imageFile instanceof File) || (p?.storyMedia?.audioFile instanceof File)) && !p?.id
          if (pageHasPendingMedia && packageId) {
            const created = await ensurePageId(packageId, p)
            if (cancelled) return
            setPages(prev => {
              const next = [...prev]
              next[pIndex] = { ...next[pIndex], id: created.id }
              return next
            })
          }
          // Ensure item IDs if any item has local media Files but no ID (safety)
          for (let qIndex = 0; qIndex < (p?.questions || []).length; qIndex++) {
            const q = p.questions[qIndex]
            const itemHasPendingMedia = ((q?.media?.imageFile instanceof File) || (q?.media?.audioFile instanceof File)) && !q?.id
            if (itemHasPendingMedia && (p?.id || packageId)) {
              let pageId = p?.id
              if (!pageId && packageId) {
                const createdPage = await ensurePageId(packageId, p)
                if (cancelled) return
                pageId = createdPage.id
                setPages(prev => {
                  const next = [...prev]
                  next[pIndex] = { ...next[pIndex], id: pageId }
                  return next
                })
              }
              if (pageId) {
                const createdItem = await ensureItemId(pageId, q?.type || 'MCQ')
                if (cancelled) return
                setPages(prev => {
                  const next = [...prev]
                  const qs = [...(next[pIndex]?.questions || [])]
                  qs[qIndex] = { ...qs[qIndex], id: createdItem.id }
                  next[pIndex] = { ...next[pIndex], questions: qs }
                  return next
                })
              }
            }
          }
        }
      } catch (_) { /* ignore ensure errors to avoid blocking UI */ }
    })()
    return () => { cancelled = true }
  }, [pages, isSaving, isAutoSaving, packageId, setPages])

  // Media: persist once per upload/delete/replace batch
  const handleMediaUploaded = () => {
    // If only media changed (no textual change), we can mark saved without POST because mediaApi has already persisted assets
    try {
      const currentText = JSON.stringify(buildTextSnapshot(pages))
      const lastText = JSON.stringify(lastSavedTextSnapshotRef.current || null)
      const textUnchanged = currentText === lastText
      if (textUnchanged) {
        // Cancel any pending text debounce
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
          debounceTimerRef.current = null
        }
        // Defer snapshot update to ensure latest state is reflected
        setTimeout(() => {
          try { lastSavedContentRef.current = buildContentSnapshot(pages) } catch (_) {}
          setHasUnsavedChanges(false)
          setSaveStatus('saved')
          setLastSavedAt(new Date())
        }, 0)
        return
      }
    } catch (_) {}

    // Otherwise, there are pending text changes; do NOT force immediate save.
    // Let existing debounce for text trigger the save, so media upload doesn't bundle unsaved text prematurely.
    setHasUnsavedChanges(true)
    setSaveStatus('saving')
  }

  const [showPublishIssues, setShowPublishIssues] = useState(false)
  const [publishIssues, setPublishIssues] = useState([])
  const [publishFirstTarget, setPublishFirstTarget] = useState(null) // { type: 'duration' } | { type: 'page', index: number }

  const doPublish = async () => {
    if (!packageId) {
      // silently ignore if no packageId; UI shouldn't allow this path
      return
    }
    
    // Validate required data before publishing; always allow click and show helper if invalid
    const issues = []
    let firstTarget = null
    
    // Check duration first (highest priority)
    if (!Number.isFinite(quizDuration) || quizDuration <= 0) {
      issues.push('Duration must be set (greater than 0)')
      firstTarget = { type: 'duration' }
    }
    
    // Check pages
    if (!pages?.length) {
      issues.push('No pages created')
      if (!firstTarget) firstTarget = { type: 'page', index: 0 }
    } else {
      // Validate each page
      pages.forEach((p, idx) => {
        if (!p?.questions?.length) {
          issues.push(`Page ${idx + 1}: No questions added`)
          if (!firstTarget) firstTarget = { type: 'page', index: idx, section: 'questions' }
        } else {
          // Validate questions on this page
          const res = validatePage(p)
          if (!res.valid && res.errors?.questions) {
            const invalidCount = res.errors.questions.filter(e => e && Object.keys(e).length > 0).length
            if (invalidCount > 0) {
              issues.push(`Page ${idx + 1}: ${invalidCount} incomplete question`)
              if (!firstTarget) firstTarget = { type: 'page', index: idx, section: 'questions' }
            }
          }
        }
      })
    }
    
    if (issues.length) {
      setPublishIssues(issues)
      setPublishFirstTarget(firstTarget)
      setShowPublishIssues(true)
      return
    }
    setIsPublishing(true)
    try {
      const payload = {
        pages,
        quizDuration,
        totalQuestions,
        meta: { packageId, testPaperId }
      }
      await questionsApi.publish(payload)
      setHasUnsavedChanges(false)
      await publishPackage()
      setShowPublishSuccess(true)
    } catch (_) {
      setShowPublishError(true)
    } finally {
      setIsPublishing(false)
    }
  }

  const doUnpublish = async () => {
    if (!packageId) return
    setIsPublishing(true)
    try {
      await unpublishPackage()
      // No success modal to avoid confusion with Publish success
    } catch (_) {
      setShowPublishError(true)
    } finally {
      setIsPublishing(false)
    }
  }

  const deletePackage = async () => {
    if (!packageId) return
    // If already published (from local state), block immediately with warning
    if (isPublished) {
      setShowDeletePackageConfirm(false)
      setShowPublishedWarning(true)
      return
    }
    // Call API and check standard response object from fetch wrapper
    const res = await packagesApi.delete(packageId)
    setShowDeletePackageConfirm(false)
    if (!res?.ok) {
      const code = res?.data?.code || res?.data?.error
      if (String(code).toUpperCase() === 'PACKAGE_PUBLISHED') {
        setShowPublishedWarning(true)
        return
      }
      alert(res?.data?.message || 'Failed to delete package.')
      return
    }
    navigate(ROUTES.tutorManageQuestions)
  }

  // removed unused canPublish computation

  if (isInitialLoading) {
    return (
      <DashboardLayout
        rightHeaderSlot={<TutorHeaderRight items={navigationItems} onLogout={handleLogoutClick} useExternalLogoutConfirm={true} />}
        sidebarItems={navigationItems}
        onLogout={handleLogoutClick}
        useExternalLogoutConfirm={true}
      >
        <LoadingState message="Loading questions..." fullPage={true} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      rightHeaderSlot={<TutorHeaderRight items={navigationItems} onLogout={handleLogoutClick} useExternalLogoutConfirm={true} />}
      sidebarItems={navigationItems}
      onLogout={handleLogoutClick}
      useExternalLogoutConfirm={true}
    >
      <div className="w-full max-w-7xl mx-auto">
        <SurfaceCard className="w-full">
          {/* Page Header with Tabs */}
          <div className="sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75 border-b border-gray-100 px-4 py-3 rounded-t-[12px]">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-700">Create Questions</h1>
              <p className="text-sm text-gray-500">Design and manage your quiz questions for this lesson.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-md border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className={[
                    'px-4 py-2 text-sm font-medium transition-colors',
                    activeTab === 'create' ? 'bg-[#007a33] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  ].join(' ')}
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={[
                    'px-4 py-2 text-sm font-medium transition-colors',
                    activeTab === 'preview' ? 'bg-[#007a33] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  ].join(' ')}
                >
                  Preview
                </button>
              </div>
            </div>
          </div>

          {/* Create Tab Content */}
          {activeTab === 'create' && (
            <div className="p-4 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleBackClick}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 cursor-pointer"
                    aria-label="Back"
                  >
                    <HiArrowLeft className="w-5 h-5" />
                    <span className="text-sm">Back</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className={[
                    'inline-flex items-center h-7 px-3 rounded-full border text-xs font-medium',
                    hasUnsavedChanges ? 'bg-yellow-50 text-yellow-800 border-yellow-200' : 'bg-green-50 text-green-800 border-green-200'
                  ].join(' ')}>
                    {hasUnsavedChanges ? 'Unsaved' : 'Saved'}
                  </span>
                  <span className={[
                    'inline-flex items-center h-7 px-3 rounded-full border text-xs font-medium',
                    isPublished ? 'bg-green-50 text-green-800 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'
                  ].join(' ')}>
                    {isPublished ? 'Published' : 'Unpublished'}
                  </span>
                </div>
              </div>
              {/* Back button is already in header above; removed duplicate */}
              {/* Package name and Total Questions in one row */}
              <div className="flex items-center justify-between gap-3 mt-1 mb-2">
                <PackageNameBar categoryName={packageCategoryName} code={packageTitle} />
                <div className="flex justify-end">
                  <span className="inline-flex items-center h-8 px-3 rounded-full bg-gray-100 text-gray-700 text-sm border border-gray-200">
                    Total Questions: {totalQuestions}
                  </span>
                </div>
              </div>

              {/* Page Navigator */}
              <PageNavigator
                pages={pages}
                currentIndex={currentPageIndex}
                onAddAfter={(_) => {
                  if (isPublished) { setShowUnpublishGuard(true); return }
                  setPages(prev => [...prev, { ...defaultInitialPage() }])
                  setHasUnsavedChanges(true)
                }}
                onDeletePageAt={(i) => handleAskDeletePage(i)}
                onSelectPage={setCurrentPageIndex}
                canDelete={pages.length > 1}
              />

              {/* 1. Upload Media */}
              <MediaSection
                value={currentPage.storyMedia || { imageFile: null, audioFile: null, imageUrl: '', audioUrl: '' }}
                onChange={(v) => updateCurrentPageWithFlag({ storyMedia: v })}
                isVisible={isMediaVisible}
                onToggle={async () => {
                  if (isPublished && !showMediaSection) { setShowUnpublishGuard(true); return }
                  // Ensure page ID before showing media controls, so uploads have a targetId
                  if (!isMediaVisible && !currentPage?.id && packageId) {
                    try {
                      const created = await ensurePageId(packageId, currentPage)
                      setPages(prev => {
                        const next = [...prev]
                        next[currentPageIndex] = { ...next[currentPageIndex], id: created.id }
                        return next
                      })
                    } catch (_) { /* ignore */ }
                  }
                  setForceShowMedia((s) => !s)
                }}
                isPublished={isPublished}
                onRequireUnpublish={() => setShowUnpublishGuard(true)}
                targetId={currentPage?.id}
                onMediaUploaded={handleMediaUploaded}
              />

              {/* 2. Story/Passage */}
              <StorySection
                key={`story-sec-${currentPage?.id || currentPageIndex}`}
                value={currentPage.storyText}
                onChange={(html) => updateCurrentPageWithFlag({ storyText: html })}
                isVisible={isStoryVisible}
                onToggle={() => {
                  const hasStory = !!(currentPage.storyText && currentPage.storyText.trim())
                  if (isPublished && !hasStory) { setShowUnpublishGuard(true); return }
                  setForceShowStory((s) => !s)
                }}
                isPublished={isPublished}
                onRequireUnpublish={() => setShowUnpublishGuard(true)}
              />

              {/* 3. Instructions */}
              <InstructionsSection
                key={`inst-sec-${currentPage?.id || currentPageIndex}`}
                value={currentPage.instructions}
                onChange={(html) => updateCurrentPageWithFlag({ instructions: html })}
                isVisible={isInstructionsVisible}
                onToggle={() => {
                  const hasInstructions = !!(currentPage.instructions && currentPage.instructions.trim())
                  if (isPublished && !hasInstructions) { setShowUnpublishGuard(true); return }
                  setForceShowInstructions((s) => !s)
                }}
                isPublished={isPublished}
                onRequireUnpublish={() => setShowUnpublishGuard(true)}
              />

              {/* 4. Question Builder */}
              <div ref={questionsTopRef} />
              <QuestionsSection
                page={currentPage}
                onChange={(next) => updateCurrentPageWithFlag(next)}
                baseIndex={baseIndexForCurrent}
                isPublished={isPublished}
                onRequireUnpublish={() => setShowUnpublishGuard(true)}
                onMediaUploaded={handleMediaUploaded}
                onAddQuestion={handleAddQuestionPlaceholder}
              />

              {/* Inline validation summary */}
              <ValidationSummary page={currentPage} validatePage={validatePage} />

              {/* Quiz Duration */}
              <div ref={quizSettingsRef}>
                <QuizSettings 
                quizDuration={quizDuration} 
                setQuizDuration={setQuizDurationWithFlag}
                isPublished={isPublished}
                onRequireUnpublish={() => setShowUnpublishGuard(true)}
              />
              </div>
            </div>
          )}

          {/* Preview Tab Content */}
          {activeTab === 'preview' && (
            <div className="p-4">
              {/* Page Navigator - Only chips, no Add/Delete */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {pages.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentPageIndex(i)}
                    className={[
                      classes.button.base,
                      i === currentPageIndex ? classes.button.primary : classes.button.outline,
                      'h-9 px-3 text-sm'
                    ].join(' ')}
                  >
                    Page {i + 1}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-gray-500">Student view - Page {currentPageIndex + 1}</span>
              </div>
              <PreviewBlock 
                data={currentPage} 
                baseIndex={baseIndexForCurrent} 
                currentPageIndex={currentPageIndex}
                previewAnswers={previewAnswers}
                setPreviewAnswers={setPreviewAnswers}
              />
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className={[classes.button.base, classes.button.outline, 'h-9 px-4 text-sm'].join(' ')}
                  aria-label="Back to Create"
                >
                  Back to Create
                </button>
              </div>
            </div>
          )}

          {/* Actions Footer - Only in Create Tab */}
          {activeTab === 'create' && (
            <ActionsFooter
              onCancel={handleCancelClick}
              onSaveDraft={doSaveDraft}
              onPreview={() => setActiveTab('preview')}
              onPublish={() => setShowConfirmPublish(true)}
              onUnpublish={() => setShowConfirmUnpublish(true)}
              canPublish={true}
              isPublishing={isPublishing}
              isSaving={isSaving}
              isPublished={isPublished}
              hasUnsavedChanges={hasUnsavedChanges}
              saveStatus={saveStatus}
              lastSavedAt={lastSavedAt}
            />
          )}
        </SurfaceCard>
      </div>

      {/* Delete Package Card (only in Create tab) */}
      {activeTab === 'create' && (
        <div className="rounded-[20px] border border-[#ececec] shadow-[4px_4px_2px_#0000000d] bg-[#fff4f4] p-5 flex flex-col sm:flex-row items-center justify-between gap-5 mt-6 mb-10">
          <div className="text-base font-medium text-[#ff5722] text-center sm:text-left">
            <p className='underline'>Delete This Package?</p>
            <p className='text-[11px] mt-2'>Deleting this package will remove all its questions and content. This cannot be undone.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeletePackageConfirm(true)}
            className={[classes.button.base, classes.button.danger, 'h-[34px] px-4'].join(' ')}
            aria-label="Delete this package"
            disabled={isDeletingPackage}
          >
            {isDeletingPackage ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      )}

      {/* Modals */}
      {/* Unpublish guard modal */}
      <ConfirmDialog
        isOpen={showUnpublishGuard}
        onClose={() => setShowUnpublishGuard(false)}
        onConfirm={async () => { setShowUnpublishGuard(false); await doUnpublish() }}
        type="warning"
        title="Package is Published"
        message="This package is currently published. Unpublish it first before making changes to media, passage, instructions, pages, or questions."
        confirmText="Unpublish Now"
        cancelText="Close"
      />

      {/* Removed pre-confirm modals for Save/Publish/Unpublish to avoid duplicate popups */}
      {/* Confirm Unpublish (button) */}
      <ConfirmDialog
        isOpen={showConfirmUnpublish}
        onClose={() => setShowConfirmUnpublish(false)}
        onConfirm={async () => { setShowConfirmUnpublish(false); await doUnpublish() }}
        type="warning"
        title="Unpublish Package?"
        message="Unpublishing will hide this package from students until you publish again. Proceed?"
        confirmText="Unpublish"
        cancelText="Cancel"
      />

      {/* Save success */}
      <ConfirmDialog
        isOpen={showSaveSuccess}
        onClose={() => setShowSaveSuccess(false)}
        onConfirm={() => setShowSaveSuccess(false)}
        type="success"
        title="Draft Saved"
        message="Your changes have been saved as draft."
        confirmText="OK"
        cancelText=""
      />

      {/* Save error */}
      <ConfirmDialog
        isOpen={showSaveError}
        onClose={() => setShowSaveError(false)}
        onConfirm={() => setShowSaveError(false)}
        type="danger"
        title="Save Failed"
        message="We couldn't save your draft. Please try again."
        confirmText="OK"
        cancelText=""
      />

      {/* Publish error */}
      <ConfirmDialog
        isOpen={showPublishError}
        onClose={() => setShowPublishError(false)}
        onConfirm={() => setShowPublishError(false)}
        type="danger"
        title="Publish Failed"
        message="We couldn't publish the package. Please try again."
        confirmText="OK"
        cancelText=""
      />

      {/* Publish success */}
      <ConfirmDialog
        isOpen={showPublishSuccess}
        onClose={() => setShowPublishSuccess(false)}
        onConfirm={() => setShowPublishSuccess(false)}
        type="success"
        title="Package Published"
        message="Your package has been published successfully."
        confirmText="OK"
        cancelText=""
      />

      {/* Publish confirmation */}
      <ConfirmDialog
        isOpen={showConfirmPublish}
        onClose={() => setShowConfirmPublish(false)}
        onConfirm={async () => { setShowConfirmPublish(false); await doPublish() }}
        type="warning"
        title="Publish Package?"
        message="Are you sure you want to publish this package so it becomes available to students?"
        confirmText="Publish"
        cancelText="Cancel"
      />

      {/* Publish validation issues */}
      <ConfirmDialog
        isOpen={showPublishIssues}
        onClose={() => setShowPublishIssues(false)}
        onConfirm={() => {
          setShowPublishIssues(false)
          
          // Navigate to first issue
          if (publishFirstTarget) {
            // Ensure we're in Create tab
            setActiveTab('create')
            
            if (publishFirstTarget.type === 'duration') {
              // Scroll to duration section
              setTimeout(() => {
                quizSettingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }, 100)
            } else if (publishFirstTarget.type === 'page') {
              // Switch to the problematic page
              setCurrentPageIndex(publishFirstTarget.index)
              
              // Scroll to questions section on that page
              setTimeout(() => {
                if (publishFirstTarget.section === 'questions') {
                  questionsTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              }, 150)
            }
          }
        }}
        type="warning"
        title="Cannot Publish Yet"
        message={`Please complete the following before publishing:\n\n${publishIssues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}`}
        confirmText="Go to Issue"
        cancelText=""
      />
      <ConfirmDialog
        isOpen={showDeletePageConfirm}
        onClose={() => setShowDeletePageConfirm(false)}
        onConfirm={confirmDeletePage}
        type="delete"
        title="Delete Page?"
        message={`Are you sure you want to delete Page ${currentPageIndex + 1}? This action cannot be undone and all questions on this page will be lost.`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={confirmCancel}
        type="warning"
        title="Cancel Changes?"
        message="Are you sure you want to cancel? All unsaved changes will be lost."
        confirmText="Yes, Cancel"
        cancelText="No, Stay"
      />

      <ConfirmDialog
        isOpen={showNavigationConfirm}
        onClose={cancelNavigation}
        onConfirm={confirmNavigation}
        type="warning"
        title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to leave? All unsaved changes will be lost."
        confirmText="Yes, Leave"
        cancelText="No, Stay"
      />

      <ConfirmDialog
        isOpen={showDeletePackageConfirm}
        onClose={() => setShowDeletePackageConfirm(false)}
        onConfirm={deletePackage}
        type="delete"
        title="Delete This Package?"
        message="Are you sure you want to delete this package? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Published package warning modal */}
      <ConfirmDialog
        isOpen={showPublishedWarning}
        onClose={() => setShowPublishedWarning(false)}
        onConfirm={() => setShowPublishedWarning(false)}
        type="warning"
        title="Cannot Delete Published Package"
        message="This package is currently published and cannot be deleted. Please unpublish it first before attempting to delete."
        confirmText="OK"
        cancelText=""
      />

      {/* Autosave status indicator - only render when there is badge text */}
      {activeTab === 'create' && autosaveBadgeText && (
        <div className="fixed bottom-4 left-4 z-40 rounded-full bg-white/90 backdrop-blur px-3 py-1 border border-gray-200 shadow-sm text-xs text-gray-600">
          {autosaveBadgeText}
        </div>
      )}

      {/* Logout confirmation STEP 1: Unsaved changes warning */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => { setShowLogoutConfirm(false); setShowLogoutConfirmStep2(true) }}
        type="warning"
        title="Unsaved Changes"
        message="You have unsaved changes. Logging out now will discard them. Do you want to continue?"
        confirmText="Logout"
        cancelText="Cancel"
      />

      {/* Logout confirmation STEP 2: Final confirmation to logout */}
      <ConfirmDialog
        isOpen={showLogoutConfirmStep2}
        onClose={() => setShowLogoutConfirmStep2(false)}
        onConfirm={() => { setShowLogoutConfirmStep2(false); handleLogout() }}
        type="logout"
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        confirmText="Logout"
        cancelText="Cancel"
      />
    </DashboardLayout>
  )
}

export default TutorCreateQuestions
