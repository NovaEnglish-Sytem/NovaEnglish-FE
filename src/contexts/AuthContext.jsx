import React, { createContext, useContext, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ROUTES } from '../config/routes.js'
import { authApi, setAuthInvalidHandler } from '../lib/api.js'

const AuthContext = createContext({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  refreshUser: () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user
  const location = useLocation()

  const isPublicPath = (pathname) => {
    const pub = new Set([
      ROUTES.root,
      ROUTES.login,
      ROUTES.register,
      ROUTES.accountVerifyEmail,
      ROUTES.accountResetPassword,
      ROUTES.privacyPolicy,
      ROUTES.terms,
    ])
    return pub.has(pathname)
  }

  useEffect(() => {
    const pathname = location?.pathname || '/'
    let hasSession = false
    try {
      hasSession = localStorage.getItem('hasSession') === '1'
    } catch (_) {}

    // Public routes: hanya panggil me() kalau ada indikasi session, agar tidak ada 401 noise
    if (isPublicPath(pathname)) {
      if (hasSession) {
        checkAuthStatus()
      } else {
        setUser(null)
        setIsLoading(false)
      }
      return
    }

    // Protected routes: jika tidak ada session, cepatkan fallback tanpa request
    if (!hasSession) {
      setUser(null)
      setIsLoading(false)
      return
    }

    checkAuthStatus()
  }, [location?.pathname])

  const checkAuthStatus = async () => {
    try {
      const response = await authApi.me()
      setUser(response.data.user)
      try { localStorage.setItem('hasSession', '1') } catch (_) {}
    } catch (error) {
      // Try refresh flow once
      try {
        await authApi.refresh()
        const after = await authApi.me()
        setUser(after.data.user)
        try { localStorage.setItem('hasSession', '1') } catch (_) {}
      } catch (_) {
        // Still unauthorized
        setUser(null)
        try { localStorage.removeItem('hasSession') } catch (_) {}
      }
    } finally {
      setIsLoading(false)
    }
  }

  const login = (userData) => {
    setUser(userData)
    try { localStorage.setItem('hasSession', '1') } catch (_) {}
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      // Even if API call fails, we should clear local state
    } finally {
      // Always clear user state regardless of API response
      setUser(null)
      // Clear any cached data
      try { localStorage.removeItem('user') } catch (_) {}
      try { localStorage.removeItem('hasSession') } catch (_) {}
      try { sessionStorage.clear() } catch (_) {}
    }
  }

  const refreshUser = async () => {
    try {
      const response = await authApi.me()
      setUser(response.data.user)
      return response.data.user
    } catch (error) {
      setUser(null)
      try { localStorage.removeItem('hasSession') } catch (_) {}
      throw error
    }
  }

  useEffect(() => {
    setAuthInvalidHandler(async () => {
      try { await logout() } catch (_) { await logout() }
    })
    return () => { setAuthInvalidHandler(null) }
  }, [logout])

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
