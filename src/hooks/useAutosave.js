import { useEffect, useRef } from 'react'
import { TEST_CONFIG } from '../config/testConfig.js'
import { testApi } from '../lib/api.js'
import { TestStorage } from '../utils/testStorage.js'

/**
 * useAutosave - debounced local save + periodic DB sync
 * @param {object} p
 * @param {string} p.attemptId
 * @param {object} p.answers
 * @param {object} p.audioCounts
 * @param {number} p.currentPageIndex
 * @param {object|null} p.meta - extra meta for session persistence
 * @param {string|null} p.sessionToken
 * @param {function} p.onSessionInvalid - called on 403 invalid session
 * @param {function} p.onDraftDetected - called on 409 PACKAGE_DRAFT
 */
export function useAutosave({ attemptId, answers, audioCounts, currentPageIndex, meta, sessionToken, onSessionInvalid, onDraftDetected }) {
  const dirtyRef = useRef(false)
  const saveTimeoutRef = useRef(null)
  const lastAnswersHashRef = useRef('')
  const syncIntervalRef = useRef(null)

  // Debounced localStorage save
  useEffect(() => {
    if (!attemptId) return
    const hasAnswers = answers && Object.keys(answers).length > 0
    const hasAudio = audioCounts && Object.keys(audioCounts).length > 0
    if (!hasAnswers && !hasAudio) return

    dirtyRef.current = true
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      TestStorage.saveLocal(attemptId, {
        answers,
        audioCounts,
        currentPageIndex,
      })
    }, TEST_CONFIG.AUTOSAVE.DEBOUNCE_MS)

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [attemptId, answers, audioCounts, currentPageIndex])

  // Periodic DB sync
  useEffect(() => {
    if (!attemptId || !sessionToken) return

    const syncToDatabase = async () => {
      const hasAnswers = answers && Object.keys(answers).length > 0
      const hasAudio = audioCounts && Object.keys(audioCounts).length > 0
      if (!dirtyRef.current || (!hasAnswers && !hasAudio)) return
      const currentHash = JSON.stringify({ answers, audioCounts, currentPageIndex })
      if (currentHash === lastAnswersHashRef.current) return

      try {
        const answersArray = Object.entries(answers).map(([itemId, answerData]) => ({
          itemId,
          type: answerData.type,
          value: answerData.value,
        }))

        const res = await testApi.saveAnswers(
          attemptId,
          {
            answers: answersArray,
            audioCounts,
            currentPageIndex,
            meta: meta || null,
          },
          sessionToken
        )

        if (!res?.ok && res?.status === 403) {
          const reason = String(res?.data?.reason || '').toLowerCase()
          if (reason === 'session_not_found' || reason === 'session_expired' || reason === 'invalid_token') {
            if (typeof onSessionInvalid === 'function') onSessionInvalid()
            return
          }
        }
        if (!res?.ok && res?.status === 409) {
          const code = String(res?.data?.code || res?.data?.error || '').toUpperCase()
          if (code === 'PACKAGE_DRAFT') {
            if (typeof onDraftDetected === 'function') onDraftDetected()
            return
          }
        }
        if (res?.ok) {
          lastAnswersHashRef.current = currentHash
          dirtyRef.current = false
        }
      } catch (_) {
        // Silent fail - retry on next interval
      }
    }

    const initialTimeout = setTimeout(syncToDatabase, TEST_CONFIG.AUTOSAVE.INITIAL_SYNC_MS)
    syncIntervalRef.current = setInterval(syncToDatabase, TEST_CONFIG.AUTOSAVE.PERIODIC_SYNC_MS)

    return () => {
      clearTimeout(initialTimeout)
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current)
    }
  }, [attemptId, answers, audioCounts, currentPageIndex, meta, sessionToken, onSessionInvalid, onDraftDetected])
}

export default useAutosave
