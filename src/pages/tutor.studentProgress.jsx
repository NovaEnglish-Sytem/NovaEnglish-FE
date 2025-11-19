import React, { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import SurfaceCard from '../components/molecules/SurfaceCard.jsx'
import { classes } from '../config/theme/tokens.js'
import { buildTutorSidebar } from '../config/nav/tutor.js'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { ROUTES } from '../config/routes.js'
import TutorHeaderRight from '../components/organisms/TutorHeaderRight.jsx'
import { api } from '../lib/api.js'
import { TbArrowsSort, TbArrowUp, TbArrowDown } from 'react-icons/tb'
import LoadingState from '../components/organisms/LoadingState.jsx'
import ErrorState from '../components/organisms/ErrorState.jsx'
import EmptyState from '../components/organisms/EmptyState.jsx'

export const TutorStudentProgress = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  // Query state
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [sortField, setSortField] = useState('lastUpdate')
  const [sortOrder, setSortOrder] = useState('desc')

  // Data state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [students, setStudents] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      /* no-op */
    } finally {
      navigate(ROUTES.login, { replace: true })
    }
  }

  const navigationItems = buildTutorSidebar('STUDENT PROGRESS', {
    'DASHBOARD': () => navigate(ROUTES.dashboardTutor),
    'STUDENT PROGRESS': () => navigate(ROUTES.tutorStudentProgress),
    'MANAGE QUESTIONS': () => navigate(ROUTES.tutorManageQuestions),
    'MANAGE FEEDBACK' : () => navigate(ROUTES.tutorManageFeedback),
    'MANAGE USERS': () => navigate(ROUTES.adminManageUsers),
    'ACCOUNT SETTINGS': () => navigate(ROUTES.accountSettings),
  }, user?.role)

  // Format date helper (relative)
  const formatLastUpdate = (date) => {
    if (!date) return 'N/A'
    const now = new Date()
    const updateDate = new Date(date)
    const diffMs = now - updateDate
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    const diffWeeks = Math.floor(diffDays / 7)
    const diffMonths = Math.floor(diffDays / 30)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`
  }

  // Fetch students
  useEffect(() => {
    // debounce search term for smooth UX
    const handle = setTimeout(() => setDebouncedQ(q), 500)
    return () => clearTimeout(handle)
  }, [q])

  // Fetch students with debounced search term
  useEffect(() => {
    let abort = false
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
          search: debouncedQ,
          sortField,
          sortOrder,
        })
        const res = await api.get(`/api/tutor/students?${params.toString()}`)
        if (!abort) {
          setStudents(res?.data?.data?.students || [])
          const p = res?.data?.pagination
          setTotal(p?.total || 0)
          setTotalPages(p?.totalPages || 1)
        }
      } catch (e) {
        if (!abort) setError(e?.message || 'Failed to load')
      } finally {
        if (!abort) setLoading(false)
      }
    }
    fetchData()
    return () => { abort = true }
  }, [page, pageSize, debouncedQ, sortField, sortOrder])

  // Sorting handlers (toggle asc/desc)
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder(field === 'fullName' ? 'asc' : 'desc')
    }
    setPage(1)
  }

  const headerSortIndicator = (field) => {
    const isActive = sortField === field
    if (!isActive) return <TbArrowsSort className="inline ml-1 text-gray-500" />
    return sortOrder === 'asc'
      ? <TbArrowUp className="inline ml-1 text-gray-500" />
      : <TbArrowDown className="inline ml-1 text-gray-500" />
  }

  const rows = useMemo(
    () =>
      students.map((s) => ({
        id: s.id,
        name: s.fullName,
        email: s.email,
        averageScore: s.bestAverageScore,
        totalAttempts: s.totalAttempts,
        lastUpdate: formatLastUpdate(s.lastUpdate),
      })),
    [students]
  )

  // Initial loading state (no data yet)
  if (loading && students.length === 0 && !error) {
    return (
      <DashboardLayout
        rightHeaderSlot={<TutorHeaderRight items={navigationItems} onLogout={handleLogout} />}
        sidebarItems={navigationItems}
        onLogout={handleLogout}
      >
        <LoadingState message="Loading students..." minHeight="min-h-[calc(100vh-100px)]" />
      </DashboardLayout>
    )
  }

  // Error state (on initial load)
  if (error && students.length === 0) {
    return (
      <DashboardLayout
        rightHeaderSlot={<TutorHeaderRight items={navigationItems} onLogout={handleLogout} />}
        sidebarItems={navigationItems}
        onLogout={handleLogout}
      >
        <ErrorState
          title="Failed to load students"
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
      <SurfaceCard className="w-full">
        {/* Title */}
        <h1 className="text-center text-2xl font-semibold text-gray-700 underline">Student Progress</h1>

        {/* Search only (no Filter/Sort buttons) */}
        <div className="flex items-center justify-between gap-3 my-5">
          <div className="flex items-center bg-[#f8f8f8] rounded-[3px] shadow-[2px_2px_4px_#00000033] h-[35px] w-full sm:w-auto px-3 py-1 min-w-0">
            <span className="text-gray-600">Search</span>
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1) }}
              placeholder="Type Here"
              className="h-[30px] w-full sm:w-[220px] flex-1 min-w-0 rounded-[3px] border border-gray-500 px-2 text-sm text-gray-600 bg-white focus:outline-none ml-2"
              aria-label="Search"
            />
          </div>
          {/* spacer for layout alignment */}
          <div className="w-[140px] sm:w-[180px]" />
        </div>

        {/* Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-center">
            <thead>
              <tr className={['border-b border-[#ececec]', classes.textSuccess].join(' ')}>
                <th
                  className="py-3 px-4 font-medium whitespace-nowrap cursor-pointer select-none"
                  onClick={() => handleSort('fullName')}
                >
                  Fullname {headerSortIndicator('fullName')}
                </th>
                <th
                  className="py-3 px-4 font-medium whitespace-nowrap cursor-pointer select-none"
                  onClick={() => handleSort('email')}
                >
                  Email {headerSortIndicator('email')}
                </th>
                <th
                  className="py-3 px-4 font-medium whitespace-nowrap cursor-pointer select-none"
                  onClick={() => handleSort('bestAverageScore')}
                >
                  Band Score {headerSortIndicator('bestAverageScore')}
                </th>
                <th
                  className="py-3 px-4 font-medium whitespace-nowrap cursor-pointer select-none"
                  onClick={() => handleSort('totalAttempts')}
                >
                  Total Attempts {headerSortIndicator('totalAttempts')}
                </th>
                <th
                  className="py-3 px-4 font-medium whitespace-nowrap cursor-pointer select-none"
                  onClick={() => handleSort('lastUpdate')}
                >
                  Last Update {headerSortIndicator('lastUpdate')}
                </th>
                <th className="py-3 px-4 font-medium whitespace-nowrap"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-gray-500">Loading...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-gray-500">No student progress data available</td>
                </tr>
              ) : (
                rows.map((r, idx) => (
                  <tr
                    key={r.id || r.name + idx}
                    className={['border-t border-[#ececec]', idx % 2 === 1 ? 'bg-white/40' : 'bg-transparent']
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <td className="py-3 px-4 text-gray-700 whitespace-nowrap">{r.name}</td>
                    <td className="py-3 px-4 text-gray-700 whitespace-nowrap">{r.email}</td>
                    <td className="py-3 px-4 text-gray-700 whitespace-nowrap">{(r.averageScore || r.averageScore === 0) ? Math.round(Number(r.averageScore) || 0) : 'N/A'}</td>
                    <td className="py-3 px-4 text-gray-700 whitespace-nowrap">{r.totalAttempts}</td>
                    <td className="py-3 px-4 text-gray-700 whitespace-nowrap">{r.lastUpdate}</td>
                    <td className="py-3 px-4 text-gray-500 underline whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => navigate(ROUTES.tutorStudentProgressDetails.replace(':id', r.id))}
                        className="underline text-gray-500 hover:text-gray-700 cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {page} of {totalPages} • Total {total} Data
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 rounded border border-[#ececec] disabled:opacity-50"
            >
              Prev
            </button>
            {Array.from({ length: totalPages || 1 }).slice(0, 7).map((_, i) => {
              const p = i + 1
              const isActive = p === page
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={[
                    'px-3 py-1 rounded border border-[#ececec]',
                    isActive ? 'bg-[#e6f5e9] text-[#007a33] font-semibold' : ''
                  ].join(' ')}
                >
                  {p}
                </button>
              )
            })}
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 rounded border border-[#ececec] disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </SurfaceCard>
    </DashboardLayout>
  )
}

export default TutorStudentProgress
