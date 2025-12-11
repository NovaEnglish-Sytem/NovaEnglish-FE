import DashboardLayout from '../layouts/DashboardLayout.jsx'
import TutorHeaderRight from '../components/organisms/TutorHeaderRight.jsx'
import { buildTutorSidebar } from '../config/nav/tutor.js'
import { ROUTES } from '../config/routes.js'
import { classes } from '../config/theme/tokens.js'
import { useNavigate } from 'react-router-dom'
import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { api } from '../lib/api.js'
import LoadingState from '../components/organisms/LoadingState.jsx'
import ErrorState from '../components/organisms/ErrorState.jsx'
import EmptyState from '../components/organisms/EmptyState.jsx'
import { useDelayedSpinner } from '../hooks/useDelayedSpinner.js'
import TestSectionBlock from '../components/organisms/TestSectionBlock.jsx'
import Pagination from '../components/molecules/Pagination.jsx'

export const ManageFeedback = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [records, setRecords] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const showInitialLoading = useDelayedSpinner(loading && records.length === 0 && !error, 700)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (_) {}
    navigate(ROUTES.login, { replace: true })
  }

  const navigationItems = buildTutorSidebar('MANAGE FEEDBACK', {
    'DASHBOARD': () => navigate(ROUTES.tutorDashboard),
    'STUDENT PROGRESS': () => navigate(ROUTES.tutorStudentProgress),
    'MANAGE QUESTIONS': () => navigate(ROUTES.tutorManageQuestions),
    'MANAGE FEEDBACK': () => navigate(ROUTES.tutorManageFeedback),
    'MANAGE USERS': () => navigate(ROUTES.adminManageUsers),
    'ACCOUNT SETTINGS': () => navigate(ROUTES.accountSettings),
  }, user?.role)

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQ(q), 400)
    return () => clearTimeout(handle)
  }, [q])

  useEffect(() => {
    let abort = false
    const fetchRecords = async () => {
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
        })
        if (debouncedQ) params.set('search', debouncedQ)
        const res = await api.get(`/api/tutor/test-records?${params.toString()}`)
        if (abort) return
        const data = res?.data?.data || {}
        const pagination = res?.data?.pagination || {}
        setRecords(Array.isArray(data.records) ? data.records : [])
        setTotal(Number(pagination.total || 0))
        setTotalPages(Number(pagination.totalPages || 1) || 1)
      } catch (e) {
        if (!abort) setError(e?.message || 'Failed to load test records')
      } finally {
        if (!abort) setLoading(false)
      }
    }
    fetchRecords()
    return () => { abort = true }
  }, [page, pageSize, debouncedQ])

  const scrollToTop = () => {
    try {
      const container = document.querySelector('[data-dashboard-scroll="true"]')
      if (container && typeof container.scrollTo === 'function') {
        container.scrollTo({ top: 0 })
      } else {
        window.scrollTo({ top: 0 })
      }
    } catch (_) {
      // ignore
    }
  }

  const goToPage = (nextPage) => {
    scrollToTop()
    setPage(nextPage)
  }

  const formatDateLong = (d) => {
    if (!d) return 'N/A'
    try {
      return new Date(d).toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    } catch {
      return 'N/A'
    }
  }

  const mapRecordToBlock = (rec) => {
    const sortedCategoryScores = [...(rec.categoryScores || [])].sort((a, b) =>
      String(a.categoryName || '').localeCompare(String(b.categoryName || '')),
    )
    return {
      title: rec.title || 'Test',
      total: typeof rec.averageScore === 'number'
        ? Math.round(rec.averageScore)
        : 0,
      categories: sortedCategoryScores.map((cs) => {
        const pkgTitle = cs.packageTitle || ''
        const nameNode = pkgTitle ? (
          <span>
            <span className={classes.textSuccess}>{cs.categoryName}</span>
            <span className={classes.typography?.muted}>{` | ${pkgTitle}`}</span>
          </span>
        ) : (
          <span className={classes.textSuccess}>{cs.categoryName}</span>
        )
        return {
          name: nameNode,
          score: Math.round(Number(cs.score) || 0),
        }
      }),
      date: formatDateLong(rec.completedAt),
    }
  }

  if (loading && records.length === 0 && !error) {
    return (
      <DashboardLayout
        rightHeaderSlot={<TutorHeaderRight items={navigationItems} onLogout={handleLogout} />}
        sidebarItems={navigationItems}
        onLogout={handleLogout}
      >
        <LoadingState
          message={showInitialLoading ? 'Please wait...' : 'Loading test records...'}
          minHeight="min-h-[calc(100vh-100px)]"
        />
      </DashboardLayout>
    )
  }

  if (error && records.length === 0) {
    return (
      <DashboardLayout
        rightHeaderSlot={<TutorHeaderRight items={navigationItems} onLogout={handleLogout} />}
        sidebarItems={navigationItems}
        onLogout={handleLogout}
      >
        <ErrorState
          title="Failed to load test records"
          message={error}
          onRetry={() => window.location.reload()}
        />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      rightHeaderSlot={<TutorHeaderRight items={navigationItems} onLogout={handleLogout} />}
      sidebarItems={navigationItems}
      onLogout={handleLogout}
    >
      <div className="w-full max-w-[1310px] mx-auto mb-14">
        <div className={[classes.surfaceCard, 'p-6'].join(' ')}>
          <h1 className="text-center text-2xl font-semibold text-gray-700 underline">Manage Feedback</h1>

          <div className="flex items-center justify-between gap-3 my-5">
            <div className="flex items-center bg-[#f8f8f8] rounded-[3px] shadow-[2px_2px_4px_#00000033] h-[35px] w-full sm:w-auto px-3 py-1 min-w-0">
              <span className="text-gray-600">Search</span>
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); goToPage(1) }}
                placeholder="Type student name or email"
                className="h-[30px] w-full sm:w-[220px] flex-1 min-w-0 rounded-[3px] border border-gray-500 px-2 text-sm text-gray-600 bg-white focus:outline-none ml-2"
                aria-label="Search student"
              />
            </div>
            <div className="w-[140px] sm:w-[180px]" />
          </div>

          {records.length === 0 ? (
            <EmptyState
              title="No test records found"
              message={debouncedQ
                ? 'No completed test records match this name or email.'
                : 'There are no completed test records yet.'}
              minHeight="min-h-[260px]"
              className="bg-transparent"
              icon={null}
            />
          ) : (
            <div className="flex flex-col gap-6 mt-4">
              {records.map((rec) => {
                const hasFeedback = !!(rec.hasFeedback)
                const categoriesComplete = Number(rec.categoriesComplete ?? 0)
                const rawCategoriesTotal = Number(rec.categoriesTotal ?? 0)
                const categoriesTotal = Math.max(rawCategoriesTotal, categoriesComplete)
                const showCategoryRatio = categoriesTotal > 0
                const block = mapRecordToBlock(rec)
                return (
                  <div
                    key={rec.recordId}
                    className="border border-[#ececec] rounded-[10px] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.05)] p-4 sm:p-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <div className="text-gray-800 font-semibold truncate">
                          {rec.student?.fullName || '-'}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {rec.student?.email || '-'}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={[
                            'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border',
                            hasFeedback
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-gray-50 text-gray-600 border-gray-200',
                          ].join(' ')}
                        >
                          {hasFeedback ? 'Feedback filled' : 'No feedback yet'}
                        </span>
                        {showCategoryRatio && (
                          <span
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border bg-white text-gray-700 border-gray-200"
                          >
                            {categoriesComplete}/{categoriesTotal}
                          </span>
                        )}
                      </div>
                    </div>

                    <TestSectionBlock
                      record={block}
                      onViewDetails={() => {
                        if (rec.attemptId) {
                          navigate(ROUTES.studentResult.replace(':attemptId', encodeURIComponent(rec.attemptId)))
                        }
                      }}
                    />
                  </div>
                )
              })}
            </div>
          )}

          <Pagination
            page={page}
            totalPages={totalPages}
            label={`Page ${page} of ${totalPages} • Total ${total} Records`}
            onPageChange={goToPage}
            className="mt-6"
          />
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ManageFeedback
