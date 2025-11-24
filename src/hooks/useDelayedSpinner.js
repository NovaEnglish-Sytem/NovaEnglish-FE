import { useEffect, useState } from 'react'

// Show a secondary spinner only if isLoading stays true longer than delayMs
export function useDelayedSpinner(isLoading, delayMs = 700) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      setVisible(false)
      return
    }
    const t = setTimeout(() => {
      // Only show if still loading after delay
      setVisible(true)
    }, delayMs)
    return () => clearTimeout(t)
  }, [isLoading, delayMs])

  return visible
}

export default useDelayedSpinner
