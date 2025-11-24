import React, { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ROUTES } from '../config/routes.js'
import TestOverviewPanel from '../components/organisms/TestOverviewPanel.jsx'
import { testApi } from '../lib/api.js'
import LoadingState from '../components/organisms/LoadingState.jsx'
import ErrorState from '../components/organisms/ErrorState.jsx'
import { useActiveTestSession } from '../hooks/useActiveTestSession.js'
import ConfirmDialog from '../components/molecules/ConfirmDialog.jsx'
import { useDelayedSpinner } from '../hooks/useDelayedSpinner.js'


export const StudentTestOverview = () => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sections, setSections] = useState([])
  const [starting, setStarting] = useState(false)
  const [packageChanged, setPackageChanged] = useState(false)
  const [pendingCheckpoint, setPendingCheckpoint] = useState(null)
  const countdownRef = useRef(null)
  
  const showInitialLoading = useDelayedSpinner(loading, 700)
  
  // Check for active test session and auto-submit expired sessions
  useActiveTestSession({ autoRedirect: true, checkOnMount: true })

  // Restore state from sessionStorage if location.state is missing (refresh scenarios)
  let persisted = null
  try {
    const raw = sessionStorage.getItem('test_overview_checkpoint')
    if (raw) persisted = JSON.parse(raw)
  } catch {}
  const s = state || persisted || {}

  const categoryIds = Array.isArray(s?.categoryIds) && s.categoryIds.length > 0 ? s.categoryIds : []
  const completedCategoryIds = Array.isArray(s?.completedCategoryIds) ? s.completedCategoryIds : []
  const checkpoint = s?.checkpoint || false
  const recordId = s?.recordId || null
  const preparedCategories = Array.isArray(s?.preparedCategories) ? s.preparedCategories : []
  const incomingCategoryNames = s?.categoryNames || {}
  const incomingPackageChanged = Boolean(s?.packageChanged)
  

  const handleExit = () => {
    if (countdownRef.current) clearInterval(countdownRef.current)
    try { sessionStorage.removeItem('test_overview_checkpoint') } catch {}
    navigate(ROUTES.dashboardStudent)
  }

  // On first mount, if we were redirected here from a draft/unpublish flow with
  // packageChanged=true, open the modal once.
  useEffect(() => {
    if (incomingPackageChanged) {
      setPackageChanged(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Validate that test overview was accessed through proper flow
    if (categoryIds.length === 0 || preparedCategories.length === 0) {
      // No prepared data - redirect to dashboard
      // This happens when user directly accesses the URL without prepare flow
      try { sessionStorage.removeItem('test_overview_checkpoint') } catch {}
      navigate(ROUTES.studentDashboard, { replace: true })
      return
    }

    // Build sections from prepared data
    // Map categoryIds to get proper order and mark completed / unavailable ones
    const preparedByCategory = new Map(
      preparedCategories.map((pc) => [String(pc.categoryId), pc])
    )
    // Build a name map so completed / unavailable categories still show their names
    const categoryNames = {
      ...Object.fromEntries(Object.entries(incomingCategoryNames).map(([k,v]) => [String(k), v])),
      ...Object.fromEntries(preparedCategories.map(pc => [String(pc.categoryId), pc.categoryName]))
    }
    const sectionData = categoryIds.map(catId => {
      const key = String(catId)
      const preparedCat = preparedByCategory.get(key)
      const isExplicitCompleted = completedCategoryIds.includes(catId)

      if (preparedCat) {
        // Category has prepared data (either remaining or already completed in this record)
        return {
          title: preparedCat.categoryName,
          questions: preparedCat.totalQuestions,
          minutes: preparedCat.durationMinutes,
          completed: isExplicitCompleted,
          unavailable: false,
        }
      }

      if (isExplicitCompleted) {
        // Completed category without current prepared data: show as completed placeholder
        return {
          title: categoryNames[key] || 'Completed',
          questions: 'Completed',
          minutes: 'Completed',
          completed: true,
          unavailable: false,
        }
      }

      // Category is in overview list but has no prepared package and is not completed:
      // treat as unavailable (e.g., package was unpublished after prepare)
      return {
        title: categoryNames[key] || 'Packet not found',
        questions: 'Packet not found',
        minutes: 'Packet not found',
        completed: false,
        unavailable: true,
      }
    }).filter(Boolean)
    
    // If all categories are unavailable, redirect to dashboard directly
    const hasAvailable = sectionData.some(s => !s.unavailable && !s.completed)
    const hasUnavailable = sectionData.some(s => s.unavailable)

    if (!hasAvailable && hasUnavailable) {
      try { sessionStorage.removeItem('test_overview_checkpoint') } catch {}
      navigate(ROUTES.studentDashboard, { replace: true })
      return
    }

    setSections(sectionData)
    setLoading(false)
    
    return () => { 
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [navigate, categoryIds, completedCategoryIds, preparedCategories, incomingCategoryNames])

  const handleStart = async () => {
    if (starting) return
    setStarting(true)
    if (countdownRef.current) clearInterval(countdownRef.current)
    
    if (preparedCategories.length === 0) {
      setError('No test data prepared')
      return
    }
    
    try {
      // Determine next category to start based on original order and completed,
      // and ensure it still has prepared data (skip unavailable categories)
      const completedSet = new Set(completedCategoryIds)
      const preparedByCategory = new Map(
        preparedCategories.map((pc) => [pc.categoryId, pc])
      )

      const nextPrepared = (categoryIds || [])
        .map((id) => preparedByCategory.get(id))
        .find((pc) => pc && !completedSet.has(pc.categoryId))

      if (!nextPrepared) {
        setError('No prepared test data found')
        setStarting(false)
        return
      }
      
      // Build testMeta for cross-browser support
      const testMeta = {
        categoryIds,
        completedCategoryIds,
        recordId,
        preparedCategories,
        categoryNames: {
          ...Object.fromEntries(Object.entries(incomingCategoryNames).map(([k,v]) => [String(k), v])),
          ...Object.fromEntries(preparedCategories.map(pc => [String(pc.categoryId), pc.categoryName]))
        },
        mode: categoryIds.length > 1 ? 'multiple' : 'single',
        currentCategoryId: nextPrepared.categoryId  // ✅ Include current category
      }
      
      // Call start API with prepared data + testMeta for cross-browser support
      const res = await testApi.start(
        nextPrepared.packageId,
        nextPrepared.categoryId,
        nextPrepared.turnNumber,
        recordId,
        preparedCategories, // Pass all prepared categories
        testMeta // Pass complete testMeta
      )

      if (!res?.ok) {
        const code = String(res?.data?.code || res?.data?.error || '').toUpperCase()
        const msg = String(res?.data?.message || '')
        const isDraft = res.status === 409 && (code === 'PACKAGE_DRAFT' || /package is in draft/i.test(msg))
        const isNotFound = res.status === 404

        if (isDraft || isNotFound) {
          // Current package is no longer available. Remove it and decide where to go.
          const failedCategoryId = nextPrepared.categoryId
          const remainingPrepared = preparedCategories.filter(pc => pc.categoryId !== failedCategoryId)

          if (remainingPrepared.length === 0) {
            // No more categories to do (single, or all unpublished/finished) -> go to dashboard
            try { sessionStorage.removeItem('test_overview_checkpoint') } catch {}
            navigate(ROUTES.studentDashboard, { replace: true })
            setStarting(false)
            return
          }

          // Still have other categories: offer to continue via modal
          const checkpointPayload = {
            mode: categoryIds.length > 1 ? 'multiple' : 'single',
            categoryIds,
            completedCategoryIds,
            checkpoint: true,
            recordId,
            preparedCategories: remainingPrepared,
            categoryNames: {
              ...Object.fromEntries(Object.entries(incomingCategoryNames).map(([k,v]) => [String(k), v])),
              ...Object.fromEntries(remainingPrepared.map(pc => [String(pc.categoryId), pc.categoryName]))
            },
          }
          try { sessionStorage.setItem('test_overview_checkpoint', JSON.stringify(checkpointPayload)) } catch {}
          setPendingCheckpoint(checkpointPayload)
          setPackageChanged(true)
          setStarting(false)
          return
        }

        // Other errors: show generic error state
        setError(res?.data?.message || 'Failed to start test')
        setStarting(false)
        return
      }

      const attemptId = res?.data?.attempt?.id
      const sessionToken = res?.data?.attempt?.sessionToken
      
      if (!attemptId) {
        setError('Failed to start test')
        setStarting(false)
        return
      }
      
      // Handle active session conflict
      if (res?.data?.activeAttemptId && res?.data?.redirectTo) {
        navigate(ROUTES.studentTest.replace(':attemptId', res.data.activeAttemptId), { replace: true })
        return
      }
      
      // Store session token
      if (sessionToken) {
        import('../utils/testStorage.js').then(({ TestStorage }) => {
          TestStorage.saveSessionToken(attemptId, sessionToken)
        })
      }
      
      // Clear checkpoint since we're leaving overview
      try { sessionStorage.removeItem('test_overview_checkpoint') } catch {}
      // Navigate to test page with attemptId
      navigate(ROUTES.studentTest.replace(':attemptId', attemptId), { 
        replace: true,
        state: { 
          categoryIds, 
          completedCategoryIds,
          recordId,
          mode: categoryIds.length > 1 ? 'multiple' : 'single',
          preparedCategories, // Pass to next test if multiple categories
          currentCategoryId: nextPrepared.categoryId, // Needed for checkpoint completion on timeout
          categoryNames: {
            ...Object.fromEntries(Object.entries(incomingCategoryNames).map(([k,v]) => [String(k), v])),
            ...Object.fromEntries(preparedCategories.map(pc => [String(pc.categoryId), pc.categoryName]))
          }
        }
      })
    } catch (e) {
      setError(e?.message || 'Failed to start test')
      setStarting(false)
    }
  }

  const overviewKey = `${(categoryIds || []).join('-')}|${(preparedCategories || []).length}`

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#003900] flex items-center justify-center p-4">
        <LoadingState
          message={showInitialLoading ? 'Please wait...' : 'Loading test overview...'}
          className="text-white"
        />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen w-full bg-[#003900] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <ErrorState
            title="Failed to load test"
            message={error}
            onRetry={handleExit}
            className="text-gray-800"
            fullPage={false}
            minHeight="min-h-[0]"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[#003900] flex items-center justify-center p-4 relative">
      <div className="hidden md:block absolute top-10 left-10">
        <div className="bg-[#f4f9f3] rounded-2xl border border-[#d9e7d6] shadow-[4px_4px_2px_#0000000d] p-3 pr-4">
          <img src="/favicon.svg" alt="Logo" className="w-14 h-14" />
        </div>
      </div>

      <TestOverviewPanel
        key={overviewKey}
        sections={sections}
        countdownStart={20}
        onExit={handleExit}
        onStart={handleStart}
        countdownRef={countdownRef}
        checkpoint={checkpoint}
        pauseCountdown={packageChanged}
      />
      {/* Modal: some packages became unavailable (unpublished) but others still available */}
      <ConfirmDialog
        isOpen={packageChanged}
        onClose={() => {
          // Close dialog and send student back to dashboard
          setPackageChanged(false)
          try { sessionStorage.removeItem('test_overview_checkpoint') } catch {}
          handleExit()
        }}
        onConfirm={() => {
          // Continue with remaining available categories: reload overview with pending checkpoint
          setPackageChanged(false)
          if (pendingCheckpoint) {
            navigate(ROUTES.studentTestOverview, {
              replace: true,
              state: pendingCheckpoint,
            })
          }
        }}
        title="Some test sections are no longer available"
        message={
          'One or more sections in this test have been unpublished by your tutor.\n' +
          'You can continue with the remaining available sections, or return to your dashboard.'
        }
        type="warning"
        confirmText="Continue test"
        cancelText="Back to dashboard"
      />
      {starting && (
        <div className="fixed inset-0 z-[100] bg-black/10 backdrop-blur-sm flex items-center justify-center">
          <LoadingState message="Starting test..." size="md" fullPage={false} />
        </div>
      )}
    </div>
  )
}

export default StudentTestOverview
