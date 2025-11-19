import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { ROUTES } from '../../config/routes.js'
import LoadingFallback from '../atoms/LoadingFallback.jsx'

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isLoading, isAuthenticated } = useAuth()
  const location = useLocation()

  // Show loading while checking authentication
  if (isLoading) {
    return <LoadingFallback />
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} state={{ from: location }} replace />
  }

  // Role check: support string or array
  const isAllowed = (req, role) => {
    if (!req || (Array.isArray(req) && req.length === 0)) return true
    if (Array.isArray(req)) return req.includes(role)
    return role === req
  }

  if (!isAllowed(allowedRoles, user?.role)) {
    // Redirect to the appropriate dashboard for the current user role
    const dashboardRoute =
      user?.role === 'ADMIN'
        ? ROUTES.tutorDashboard
        : user?.role === 'TUTOR'
          ? ROUTES.tutorDashboard
          : ROUTES.studentDashboard
    return <Navigate to={dashboardRoute} replace />
  }

  return children
}

// Convenience wrappers to reduce repetition
export const StudentRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={["STUDENT"]}>{children}</ProtectedRoute>
)

export const TutorRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={["TUTOR", "ADMIN"]}>{children}</ProtectedRoute>
)

export const AdminRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={["ADMIN"]}>{children}</ProtectedRoute>
)

export const PublicRoute = ({ children }) => {
  const { user, isLoading, isAuthenticated } = useAuth()

  // Show loading while checking authentication
  if (isLoading) {
    return <LoadingFallback />
  }

  // Redirect authenticated users to appropriate dashboard
  if (isAuthenticated && user) {
    const dashboardRoute =
      user.role === 'ADMIN'
        ? ROUTES.tutorDashboard
        : user.role === 'TUTOR'
          ? ROUTES.tutorDashboard
          : ROUTES.studentDashboard
    return <Navigate to={dashboardRoute} replace />
  }

  return children
}

export default ProtectedRoute
