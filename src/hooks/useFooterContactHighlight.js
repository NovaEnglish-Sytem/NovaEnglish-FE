import { useCallback } from 'react'

export default function useFooterContactHighlight({
  targetId = 'footer-contact',
  behavior = 'smooth',
  autoClearMs = 8000,
} = {}) {
  const highlight = useCallback(() => {
    const el = document.getElementById(targetId)
    if (el) {
      try {
        el.scrollIntoView({ behavior, block: 'start' })
      } catch (_e) {
        try {
          // Fallback for older browsers
          window.location.hash = `#${targetId}`
        } catch (_ee) {}
      }

      // Reset classes to ensure animation can replay
      el.classList.remove('footer-contact-glow')
      el.classList.add('footer-contact-pulse')

      const onAnimEnd = () => {
        el.classList.remove('footer-contact-pulse')
        el.classList.add('footer-contact-glow')
        el.removeEventListener('animationend', onAnimEnd)
      }
      el.addEventListener('animationend', onAnimEnd, { once: true })
    }

    // Register a one-time global click and an auto-clear fallback (max lifetime)
    let autoClearTimer = null
    let clickOnceRef = null

    const clickOnce = () => {
      const target = document.getElementById(targetId)
      if (target) {
        target.classList.remove('footer-contact-pulse')
        target.classList.remove('footer-contact-glow')
      }
      document.removeEventListener('click', clickOnce, true)
      if (autoClearTimer) {
        clearTimeout(autoClearTimer)
        autoClearTimer = null
      }
    }

    // Defer to next tick so we don't capture current click that triggered highlight
    setTimeout(() => {
      clickOnceRef = clickOnce
      document.addEventListener('click', clickOnceRef, true)
    }, 0)

    // Auto-clear after configured max duration (default 8s)
    autoClearTimer = setTimeout(() => {
      const target = document.getElementById(targetId)
      if (target) {
        target.classList.remove('footer-contact-pulse')
        target.classList.remove('footer-contact-glow')
      }
      if (clickOnceRef) {
        document.removeEventListener('click', clickOnceRef, true)
      }
      autoClearTimer = null
    }, autoClearMs)
  }, [targetId, behavior, autoClearMs])

  return highlight
}