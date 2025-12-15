import React, { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import SurfaceCard from '../components/molecules/SurfaceCard.jsx'
import { useNavigate, useParams } from 'react-router-dom'
import { HiArrowLeft } from 'react-icons/hi'
import TestSectionBlock from '../components/organisms/TestSectionBlock.jsx'
import { classes } from '../config/theme/tokens.js'
import { buildTutorSidebar } from '../config/nav/tutor.js'
import { ROUTES } from '../config/routes.js'
import TutorHeaderRight from '../components/organisms/TutorHeaderRight.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { api } from '../lib/api.js'
import LoadingState from '../components/organisms/LoadingState.jsx'
import ErrorState from '../components/organisms/ErrorState.jsx'
import { useDelayedSpinner } from '../hooks/useDelayedSpinner.js'
import { Spinner } from '../components/atoms/Spinner.jsx'
import Pagination from '../components/molecules/Pagination.jsx'

export const TutorStudentProgressDetails = () => {
  const navigate = useNavigate()
  const params = useParams()
  const { user, logout } = useAuth()
  const studentId = params?.id

  // UI/Query State
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [recordsLoading, setRecordsLoading] = useState(true)
  const [hydrated, setHydrated] = useState(false)
  const [error, setError] = useState(null)

  // Summary
  const [student, setStudent] = useState(null)

  // Test Records (paginated)
  const [records, setRecords] = useState([])
  const [bestRecord, setBestRecord] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const showInitialLoading = useDelayedSpinner(!error && !hydrated, 700)

  const handleLogout = async () => {
    try { await logout() } catch (_) {}
    navigate(ROUTES.login, { replace: true })
  }

  const navigationItems = buildTutorSidebar('STUDENT PROGRESS', {
    'DASHBOARD': () => navigate(ROUTES.tutorDashboard),
    'STUDENT PROGRESS': () => navigate(ROUTES.tutorStudentProgress),
    'MANAGE QUESTIONS': () => navigate(ROUTES.tutorManageQuestions),
    'MANAGE FEEDBACK' : () => navigate(ROUTES.tutorManageFeedback),
    'MANAGE USERS': () => navigate(ROUTES.adminManageUsers),
    'ACCOUNT SETTINGS': () => navigate(ROUTES.accountSettings),
  }, user?.role)

  const formatDateLong = (d) => {
    if (!d) return 'N/A'
    try {
      return new Date(d).toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })
    } catch {
      return 'N/A'
    }
  }

  // Fetch summary (student only)
  useEffect(() => {
    let abort = false
    const fetchSummary = async () => {
      if (!studentId) return
      try {
        setSummaryLoading(true)
        const res = await api.get(`/api/tutor/students/${encodeURIComponent(studentId)}`)
        if (abort) return
        const data = res?.data?.data || {}
        setStudent(data.student || null)
      } catch (e) {
        if (!abort) setError(e?.message || 'Failed to load student summary')
      } finally {
        if (!abort) setSummaryLoading(false)
      }
    }
    fetchSummary()
    return () => { abort = true }
  }, [studentId])

  // Fetch test records page
  useEffect(() => {
    let abort = false
    const fetchRecords = async () => {
      if (!studentId) return
      try {
        setRecordsLoading(true)
        const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
        const res = await api.get(`/api/tutor/students/${encodeURIComponent(studentId)}/test-records?${params.toString()}`)
        if (abort) return
        const data = res?.data?.data || {}
        const pagination = res?.data?.pagination || {}
        setRecords(data.records || [])
        setBestRecord(page === 1 ? data.bestScore || null : null)
        setTotal(pagination.total || 0)
        setTotalPages(pagination.totalPages || 1)
      } catch (e) {
        if (!abort) setError(e?.message || 'Failed to load test records')
      } finally {
        if (!abort) setRecordsLoading(false)
      }
    }
    fetchRecords()
    return () => { abort = true }
  }, [studentId, page, pageSize])

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

  // Hydration flag: block UI until summary and first page records are loaded
  useEffect(() => {
    if (!summaryLoading && !recordsLoading) {
      setHydrated(true)
    }
  }, [summaryLoading, recordsLoading])

  const fullNameLine = useMemo(() => {
    if (!student) return ''
    return `${student.fullName}`
  }, [student])

  // Map records → TestSectionBlock props
  const mapRecordToBlock = (rec) => {
    const normalizedTitle = String(rec.title || 'Attempt').replace(/test/ig, 'Attempt')
    const sortedCategoryScores = [...(rec.categoryScores || [])].sort((a, b) => String(a.categoryName || '').localeCompare(String(b.categoryName || '')))
    return {
      title: normalizedTitle,
      // Prefer averageScore from testRecord for shield display
      total: typeof rec.averageScore === 'number'
        ? Math.round(rec.averageScore)
        : (typeof rec.percentageScore === 'number'
          ? Math.round(rec.percentageScore)
          : (rec.totalScore ?? 0)),
      categories: sortedCategoryScores.map(cs => {
        const pkgTitle = cs.packageTitle || ''
        const nameNode = pkgTitle ? (
          <span>
            <span className={classes.textSuccess}>{cs.categoryName}</span>
            <span className={classes.typography.muted}> | {pkgTitle}</span>
          </span>
        ) : (
          <span className={classes.textSuccess}>{cs.categoryName}</span>
        )
        return {
          name: nameNode,
          // Prefer percentage for uniform scale; fallback to score
          score: typeof cs.percentage === 'number' ? Math.round(cs.percentage) : (cs.score ?? 0),
        }
      }),
      date: formatDateLong(rec.completedAt),
    }
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout
        rightHeaderSlot={<TutorHeaderRight items={navigationItems} onLogout={handleLogout} />}
        sidebarItems={navigationItems}
        onLogout={handleLogout}
      >
        <ErrorState
          title="Failed to load student details"
          message={error}
          onRetry={() => window.location.reload()}
        />
      </DashboardLayout>
    )
  }

  // Initial blocking loading screen until both summary and first records are ready
  if (!hydrated) {
    return (
      <DashboardLayout
        rightHeaderSlot={<TutorHeaderRight items={navigationItems} onLogout={handleLogout} />}
        sidebarItems={navigationItems}
        onLogout={handleLogout}
      >
        <LoadingState
          message={showInitialLoading ? 'Please wait...' : 'Loading student details...'}
          minHeight="min-h-[calc(100vh-100px)]"
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
      <SurfaceCard className="w-full mb-14">
        {/* Top bar: Back + Title */}
        <div className="grid grid-cols-[auto,1fr,auto] items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="hidden md:flex items-center gap-2 text-gray-600 hover:text-gray-800 w-max cursor-pointer"
            aria-label="Back"
          >
            <HiArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <h1 className="justify-self-center text-lg sm:text-xl md:text-2xl font-semibold text-gray-700 underline text-center">
            Student Progress Details
          </h1>

          <div className="justify-self-end" />
        </div>

        {/* Student name and email */}
        <div className="my-5 max-w-full overflow-x-auto whitespace-nowrap">
          <div className="text-gray-700 font-semibold">
            <span>Student Name: </span>
            <span className="text-[#2E7D20]">{fullNameLine || '-'}</span>
          </div>
          <div className="text-gray-700 font-semibold">
            <span>Email: </span>
            <span className="text-[#2E7D20]">{student?.email || '-'}</span>
          </div>
        </div>

        {/* Best Score Section (only on page 1 if present) */}
        {page === 1 && bestRecord ? (
          <div className="mt-4">
            <div className="text-gray-600 font-medium">Best Score</div>
            <div className="border-t border-gray-200 my-3" />
            <TestSectionBlock
              record={mapRecordToBlock(bestRecord)}
              highlight
              onViewDetails={bestRecord.attemptId
                ? () => navigate(ROUTES.studentResult.replace(':attemptId', encodeURIComponent(bestRecord.attemptId)))
                : undefined}
            />
          </div>
        ) : null}

        {/* Attempt Section */}
        <div className="mt-6">
          <div className="text-gray-600 font-medium">Attempt</div>
          <div className="border-t border-gray-200 my-3" />
          {recordsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size={40} />
            </div>
          ) : (records || []).length === 0 ? (
            <div className="text-center text-gray-500 py-8">No attempts found</div>
          ) : (
            <div className="flex flex-col gap-6">
              {(records || []).map((rec) => (
                <TestSectionBlock
                  key={rec.recordId || rec.attemptId}
                  record={mapRecordToBlock(rec)}
                  onViewDetails={rec.attemptId
                    ? () => navigate(ROUTES.studentResult.replace(':attemptId', encodeURIComponent(rec.attemptId)))
                    : undefined}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination for Test Records */}
        <Pagination
          page={page}
          totalPages={totalPages}
          label={`Page ${page} of ${totalPages} • Total ${total} Records`}
          onPageChange={goToPage}
          className="mt-6"
        />
      </SurfaceCard>
    </DashboardLayout>
  )
}

export default TutorStudentProgressDetails
