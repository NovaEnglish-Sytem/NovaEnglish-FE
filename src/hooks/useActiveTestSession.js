import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { studentApi } from '../lib/api.js'
import { ROUTES } from '../config/routes.js'
import { TestStorage } from '../utils/testStorage.js'

/**
 * Hook to check for active test session and handle expired sessions
 * - If active session exists and not expired: redirects to test page
 * - If active session exists and expired: auto-submits and cleans up
 * - If no active session: does nothing
 * 
 * @param {object} options - Configuration options
 * @param {boolean} options.autoRedirect - Auto redirect to test page if active session (default: true)
 * @param {boolean} options.checkOnMount - Check session on component mount (default: true)
 * @returns {{ checking: boolean, hasActiveSession: boolean, activeAttemptId: string|null }}
 */
export function useActiveTestSession({ autoRedirect = true, checkOnMount = true } = {}) {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(checkOnMount)
  const [hasActiveSession, setHasActiveSession] = useState(false)
  const [activeAttemptId, setActiveAttemptId] = useState(null)

  useEffect(() => {
    if (!checkOnMount) return

    const checkSession = async () => {
      try {
        setChecking(true)
        
        // Call backend API to check for active session
        // Backend will auto-submit expired sessions
        const res = await studentApi.checkActiveSession()
        
        if (!res.ok) {
          setHasActiveSession(false)
          setActiveAttemptId(null)
          return
        }

        const { activeSession, autoSubmitted } = res.data || {}

        // Cleanup localStorage for auto-submitted attempts
        if (autoSubmitted?.finalizedAttemptIds?.length > 0) {
          autoSubmitted.finalizedAttemptIds.forEach(attemptId => {
            try {
              TestStorage.clearLocal(attemptId)
              sessionStorage.removeItem('last_valid_attemptId')
            } catch (e) {
              // Silent fail
            }
          })
        }

        // If active non-expired session exists
        if (activeSession && !activeSession.isExpired) {
          setHasActiveSession(true)
          setActiveAttemptId(activeSession.attemptId)
          
          // Auto redirect to test page
          if (autoRedirect) {
            navigate(ROUTES.studentTest.replace(':attemptId', activeSession.attemptId), { replace: true })
          }
        } else {
          setHasActiveSession(false)
          setActiveAttemptId(null)
        }
      } catch (error) {
        // Silent fail - allow page to load normally
        setHasActiveSession(false)
        setActiveAttemptId(null)
      } finally {
        setChecking(false)
      }
    }

    checkSession()
  }, [checkOnMount, autoRedirect, navigate])

  return {
    checking,
    hasActiveSession,
    activeAttemptId
  }
}
