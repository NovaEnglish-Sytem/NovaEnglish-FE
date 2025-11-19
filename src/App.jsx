import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import ErrorBoundary from './components/organisms/ErrorBoundary.jsx'
import LoadingFallback from './components/atoms/LoadingFallback.jsx'
import ThemedErrorFallback from './components/organisms/ThemedErrorFallback.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { ProtectedRoute, PublicRoute, StudentRoute, TutorRoute, AdminRoute } from './components/util/ProtectedRoute.jsx'
import { ROUTES } from './config/routes.js'

// Lazy-loaded pages (map to named exports where applicable)
const Login = lazy(() => import('./pages/auth.login.jsx').then(m => ({ default: m.Login })))
const Register = lazy(() => import('./pages/auth.register.jsx').then(m => ({ default: m.Register })))
const VerifyEmailPage = lazy(() => import('./pages/account.verifyEmail.jsx').then(m => ({ default: m.VerifyEmailPage })))
const RequestReset = lazy(() => import('./pages/account.requestReset.jsx').then(m => ({ default: m.RequestReset })))
const ResetPassword = lazy(() => import('./pages/account.forgotPassword.jsx').then(m => ({ default: m.ResetPassword })))
const PrivacyPolicy = lazy(() => import('./pages/legal.policy.jsx').then(m => ({ default: m.PrivacyPolicy })))
const Terms = lazy(() => import('./pages/legal.term.jsx').then(m => ({ default: m.Terms })))
const StudentDashboard = lazy(() => import('./pages/student.dashboard.jsx').then(m => ({ default: m.StudentDashboard })))
const TutorDashboard = lazy(() => import('./pages/tutor.dashboard.jsx').then(m => ({ default: m.TutorDashboard })))
const AccountSettingsPage = lazy(() => import('./pages/account.settings.jsx')) // default export
const StudentTestRecord = lazy(() => import('./pages/student.testRecord.jsx').then(m => ({ default: m.StudentTestRecord })))
const StudentTestOverview = lazy(() => import('./pages/student.testOverview.jsx').then(m => ({ default: m.StudentTestOverview })))
const ResultPage = lazy(() => import('./pages/student.result.jsx').then(m => ({ default: m.ResultPage })))
const StudentTestPage = lazy(() => import('./pages/student.test.jsx').then(m => ({ default: m.StudentTestPage })))
const TutorStudentProgress = lazy(() => import('./pages/tutor.studentProgress.jsx').then(m => ({ default: m.TutorStudentProgress })))
const TutorStudentProgressDetails = lazy(() => import('./pages/tutor.studentProgressDetails.jsx').then(m => ({ default: m.TutorStudentProgressDetails })))
const TutorManageQuestions = lazy(() => import('./pages/tutor.manageQuestion.jsx').then(m => ({ default: m.TutorManageQuestions })))
const TutorManageQuestionsDetail = lazy(() => import('./pages/tutor.manageQuestionsDetail.jsx').then(m => ({ default: m.TutorManageQuestionsDetail })))
const TutorCreateQuestions = lazy(() => import('./pages/tutor.createQuestions.jsx').then(m => ({ default: m.TutorCreateQuestions })))
const ManageFeedback = lazy(() => import('./pages/tutor.manageFeedback.jsx').then(m => ({ default: m.ManageFeedback })))
const ManageUsers = lazy(() => import('./pages/tutor.manageUser.jsx')) // default export only

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    // Always reset scroll to top-left on route change
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }, [pathname])
  return null
}

function App() {
  return (
    <AuthProvider>
      <ErrorBoundary fallback={<ThemedErrorFallback />}>
        <ScrollToTop />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Root */}
            <Route path={ROUTES.root} element={<Navigate to={ROUTES.login} replace />} />

            {/* Public/Auth Routes */}
            <Route
              path={ROUTES.login}
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path={ROUTES.register}
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route
              path={ROUTES.accountVerifyEmail}
              element={
                <PublicRoute>
                  <VerifyEmailPage />
                </PublicRoute>
              }
            />
            <Route
              path={ROUTES.accountRequestReset}
              element={
                <RequestReset />
              }
            />
            <Route
              path={ROUTES.accountResetPassword}
              element={
                <ResetPassword />
              }
            />
            <Route
              path={ROUTES.privacyPolicy}
              element={
                <PublicRoute>
                  <PrivacyPolicy />
                </PublicRoute>
              }
            />
            <Route
              path={ROUTES.terms}
              element={
                <PublicRoute>
                  <Terms />
                </PublicRoute>
              }
            />

            {/* Student Routes */}
            <Route path={ROUTES.studentDashboard} element={<StudentRoute><StudentDashboard /></StudentRoute>} />
            <Route path={ROUTES.studentTestRecord} element={<StudentRoute><StudentTestRecord /></StudentRoute>} />
            <Route path={ROUTES.studentTestOverview} element={<StudentRoute><StudentTestOverview /></StudentRoute>} />
            <Route path={ROUTES.studentTest} element={<StudentRoute><StudentTestPage /></StudentRoute>} />
            <Route path={ROUTES.studentResult} element={<StudentRoute><ResultPage /></StudentRoute>} />

            {/* Tutor/Admin Routes */}
            <Route path={ROUTES.tutorDashboard} element={<TutorRoute><TutorDashboard /></TutorRoute>} />
            <Route path={ROUTES.tutorStudentProgress} element={<TutorRoute><TutorStudentProgress /></TutorRoute>} />
            <Route path={ROUTES.tutorStudentProgressDetails} element={<TutorRoute><TutorStudentProgressDetails /></TutorRoute>} />
            <Route path={ROUTES.tutorManageQuestions} element={<TutorRoute><TutorManageQuestions /></TutorRoute>} />
            <Route path={ROUTES.tutorManageQuestionsDetail} element={<TutorRoute><TutorManageQuestionsDetail /></TutorRoute>} />
            <Route path={ROUTES.tutorCreateQuestions} element={<TutorRoute><TutorCreateQuestions /></TutorRoute>} />
            <Route path={ROUTES.tutorManageFeedback} element={<TutorRoute><ManageFeedback /></TutorRoute>} />

            {/* Admin Routes */}
            <Route path={ROUTES.adminManageUsers} element={<AdminRoute><ManageUsers /></AdminRoute>} />

            {/* Protected Account Routes */}
            <Route
              path={ROUTES.accountSettings}
              element={
                <ProtectedRoute>
                  <AccountSettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Legacy Redirects */}
            <Route path="/dashboard/student" element={<Navigate to={ROUTES.studentDashboard} replace />} />
            <Route path="/dashboard/tutor" element={<Navigate to={ROUTES.tutorDashboard} replace />} />
            <Route path="/dashboard/tutor/manage-users" element={<Navigate to={ROUTES.adminManageUsers} replace />} />
            <Route path="/result" element={<Navigate to={ROUTES.studentResult} replace />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to={ROUTES.login} replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </AuthProvider>
  )
}

export default App
