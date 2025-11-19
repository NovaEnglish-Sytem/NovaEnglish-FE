import { useEffect, useRef, useState } from 'react'
import { TEST_CONFIG } from '../config/testConfig.js'

/**
 * Reusable countdown modal controller
 * @param {number} startValue - starting countdown value
 * @param {Function} onComplete - called when countdown reaches 0 or confirm pressed
 * @returns {{ isOpen: boolean, countdown: number|null, start: Function, confirm: Function, cancel: Function }}
 */
export function useCountdownModal(startValue = TEST_CONFIG.MODAL.COUNTDOWN_START, onComplete) {
  const [isOpen, setIsOpen] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const intervalRef = useRef(null)
  const timeoutRef = useRef(null)

  const clearTimers = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null }
  }

  const start = () => {
    setIsOpen(true)
    setCountdown(startValue)
    clearTimers()
    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        const next = (typeof prev === 'number' ? prev : 0) - 1
        if (next <= 0) {
          clearTimers()
          return 0
        }
        return next
      })
    }, TEST_CONFIG.MODAL.COUNTDOWN_INTERVAL_MS)

    timeoutRef.current = setTimeout(() => {
      confirm()
    }, TEST_CONFIG.MODAL.AUTO_CONFIRM_MS)
  }

  const confirm = () => {
    clearTimers()
    setIsOpen(false)
    try { onComplete && onComplete() } catch (_) {}
  }

  const cancel = () => {
    clearTimers()
    setIsOpen(false)
  }

  useEffect(() => () => clearTimers(), [])

  return { isOpen, countdown, start, confirm, cancel }
}

export default useCountdownModal
