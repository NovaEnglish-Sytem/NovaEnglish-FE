import React, { useState, useEffect } from 'react'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import TutorStats from '../components/organisms/TutorStats.jsx'
import StudentProgressTable from '../components/organisms/StudentProgressTable.jsx'
import ClassPerformance from '../components/organisms/ClassPerformance.jsx'
import GreetingsCard from '../components/organisms/GreetingsCard.jsx'
import LoadingState from '../components/organisms/LoadingState.jsx'
import ErrorState from '../components/organisms/ErrorState.jsx'
import GreetingsIcon from '../assets/TutorGreetings.svg'
import { buildTutorSidebar } from '../config/nav/tutor.js'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../config/routes.js'
import TutorHeaderRight from '../components/organisms/TutorHeaderRight.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { api } from '../lib/api.js'
import { useDelayedSpinner } from '../hooks/useDelayedSpinner.js'

export const TutorDashboard = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState(null)
  const [studentsPreview, setStudentsPreview] = useState([])
  const [error, setError] = useState(null)

  const showInitialLoading = useDelayedSpinner(loading, 700)

  // Build navigation based on user role
  const navigationHandlers = {
    'DASHBOARD': () => navigate(user?.role === 'ADMIN' ? ROUTES.adminDashboard : ROUTES.tutorDashboard),
    'STUDENT PROGRESS': () => navigate(ROUTES.tutorStudentProgress),
    'MANAGE QUESTIONS': () => navigate(ROUTES.tutorManageQuestions),
    'MANAGE FEEDBACK': () => navigate(ROUTES.tutorManageFeedback),
    'MANAGE USERS': () => navigate(ROUTES.adminManageUsers),
    'ACCOUNT SETTINGS': () => navigate(ROUTES.accountSettings),
  }

  const navigationItems = buildTutorSidebar('DASHBOARD', navigationHandlers, user?.role)

  const handleLogout = async () => {
    try {
      await logout()
      navigate(ROUTES.login, { replace: true })
    } catch {
      /* no-op */
      navigate(ROUTES.login, { replace: true })
    }
  }

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch dashboard summary (corrected path and response handling)
        const summaryResponse = await api.get('/api/tutor/dashboard/summary')
        if (!summaryResponse?.data?.ok) {
          throw new Error(summaryResponse?.data?.message || 'Failed to load dashboard summary')
        }

        // Fetch students preview (corrected path and response handling)
        const studentsResponse = await api.get('/api/tutor/students/preview')
        if (!studentsResponse?.data?.ok) {
          throw new Error(studentsResponse?.data?.message || 'Failed to load students preview')
        }

        // Normalize state with backend payload shape
        setDashboardData(summaryResponse.data.data)
        setStudentsPreview((studentsResponse.data.data && studentsResponse.data.data.students) || [])
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <DashboardLayout
        rightHeaderSlot={<TutorHeaderRight items={navigationItems} onLogout={handleLogout} />}
        sidebarItems={navigationItems}
        showFooter={true}
        onLogout={handleLogout}
      >
        <LoadingState
          message={showInitialLoading ? 'Please wait...' : 'Loading dashboard...'}
          minHeight="min-h-[calc(100vh-100px)]"
        />
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout
        rightHeaderSlot={<TutorHeaderRight items={navigationItems} onLogout={handleLogout} />}
        sidebarItems={navigationItems}
        showFooter={true}
        onLogout={handleLogout}
      >
        <ErrorState
          title="Failed to load dashboard"
          message={error}
          onRetry={() => window.location.reload()}
          retryLabel="Retry"
        />
      </DashboardLayout>
    )
  }

  // Prepare stats items
  const statsItems = [
    {
      title: 'Active Students (This Month)',
      value: dashboardData?.activeStudentsThisMonth ?? 'N/A'
    },
    {
      title: 'Test Attempts (This Month)',
      value: dashboardData?.testAttemptsThisMonth ?? 'N/A'
    },
    {
      title: 'Most Common Band Score',
      value: dashboardData?.mostCommonStudentLevel ?? 'N/A'
    }
  ]

  // Prepare class performance data from backend
  const classPerformanceData = (dashboardData?.classPerformance?.categories || []).map(c => ({ name: c.name, score: c.avgScore }))
  const rawAvgScore = dashboardData?.classPerformance?.kpis?.avgScore
  const roundedAvgScore = typeof rawAvgScore === 'number'
    ? Math.round(rawAvgScore)
    : (rawAvgScore ?? null)
  const classPerformanceKpis = {
    avgScore: roundedAvgScore,
    totalStudent: dashboardData?.classPerformance?.kpis?.totalStudents ?? 0
  }

  return (
    <DashboardLayout
      rightHeaderSlot={<TutorHeaderRight items={navigationItems} onLogout={handleLogout} />}
      sidebarItems={navigationItems}
      showFooter={true}
      onLogout={handleLogout}
    >
      {/* Greeting banner */}
      <GreetingsCard
        nickname={dashboardData?.nickname || (user?.nickname || user?.fullName || 'Tutor').trim().split(/\s+/)[0]}
        GreetingsIcon={GreetingsIcon}
      />

      {/* Stats summary */}
      <div className="mt-8">
        <TutorStats items={statsItems} />
      </div>

      {/* Student Progress table preview */}
      <div className="mt-8">
        <StudentProgressTable 
          students={studentsPreview}
          onViewDetails={() => navigate(ROUTES.tutorStudentProgress)} 
        />
      </div>

      {/* Class Performance - now using real data from backend */}
      <div className="mt-8 mb-10">
        <ClassPerformance
          data={classPerformanceData}
          kpis={classPerformanceKpis}
          onManageQuestions={() => navigate(ROUTES.tutorManageQuestions)}
        />
      </div>
    </DashboardLayout>
  )
}

export default TutorDashboard
