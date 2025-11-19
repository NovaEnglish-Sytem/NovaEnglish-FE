import React, { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ROUTES } from '../config/routes.js'
import TestOverviewPanel from '../components/organisms/TestOverviewPanel.jsx'
import { testApi } from '../lib/api.js'
import LoadingState from '../components/organisms/LoadingState.jsx'
import ErrorState from '../components/organisms/ErrorState.jsx'
import { useActiveTestSession } from '../hooks/useActiveTestSession.js'


export const StudentTestOverview = () => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sections, setSections] = useState([])
  const [starting, setStarting] = useState(false)
  const countdownRef = useRef(null)
  
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
  

  const handleExit = () => {
    if (countdownRef.current) clearInterval(countdownRef.current)
    try { sessionStorage.removeItem('test_overview_checkpoint') } catch {}
    navigate(ROUTES.dashboardStudent)
  }

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
    // Map categoryIds to get proper order and mark completed ones
    const remainingSet = new Set(preparedCategories.map(pc => pc.categoryId))
    // Build a name map so completed-but-missing categories still show their names
    const categoryNames = {
      ...Object.fromEntries(Object.entries(incomingCategoryNames).map(([k,v]) => [String(k), v])),
      ...Object.fromEntries(preparedCategories.map(pc => [String(pc.categoryId), pc.categoryName]))
    }
    const sectionData = categoryIds.map(catId => {
      // Completed if explicitly completed OR not in remaining prepared set (checkpoint)
      const isCompleted = completedCategoryIds.includes(catId) || (!remainingSet.has(catId) && checkpoint)
      
      // Find prepared category data (only exists for remaining categories)
      const preparedCat = preparedCategories.find(pc => String(pc.categoryId) === String(catId))
      
      if (preparedCat) {
        return {
          title: preparedCat.categoryName,
          questions: preparedCat.totalQuestions,
          minutes: preparedCat.durationMinutes,
          completed: isCompleted
        }
      }
      
      if (isCompleted) {
        // Completed category: show placeholder; totals will exclude completed via panel logic
        return {
          title: categoryNames[String(catId)] || 'Completed',
          questions: 'Completed',
          minutes: 'Completed',
          completed: true
        }
      }
      
      return null
    }).filter(Boolean)
    
    setSections(sectionData)
    setLoading(false)
    
    return () => { 
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [navigate])

  const handleStart = async () => {
    if (starting) return
    setStarting(true)
    if (countdownRef.current) clearInterval(countdownRef.current)
    
    if (preparedCategories.length === 0) {
      setError('No test data prepared')
      return
    }
    
    try {
      // Determine next category to start based on original order and completed
      const completedSet = new Set(completedCategoryIds)
      const nextCategoryId = (categoryIds || []).find(id => !completedSet.has(id))
      
      // Find prepared data for that category (only remaining categories are in preparedCategories)
      const nextPrepared = preparedCategories.find(pc => pc.categoryId === nextCategoryId) || preparedCategories[0]
      
      if (!nextPrepared) {
        setError('No prepared test data found')
        return
      }
      
      try {
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
        // Handle 403 error (active session exists)
        if (e?.response?.status === 403 && e?.response?.data?.activeAttemptId) {
          navigate(ROUTES.studentTest.replace(':attemptId', e.response.data.activeAttemptId), { replace: true })
          return
        }
        
        setError(e?.message || 'Failed to start test')
        setStarting(false)
      }
    } catch (e) {
      setError(e?.message || 'Failed to start test')
      setStarting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#003900] flex items-center justify-center p-4">
        <LoadingState message="Loading test overview..." className="text-white" />
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
        sections={sections}
        countdownStart={20}
        onExit={handleExit}
        onStart={handleStart}
        countdownRef={countdownRef}
        checkpoint={checkpoint}
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
