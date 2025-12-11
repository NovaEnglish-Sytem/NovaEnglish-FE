import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout.jsx'
import { TopNav } from '../components/organisms/TopNav.jsx'
import { buildStudentTopNav } from '../config/nav/student.js'
import { HiArrowLeft } from 'react-icons/hi'
import { classes } from '../config/theme/tokens.js'
import StudentHeaderRight from '../components/organisms/StudentHeaderRight.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import TestSectionBlock from '../components/organisms/TestSectionBlock.jsx'
import { ROUTES } from '../config/routes.js'
import { studentApi } from '../lib/api.js'
import LoadingState from '../components/organisms/LoadingState.jsx'
import ErrorState from '../components/organisms/ErrorState.jsx'
import EmptyState from '../components/organisms/EmptyState.jsx'
import { useDelayedSpinner } from '../hooks/useDelayedSpinner.js'
import { Spinner } from '../components/atoms/Spinner.jsx'
import { useActiveTestSession } from '../hooks/useActiveTestSession.js'
import Pagination from '../components/molecules/Pagination.jsx'

export const StudentTestRecord = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [records, setRecords] = useState([])
  const [bestScore, setBestScore] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  
  const showInitialLoading = useDelayedSpinner(loading && records.length === 0, 700)
  
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

  const navigationItems = buildStudentTopNav('TEST RECORD', {
    'DASHBOARD': () => navigate(ROUTES.dashboardStudent),
    'TEST RECORD': () => navigate(ROUTES.studentTestRecord),
  })

  // Detect if arrived from Result via Close (replace)
  const cameFromResultRef = useRef(!!(location.state && location.state.fromResult))

  // Immediately clear state to avoid sticky flags across pagination
  useEffect(() => {
    if (cameFromResultRef.current) {
      navigate(ROUTES.studentTestRecord, { replace: true })
    }
  }, [])

  const safeBack = () => {
    try {
      // If came from Result, go straight to dashboard (avoid double back)
      if (cameFromResultRef.current) {
        navigate(ROUTES.dashboardStudent, { replace: true })
        return
      }
      // Otherwise, if there is meaningful history, go back; else go to dashboard
      if (window.history && window.history.length > 1) {
        navigate(-1)
      } else {
        navigate(ROUTES.dashboardStudent, { replace: true })
      }
    } catch (_) {
      navigate(ROUTES.dashboardStudent, { replace: true })
    }
  }

  // Handle browser back when arrived from Result
  useEffect(() => {
    if (!cameFromResultRef.current) return
    const handlePop = () => {
      navigate(ROUTES.dashboardStudent, { replace: true })
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [navigate])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await studentApi.testRecords({ page, pageSize, sort: 'desc' })
        if (!mounted) return
        const data = res?.data || {}
        setRecords(Array.isArray(data.records) ? data.records : [])
        setBestScore(data.bestScore || null)
        setTotalPages(Number(data?.pagination?.totalPages) || 1)
        setTotal(Number(data?.pagination?.total) || 0)
      } catch (e) {
        if (!mounted) return
        setError(e?.message || 'Failed to load test records')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [page, pageSize])

  const scrollToTop = () => {
    try {
      window.scrollTo({ top: 0 })
    } catch (_) {
      // ignore
    }
  }

  const goToPage = (nextPage) => {
    scrollToTop()
    setPage(nextPage)
  }

  // Loading state
  if (loading && records.length === 0) {
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
          message={showInitialLoading ? 'Please wait...' : 'Loading test records...'}
        />
      </AppLayout>
    )
  }

  // Error state
  if (error && records.length === 0) {
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
          title="Failed to load test records"
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
      <div className="max-w-[1310px] mx-auto px-4 my-20 md:px-0">
        <div className={[classes.surfaceCard, 'px-6 pt-10 pb-12'].join(' ')}>
          <div className="grid grid-cols-3 items-center pb-6 md:pb-10">
            <button
              type="button"
              onClick={safeBack}
              className="hidden md:inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 cursor-pointer"
              aria-label="Back"
            >
              <HiArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>

            <h1 className="col-span-3 md:col-span-1 md:col-start-2 justify-self-center text-xl md:text-2xl font-semibold text-gray-700 underline text-center">Test Record</h1>

            <div className="hidden md:block justify-self-end" />
          </div>

          {page === 1 ? (
            <div>
              <div className="text-gray-600 font-medium">Best Score</div>
              <div className="border-t border-gray-200 mt-3 mb-5" />
              {bestScore ? (
                <TestSectionBlock
                  highlight
                  record={{
                    title: bestScore.title,
                    total: (typeof bestScore.averageScore === 'number') ? Math.round(bestScore.averageScore) : Math.round(Number(bestScore.total) || 0),
                    averageScore: bestScore.averageScore,
                    categories: bestScore.categories || [],
                    date: (() => {
                      const d = new Date(bestScore.date)
                      const parts = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).formatToParts(d)
                      const map = Object.fromEntries(parts.map(p => [p.type, p.value]))
                      return `${map.weekday}, ${map.day} ${map.month} ${map.year}`
                    })(),
                  }}
                  onViewDetails={() => navigate(`/student/result/${encodeURIComponent(bestScore.attemptId || bestScore.id)}`)}
                />
              ) : (
                <div className="text-gray-500">No attempts yet</div>
              )}
            </div>
          ) : null}

          <div className="mt-12">
            <div className="text-gray-600 font-medium">Attempt</div>
            <div className="border-t border-gray-200 mt-3 mb-5" />
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size={40} />
              </div>
            ) : error ? (
              <div className="text-center text-red-600 py-8">{error}</div>
            ) : (
              <>
                {records.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">No attempts found</div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {records.map((rec) => (
                      <TestSectionBlock
                        key={rec.id}
                        record={{
                          title: rec.title,
                          total: (typeof rec.averageScore === 'number') ? Math.round(rec.averageScore) : Math.round(Number(rec.total) || 0),
                          averageScore: rec.averageScore,
                          categories: rec.categories || [],
                          date: (() => {
                            const d = new Date(rec.date)
                            const parts = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).formatToParts(d)
                            const map = Object.fromEntries(parts.map(p => [p.type, p.value]))
                            return `${map.weekday}, ${map.day} ${map.month} ${map.year}`
                          })(),
                        }}
                        onViewDetails={() => navigate(`/student/result/${encodeURIComponent(rec.attemptId || rec.id)}`)}
                      />
                    ))}
                  </div>
                )}
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  label={`Page ${page} of ${totalPages} • Total ${total} Records`}
                  onPageChange={goToPage}
                  className="mt-6"
                />
              </>
            )}
          </div>
          
        </div>
      </div>
    </AppLayout>
  )
}

export default StudentTestRecord
