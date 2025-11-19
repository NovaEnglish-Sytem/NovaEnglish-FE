import { useEffect, useRef, useState } from 'react'

/**
 * useTimer - simple countdown timer hook
 * @param {number|null} initialSeconds - starting seconds (null to idle)
 * @param {Function} onExpired - callback when reaches 0
 * @returns {{ remainingSeconds: number|null, setRemaining: Function, pause: Function, resume: Function, reset: Function }}
 */
export function useTimer(initialSeconds = null, onExpired) {
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds)
  const intervalRef = useRef(null)
  const pausedRef = useRef(false)

  const clear = () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null } }

  const tick = () => {
    setRemainingSeconds(prev => {
      if (prev === null || prev === undefined) return prev
      if (prev <= 0) return 0
      const next = prev - 1
      if (next <= 0) {
        clear()
        try { onExpired && onExpired() } catch (_) {}
        return 0
      }
      return next
    })
  }

  const start = () => {
    clear()
    if (remainingSeconds !== null && !pausedRef.current) {
      intervalRef.current = setInterval(tick, 1000)
    }
  }

  const pause = () => { pausedRef.current = true; clear() }
  const resume = () => { pausedRef.current = false; start() }

  const setRemaining = (secs) => {
    setRemainingSeconds(secs)
  }

  const reset = (secs) => {
    setRemainingSeconds(secs)
    pausedRef.current = false
    clear()
    start()
  }

  useEffect(() => {
    // auto-start when initialSeconds provided
    if (typeof initialSeconds === 'number') {
      setRemainingSeconds(initialSeconds)
    }
    return () => clear()
  }, [])

  useEffect(() => {
    // (re)start when remainingSeconds changes from null to number
    clear()
    if (typeof remainingSeconds === 'number' && remainingSeconds > 0 && !pausedRef.current) {
      intervalRef.current = setInterval(tick, 1000)
    }
    return () => clear()
  }, [remainingSeconds])

  return { remainingSeconds, setRemaining, pause, resume, reset }
}

export default useTimer
