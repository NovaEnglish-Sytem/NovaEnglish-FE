import { useEffect } from 'react'

export default function useDismissableOverlay({
  ref,
  onClose,
  when = true,
  options = {},
}) {
  const {
    capture = true,
    closeOnScroll = true,
  } = options || {}

  useEffect(() => {
    if (!when) return
    if (typeof onClose !== 'function') return

    const onClickOutside = (e) => {
      const el = ref?.current
      if (!el) return
      if (!el.contains(e.target)) {
        onClose()
      }
    }

    const onScroll = () => {
      if (closeOnScroll) onClose()
    }

    document.addEventListener('click', onClickOutside, capture)
    if (closeOnScroll) {
      window.addEventListener('scroll', onScroll, { passive: true })
    }

    return () => {
      document.removeEventListener('click', onClickOutside, capture)
      if (closeOnScroll) {
        window.removeEventListener('scroll', onScroll)
      }
    }
  }, [ref, onClose, when, capture, closeOnScroll])
}