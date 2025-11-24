import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../config/routes.js'
import { AppLayout } from '../layouts/AppLayout.jsx'
import { TopNav } from '../components/organisms/TopNav.jsx'
import { buildStudentTopNav } from '../config/nav/student.js'
import StudentReport from '../components/organisms/StudentReport.jsx'
import StudentTest from '../components/organisms/StudentTest.jsx'
import GreetingsCard from '../components/organisms/GreetingsCard.jsx'
import LoadingState from '../components/organisms/LoadingState.jsx'
import ErrorState from '../components/organisms/ErrorState.jsx'
import GreetingsIcon from '../assets/StudentGreetings.svg'
import StudentHeaderRight from '../components/organisms/StudentHeaderRight.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { studentApi, testApi } from '../lib/api.js'
import { classes } from '../config/theme/tokens.js'
import { useActiveTestSession } from '../hooks/useActiveTestSession.js'
import { useDelayedSpinner } from '../hooks/useDelayedSpinner.js'

export const StudentDashboard = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [navigatingToOverview, setNavigatingToOverview] = useState(false)
  const [error, setError] = useState(null)
  const [redirecting, setRedirecting] = useState(false)
  const [summary, setSummary] = useState({ greeting: { name: '' }, student: { level: null }, recent: [], categories: [], activeRecord: null })
  
  const showInitialLoading = useDelayedSpinner(loading && !redirecting, 700)
  
  // Check for active test session and auto-submit expired sessions
  useActiveTestSession({ autoRedirect: true, checkOnMount: true })

  const handleLogout = async () => {
    try {
      await logout()
    } catch (e) {
      // ignore
    } finally {
      navigate(ROUTES.login, { replace: true })
    }
  }

  const navigationItems = buildStudentTopNav('DASHBOARD', {
    'DASHBOARD': () => navigate(ROUTES.dashboardStudent),
    'TEST RECORD': () => navigate(ROUTES.studentTestRecord),
  })

  // SMART CLEANUP: Clear stale/inactive localStorage on dashboard mount
  // Safe to call because:
  // - Keeps active test localStorage (if any)
  // - Clears completed/expired tests
  // - Clears data older than 24 hours
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await studentApi.dashboardSummary()
        if (!mounted) return
        
        // AUTO-REDIRECT: Check if student has active test session
        const activeSession = res?.data?.activeSession
        if (activeSession && !activeSession.isExpired) {
          // CLEANUP: Keep only active test localStorage for this attempt
          try {
            const { TestStorage } = await import('../utils/testStorage.js')
            TestStorage.validateAndCleanup(activeSession.attemptId)
          } catch (e) {
            // Silent fail - cleanup is non-critical
          }
          
          if (mounted) {
            setRedirecting(true)
            setLoading(false)
          }
          
          // Small delay for better UX
          setTimeout(() => {
            if (mounted) {
              navigate(ROUTES.studentTest.replace(':attemptId', activeSession.attemptId), { 
                replace: true 
              })
            }
          }, 500)
          return
        }
        
        // CLEANUP: No active session - clear all test localStorage
        try {
          const { TestStorage } = await import('../utils/testStorage.js')
          TestStorage.clearAllLocal()
        } catch (e) {
          // Silent fail - cleanup is non-critical
        }
        
        setSummary(res?.data || summary)
      } catch (e) {
        if (!mounted) return
        setError(e?.message || 'Failed to load dashboard')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const categoryList = Array.isArray(summary?.categoryList) ? summary.categoryList : []
  const activeRecord = summary?.activeRecord || null
  const completedCategoryIds = activeRecord?.completedCategories || []
  
  // Prefer authenticated user's full name; fallback to API greeting
  const firstName = ((user?.fullName || '').trim().split(/\s+/)[0]) || ((summary?.greeting?.name || '').trim().split(/\s+/)[0]) || ''
  
  const onStartSingle = async (categoryName) => {
    const cat = categoryList.find(c => c.name === categoryName)
    if (!cat) return
    
    try {
      setLoading(true)
      setNavigatingToOverview(true)
      setError(null)
      
      // Determine whether this should be a retake flow
      const total = categoryList.length
      const completed = categoryList.filter(c => !!c.completedInCurrentRecord).length
      const isAllComplete = total > 0 && (completed >= total)
      const retakeFlow = isAllComplete
      
      // Retake: start a new record; else reuse current record
      const recordId = retakeFlow ? null : (activeRecord?.id || null)
      
      // When retakeFlow, always include ALL published categories for the new record
      const selectedIds = retakeFlow ? categoryList.map(c => c.id) : [cat.id]
      // Call prepare API to randomize package/paper
      const res = await testApi.prepare(selectedIds, recordId, retakeFlow)
      
      // Handle prepare errors
      if (!res?.ok) {
        const errorMsg = res?.data?.message || 'Failed to prepare test'
        const hint = res?.data?.hint || ''
        setError(`${errorMsg}${hint ? ' ' + hint : ''}`)
        setNavigatingToOverview(false)
        setLoading(false)
        return
      }
      
      const preparedData = res?.data
      if (!preparedData || !preparedData.categories || preparedData.categories.length === 0) {
        setError('No categories available to start')
        setNavigatingToOverview(false)
        setLoading(false)
        return
      }
      
      // Don't set loading false here - let navigation handle it
      navigate(ROUTES.studentTestOverview, { 
        state: { 
          mode: 'single', 
          categoryIds: [cat.id],
          recordId: preparedData.recordId,
          completedCategoryIds: [],
          checkpoint: false,
          preparedCategories: preparedData.categories,
          categoryNames: Object.fromEntries(categoryList.map(c => [String(c.id), c.name]))
        } 
      })
    } catch (e) {
      setError(e?.message || 'Failed to start test')
      setNavigatingToOverview(false)
      setLoading(false)
    }
  }

  const onStartAll = async () => {
    try {
      setLoading(true)
      setNavigatingToOverview(true)
      setError(null)
      
      // Treat "allComplete" as retake flow as well
      const total = categoryList.length
      const completed = categoryList.filter(c => !!c.completedInCurrentRecord).length
      const isAllComplete = total > 0 && (completed >= total)
      const retakeFlow = isAllComplete

      // Retake All → prepare ALL categories, start NEW record
      // Start All → continue remaining within current record (or start with all if no record)
      const selectedCategoryIds = retakeFlow
        ? categoryList.map(c => c.id)
        : (activeRecord ? categoryList.filter(c => !completedCategoryIds.includes(c.id)).map(c => c.id) : categoryList.map(c => c.id))
      
      const recordId = retakeFlow ? null : (activeRecord?.id || null)
      
      // Call prepare API to randomize packages/papers
      const res = await testApi.prepare(selectedCategoryIds, recordId, retakeFlow)
      
      // Handle prepare errors
      if (!res?.ok) {
        const errorMsg = res?.data?.message || 'Failed to prepare test'
        const hint = res?.data?.hint || ''
        setError(`${errorMsg}${hint ? ' ' + hint : ''}`)
        setLoading(false)
        return
      }
      
      const preparedData = res?.data
      if (!preparedData || !preparedData.categories || preparedData.categories.length === 0) {
        setError('No categories available to start')
        setLoading(false)
        return
      }
      
      // Always pass ALL categoryIds so Test Overview shows completed categories too
      const allCategoryIds = categoryList.map(c => c.id)
      
      // Don't set loading false here - let navigation handle it
      navigate(ROUTES.studentTestOverview, { 
        state: { 
          mode: 'all',
          categoryIds: allCategoryIds, // Pass ALL, not just remaining
          recordId: preparedData.recordId,
          // For Retake All, start fresh overview and include all prepared categories
          completedCategoryIds: retakeFlow ? [] : completedCategoryIds,
          checkpoint: retakeFlow ? false : (activeRecord && completedCategoryIds.length > 0),
          preparedCategories: preparedData.categories,
          // Provide names for all categories so completed placeholders show proper titles
          categoryNames: Object.fromEntries(categoryList.map(c => [c.id, c.name]))
        } 
      })
    } catch (e) {
      setError(e?.message || 'Failed to start test')
      setLoading(false)
    }
  }

  // Progress (berdasarkan kartu yang tampil):
  // Hitung langsung dari categoryList.completedInCurrentRecord (truthy) agar identik dengan indikator kartu.
  const totalCategories = categoryList.length
  const completedCount = categoryList.filter(c => !!c.completedInCurrentRecord).length
  const allComplete = (typeof summary?.allComplete === 'boolean')
    ? summary.allComplete
    : (totalCategories > 0 && (completedCount >= totalCategories))
  const retakeMode = Boolean(summary?.hasCompletedRecord) || (Number(summary?.recordCount || 0) > 1) || allComplete
  const progressPct = (totalCategories === 0 || allComplete) ? 0 : Math.round((completedCount / totalCategories) * 100)

  // Loading state
  if (loading) {
    return (
      <AppLayout
        rightHeaderSlot={
          <StudentHeaderRight
            items={navigationItems}
            onLogout={handleLogout}
          />
        }
        centerHeaderSlot={<TopNav items={navigationItems} className="hidden lg:flex" />}
      >
        <LoadingState
          message={showInitialLoading ? 'Please wait...' : (navigatingToOverview ? 'Loading test overview...' : 'Loading dashboard...')}
        />
      </AppLayout>
    )
  }
  
  // Redirecting to active test
  if (redirecting) {
    return (
      <AppLayout
        rightHeaderSlot={
          <StudentHeaderRight
            items={navigationItems}
            onLogout={handleLogout}
          />
        }
        centerHeaderSlot={<TopNav items={navigationItems} className="hidden lg:flex" />}
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <svg className="w-8 h-8 text-green-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Resuming Your Test
            </h3>
            <p className="text-sm text-gray-600">
              You have an active test session. Redirecting...
            </p>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Error state
  if (error) {
    return (
      <AppLayout
        rightHeaderSlot={
          <StudentHeaderRight
            items={navigationItems}
            onLogout={handleLogout}
          />
        }
        centerHeaderSlot={<TopNav items={navigationItems} className="hidden lg:flex" />}
      >
        <ErrorState
          title="Failed to load dashboard"
          message={error}
          onRetry={() => window.location.reload()}
        />
      </AppLayout>
    )
  }

  return (
    <AppLayout
      rightHeaderSlot={
        <StudentHeaderRight
          items={navigationItems}
          onLogout={handleLogout}
        />
      }
      centerHeaderSlot={<TopNav items={navigationItems} className="hidden lg:flex" />}
    >
      {/* Greetings Card */}
      <GreetingsCard 
        role="Student" 
        margin={classes.layout.pageTopSpacing} 
        nickname={firstName} 
        GreetingsIcon={GreetingsIcon} 
      />

      {/* Report section */}
      <div className="w-full flex justify-center mt-8">
        <StudentReport
          bestScore={Number(summary?.overallBest) || 0}
          maxScore={100}
          bandLevel={summary?.bestBand || '-'}
          bandDesc={''}
        />
      </div>

      {/* Test section */}
      <div className="w-full flex justify-center mt-8 mb-20">
        <StudentTest
          sections={categoryList.map(s => ({ 
            id: s.name, 
            title: s.name,
            completed: s.completedInCurrentRecord || false,
          }))}
          onStart={(id) => onStartSingle(id)}
          onStartAll={onStartAll}
          testRecordTo={ROUTES.studentTestRecord}
          progress={progressPct}
          totalScore={'-'}
          retakeMode={retakeMode}
          allComplete={allComplete}
        />
      </div>

    </AppLayout>
  )
}