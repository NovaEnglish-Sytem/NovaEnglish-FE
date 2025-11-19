const TEST_STORAGE_KEY = 'nova_test_data'

export const TestStorage = {
  saveLocal(attemptId, data) {
    try {
      const existing = this.getLocal(attemptId) || {}
      const updated = {
        ...existing,
        ...data,
        lastSavedAt: Date.now(),
      }
      localStorage.setItem(`${TEST_STORAGE_KEY}_${attemptId}`, JSON.stringify(updated))
      return true
    } catch (e) {
      console.error('Failed to save to localStorage:', e)
      return false
    }
  },

  getLocal(attemptId) {
    try {
      const data = localStorage.getItem(`${TEST_STORAGE_KEY}_${attemptId}`)
      return data ? JSON.parse(data) : null
    } catch (e) {
      console.error('Failed to get from localStorage:', e)
      return null
    }
  },

  clearLocal(attemptId) {
    try {
      localStorage.removeItem(`${TEST_STORAGE_KEY}_${attemptId}`)
      // Also clear session token
      sessionStorage.removeItem(`test_session_${attemptId}`)
    } catch (e) {
      console.error('Failed to clear localStorage:', e)
    }
  },

  clearAllLocal() {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(TEST_STORAGE_KEY)) {
          localStorage.removeItem(key)
        }
      })
      // Clear all test sessions
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('test_session_')) {
          sessionStorage.removeItem(key)
        }
      })
    } catch (e) {
      console.error('Failed to clear all test data:', e)
    }
  },

  saveSessionToken(attemptId, token) {
    try {
      sessionStorage.setItem(`test_session_${attemptId}`, token)
    } catch (e) {
      console.error('Failed to save session token:', e)
    }
  },

  getSessionToken(attemptId) {
    try {
      return sessionStorage.getItem(`test_session_${attemptId}`)
    } catch (e) {
      console.error('Failed to get session token:', e)
      return null
    }
  },

  getAllAttemptIds() {
    try {
      const attemptIds = []
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(TEST_STORAGE_KEY)) {
          const attemptId = key.replace(`${TEST_STORAGE_KEY}_`, '')
          attemptIds.push(attemptId)
        }
      })
      return attemptIds
    } catch (e) {
      console.error('Failed to get all attempt IDs:', e)
      return []
    }
  },

  clearStaleData(maxAgeHours = 24) {
    try {
      const now = Date.now()
      const maxAge = maxAgeHours * 60 * 60 * 1000
      let cleared = 0

      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(TEST_STORAGE_KEY)) {
          try {
            const data = JSON.parse(localStorage.getItem(key))
            const lastSaved = data?.lastSavedAt || 0
            
            if (now - lastSaved > maxAge) {
              localStorage.removeItem(key)
              cleared++
              
              // Also clear associated session token
              const attemptId = key.replace(`${TEST_STORAGE_KEY}_`, '')
              sessionStorage.removeItem(`test_session_${attemptId}`)
            }
          } catch (e) {
            // Corrupted data - remove it
            localStorage.removeItem(key)
            cleared++
          }
        }
      })

      return cleared
    } catch (e) {
      console.error('Failed to clear stale data:', e)
      return 0
    }
  },

  validateAndCleanup(activeAttemptId = null) {
    try {
      let cleared = 0
      const allAttemptIds = this.getAllAttemptIds()

      allAttemptIds.forEach(attemptId => {
        // Keep active test localStorage
        if (activeAttemptId && attemptId === activeAttemptId) {
          return
        }

        // Clear all other test data (either completed or from different session)
        this.clearLocal(attemptId)
        cleared++
      })

      return cleared
    } catch (e) {
      console.error('Failed to clear inactive data:', e)
      return 0
    }
  },

  smartCleanup(keepAttemptId = null) {
    try {
      // First clear stale data (older than 24 hours)
      const staleCleared = this.clearStaleData(24)
      
      // Then clear inactive tests (except keepAttemptId)
      const inactiveCleared = this.validateAndCleanup(keepAttemptId)
      
      return {
        stale: staleCleared,
        inactive: inactiveCleared,
        total: staleCleared + inactiveCleared
      }
    } catch (e) {
      console.error('Failed to cleanup:', e)
      return { stale: 0, inactive: 0, total: 0 }
    }
  }
}
